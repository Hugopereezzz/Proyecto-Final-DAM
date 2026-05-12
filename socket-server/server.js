// ============================================================
// SERVIDOR SOCKET.IO - Gestión de salas y chat en tiempo real
// Se ejecuta en el puerto 3000 de forma independiente a Spring Boot
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

// Crear servidor HTTP y adjuntar Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Permite conexiones desde el frontend Angular (localhost:4200)
    methods: ['GET', 'POST']
  }
});

// ============================================================
// ALMACÉN EN MEMORIA
// En producción esto iría a una base de datos como Redis
// ============================================================

// Mapa de salas: { codigoSala: { nombre, tipo, jugadores: [], maxJugadores: 4, enPartida: false } }
const salas = new Map();

// Mapa de usuarios conectados: { socketId: { nombre, salaActual } }
const usuarios = new Map();

// ============================================================
// FUNCIÓN AUXILIAR: Generar código único de sala (6 caracteres)
// ============================================================
function generarCodigoSala() {
  return uuidv4().substring(0, 6).toUpperCase();
}

// ============================================================
// FUNCIÓN AUXILIAR: Obtener todas las salas públicas
// ============================================================
function obtenerSalasPublicas() {
  const salasPublicas = [];
  salas.forEach((sala, codigo) => {
    // SOLO MOSTRAR SALAS PÚBLICAS QUE NO ESTÉN EN PARTIDA Y NO ESTÉN LLENAS
    if (sala.tipo === 'publica' && !sala.enPartida && sala.jugadores.length < sala.maxJugadores) {
      salasPublicas.push({
        codigo,
        nombre: sala.nombre,
        jugadoresActuales: sala.jugadores.length,
        maxJugadores: sala.maxJugadores
      });
    }
  });
  return salasPublicas;
}

// ============================================================
// EVENTOS SOCKET.IO
// ============================================================
io.on('connection', (socket) => {
  console.log(`[CONEXION] Nuevo cliente conectado: ${socket.id}`);

  // ---------------------------------------------------------
  // EVENTO: El cliente se identifica con su nombre de usuario
  // ---------------------------------------------------------
  socket.on('identificar', (nombreUsuario) => {
    usuarios.set(socket.id, { nombre: nombreUsuario, salaActual: null });
    console.log(`[ID] Usuario "${nombreUsuario}" identificado con socket ${socket.id}`);

    // Enviar las salas públicas al usuario que acaba de conectarse
    socket.emit('salas-actualizadas', obtenerSalasPublicas());

    // Bienvenida en el chat global
    socket.emit('mensaje-global', {
      remitente: 'SISTEMA',
      contenido: `Bienvenido al chat global, ${nombreUsuario}.`,
      tipo: 'sistema'
    });

    // Notificar al resto que alguien se conectó
    socket.broadcast.emit('mensaje-global', {
      remitente: 'SISTEMA',
      contenido: `${nombreUsuario} se ha conectado.`,
      tipo: 'sistema'
    });
  });

  // ---------------------------------------------------------
  // EVENTO: Crear una nueva sala
  // Recibe: { nombre: string, tipo: 'publica' | 'privada' }
  // Emite de vuelta: { ok: boolean, codigo, sala? }
  // ---------------------------------------------------------
  socket.on('crear-sala', ({ nombre, tipo }) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario) return;

    // Generar un código único garantizado
    let codigo;
    do {
      codigo = generarCodigoSala();
    } while (salas.has(codigo));

    // Crear la sala en memoria
    const nuevaSala = {
      nombre,
      tipo,
      host: socket.id,
      maxJugadores: 4,
      enPartida: false, // Inicialmente no se está jugando
      planesRonda: {},  // Almacena los planes de cada ronda { socketId: { actorIdx, plan } }
      jugadores: [
        { socketId: socket.id, nombre: usuario.nombre, listo: false }
      ]
    };
    salas.set(codigo, nuevaSala);
    usuario.salaActual = codigo;

    // Unir el socket a la "room" de Socket.io para el chat de sala
    socket.join(codigo);

    console.log(`[SALA] Sala "${nombre}" creada con código ${codigo} por ${usuario.nombre}`);

    // Responder al creador con el código y el estado inicial de la sala
    socket.emit('sala-creada', { ok: true, codigo, sala: nuevaSala });

    // Si es pública, notificar a todos los usuarios del lobby
    if (tipo === 'publica') {
      io.emit('salas-actualizadas', obtenerSalasPublicas());
    }
  });

  // ---------------------------------------------------------
  // EVENTO: Unirse a una sala existente mediante código
  // Recibe: { codigo: string }
  // ---------------------------------------------------------
  socket.on('unirse-sala', ({ codigo }) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario) return;

    const codigoUpper = codigo.toUpperCase();
    const sala = salas.get(codigoUpper);

    // Validaciones
    if (!sala) {
      socket.emit('error-sala', { mensaje: 'El código de sala no existe.' });
      return;
    }
    if (sala.enPartida) {
      socket.emit('error-sala', { mensaje: 'No puedes unirte. La partida ya ha comenzado.' });
      return;
    }
    if (sala.jugadores.length >= sala.maxJugadores) {
      socket.emit('error-sala', { mensaje: 'La sala está llena.' });
      return;
    }
    // Comprobar que no esté ya dentro
    const yaEsta = sala.jugadores.find(j => j.socketId === socket.id);
    if (yaEsta) {
      socket.emit('sala-unido', { ok: true, codigo: codigoUpper, sala });
      return;
    }

    // Añadir jugador a la sala
    sala.jugadores.push({ socketId: socket.id, nombre: usuario.nombre, listo: false });
    usuario.salaActual = codigoUpper;
    socket.join(codigoUpper);

    console.log(`[SALA] ${usuario.nombre} se unió a la sala ${codigoUpper}`);

    // Notificar a todos en la sala del estado actualizado
    io.to(codigoUpper).emit('sala-actualizada', sala);

    // Confirmar al jugador que se ha unido
    socket.emit('sala-unido', { ok: true, codigo: codigoUpper, sala });

    // Actualizar lista de salas públicas para todos (puede haber cambiado el conteo)
    io.emit('salas-actualizadas', obtenerSalasPublicas());
  });

  // ---------------------------------------------------------
  // EVENTO: Marcar/desmarcar "Listo" en una sala
  // ---------------------------------------------------------
  socket.on('cambiar-listo', () => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    const sala = salas.get(usuario.salaActual);
    if (!sala) return;

    // Cambiar el estado de listo del jugador
    const jugador = sala.jugadores.find(j => j.socketId === socket.id);
    if (jugador) {
      jugador.listo = !jugador.listo;
      console.log(`[LISTO] ${usuario.nombre} listo: ${jugador.listo}`);
    }

    // Notificar a todos en la sala
    io.to(usuario.salaActual).emit('sala-actualizada', sala);
  });

  // ---------------------------------------------------------
  // EVENTO: Mensaje de chat de sala
  // Recibe: { contenido: string }
  // ---------------------------------------------------------
  socket.on('chat-sala', ({ contenido }) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    const mensaje = {
      remitente: usuario.nombre,
      contenido,
      tipo: 'usuario',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };

    // Enviar el mensaje SOLO a los jugadores de esa sala
    io.to(usuario.salaActual).emit('mensaje-sala', mensaje);
  });

  // ---------------------------------------------------------
  // EVENTO: Mensaje de chat global
  // Recibe: { contenido: string }
  // ---------------------------------------------------------
  socket.on('chat-global', ({ contenido }) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario) return;

    const mensaje = {
      remitente: usuario.nombre,
      contenido,
      tipo: 'usuario',
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };

    // Enviar el mensaje a TODOS los clientes conectados
    io.emit('mensaje-global', mensaje);
  });

  // ---------------------------------------------------------
  // EVENTO: Salir de la sala actual
  // ---------------------------------------------------------
  socket.on('salir-sala', () => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    const codigo = usuario.salaActual;
    const sala = salas.get(codigo);

    if (sala) {
      // Eliminar al jugador de la lista
      sala.jugadores = sala.jugadores.filter(j => j.socketId !== socket.id);

      // Si la sala quedó vacía, eliminarla; si no, actualizar a los demás
      if (sala.jugadores.length === 0) {
        salas.delete(codigo);
        console.log(`[SALA] Sala ${codigo} eliminada (sin jugadores)`);
      } else {
        // Si el host se fue, reasignar host al primero de la lista
        if (sala.host === socket.id) {
          sala.host = sala.jugadores[0].socketId;
        }
        io.to(codigo).emit('sala-actualizada', sala);
      }
    }

    socket.leave(codigo);
    usuario.salaActual = null;

    // Actualizar lista de salas públicas
    io.emit('salas-actualizadas', obtenerSalasPublicas());
    console.log(`[SALA] ${usuario.nombre} salió de la sala ${codigo}`);
  });

  // ---------------------------------------------------------
  // EVENTO: Pedir la lista de salas públicas actualizada
  // ---------------------------------------------------------
  socket.on('pedir-salas', () => {
    socket.emit('salas-actualizadas', obtenerSalasPublicas());
  });

  // ============================================================
  // EVENTOS DE JUEGO (MULTIJUGADOR)
  // ============================================================

  /**
   * El host inicia el juego desde la sala.
   */
  socket.on('iniciar-juego', () => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    const sala = salas.get(usuario.salaActual);
    if (!sala || sala.host !== socket.id) return;

    // VALIDACIÓN: Todos deben estar listos para comenzar
    const todosListos = sala.jugadores.every(j => j.listo);
    if (!todosListos) {
      socket.emit('error-sala', { mensaje: 'Todos los operativos deben estar LISTOS.' });
      return;
    }

    // VALIDACIÓN: Todos deben haber elegido facción
    const todosTienenFaccion = sala.jugadores.every(j => !!j.faccionId);
    if (!todosTienenFaccion) {
      socket.emit('error-sala', { mensaje: 'Todos los operativos deben ELEGIR FACCIÓN.' });
      return;
    }

    if (sala.jugadores.length < 2) {
      socket.emit('error-sala', { mensaje: 'Se necesitan al menos 2 operativos.' });
      return;
    }

    // SALTO DIRECTO A BATALLA
    sala.enPartida = true; // MARCAR SALA COMO EN PARTIDA
    io.emit('salas-actualizadas', obtenerSalasPublicas()); // ACTUALIZAR LOBBY GLOBAL

    console.log(`[JUEGO] Iniciando batalla en sala ${usuario.salaActual}`);
    const ids = sala.jugadores.map(j => j.faccionId);
    const nombres = sala.jugadores.map(j => j.nombre);
    const order = ids.map((_, i) => i).sort(() => Math.random() - 0.5);
    io.to(usuario.salaActual).emit('batalla-comenzada', { ids, order, nombres });
  });

  /**
   * Sincroniza la facción seleccionada por un jugador.
   */
  socket.on('seleccionar-faccion', (faccionId) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    const sala = salas.get(usuario.salaActual);
    if (!sala) return;

    const jugador = sala.jugadores.find(j => j.socketId === socket.id);
    if (jugador) {
      jugador.faccionId = faccionId;
      console.log(`[JUEGO] ${jugador.nombre} eligió facción: ${faccionId}`);
    }

    // Notificar a todos en la sala del cambio
    io.to(usuario.salaActual).emit('sala-actualizada', sala);
    
    // NOTA: Se ha eliminado el inicio automático de batalla aquí.
    // Ahora el host debe pulsar "Lanzar Batalla" manualmente en el cliente.
  });

  /**
   * Sincroniza una acción de combate.
   */
  socket.on('realizar-accion', (accion) => {
    const usuario = usuarios.get(socket.id);
    const salaId = usuario?.salaActual || Array.from(socket.rooms).find(r => r !== socket.id);
    
    if (!salaId) return;

    const sala = salas.get(salaId);
    if (sala && (accion.abilityId === 'system_surrender' || accion.abilityId === 'system_death')) {
      if (!sala.eliminados) sala.eliminados = new Set();
      sala.eliminados.add(socket.id);
      console.log(`[JUEGO] Sala ${salaId}: ${usuario?.nombre || 'Alguien'} se ha eliminado del conteo de planes.`);
    }

    console.log(`[ACCION] Sala ${salaId}: ${usuario?.nombre || 'Desconocido'} -> ${accion.abilityId}`);
    io.to(salaId).emit('accion-recibida', accion);
  });

  /**
   * Sincroniza el inicio oficial de la batalla (cuando todos tienen facción).
   */
  socket.on('comenzar-batalla', (datosBatalla) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;
    
    // Resetear planes al empezar
    const sala = salas.get(usuario.salaActual);
    if (sala) {
        sala.planesRonda = {};
        sala.eliminados = new Set(); // Limpiar eliminados de la partida anterior
    }
    
    io.to(usuario.salaActual).emit('batalla-comenzada', datosBatalla);
  });

  /**
   * Recibe el plan de un jugador y lo sincroniza.
   */
  socket.on('enviar-plan', ({ actorIdx, plan }) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    const sala = salas.get(usuario.salaActual);
    if (!sala) return;

    // Guardar el plan
    sala.planesRonda[socket.id] = { actorIdx, plan };
    
    console.log(`[PLAN] Sala ${usuario.salaActual}: ${usuario.nombre} envió su plan.`);

    socket.to(usuario.salaActual).emit('plan-recibido', { actorIdx, plan: null });

    // Conteo de jugadores que DEBEN enviar plan (los que no están eliminados/rendidos)
    if (!sala.eliminados) sala.eliminados = new Set();
    const jugadoresEsperados = sala.jugadores.filter(j => !sala.eliminados.has(j.socketId)).length;

    if (Object.keys(sala.planesRonda).length >= jugadoresEsperados) {
      console.log(`[RESOLUCION] Sala ${usuario.salaActual}: Todos los planes necesarios recibidos. Enviando resolución.`);
      
      const todosLosPlanes = Object.values(sala.planesRonda);
      const seed = Math.random();
      
      io.to(usuario.salaActual).emit('ronda-resuelta', { 
        planes: todosLosPlanes,
        seed: seed 
      });

      sala.planesRonda = {};
    }
  });

  // ---------------------------------------------------------
  // EVENTO: Cliente desconectado
  // ---------------------------------------------------------
  socket.on('disconnect', () => {
    const usuario = usuarios.get(socket.id);
    if (usuario) {
      // Limpiar la sala si estaba en una
      if (usuario.salaActual) {
        const sala = salas.get(usuario.salaActual);
        if (sala) {
          sala.jugadores = sala.jugadores.filter(j => j.socketId !== socket.id);
          if (sala.jugadores.length === 0) {
            salas.delete(usuario.salaActual);
          } else {
            if (sala.host === socket.id) sala.host = sala.jugadores[0].socketId;
            io.to(usuario.salaActual).emit('sala-actualizada', sala);
          }
        }
      }
      // Notificar al chat global
      socket.broadcast.emit('mensaje-global', {
        remitente: 'SISTEMA',
        contenido: `${usuario.nombre} se ha desconectado.`,
        tipo: 'sistema'
      });
      usuarios.delete(socket.id);
      io.emit('salas-actualizadas', obtenerSalasPublicas());
      console.log(`[DESCONEXION] Usuario "${usuario.nombre}" desconectado`);
    }
  });
});

// ============================================================
// RUTA DE ESTADO (para comprobar que el servidor está activo)
// ============================================================
app.get('/status', (req, res) => {
  res.json({ estado: 'activo', salas: salas.size, usuarios: usuarios.size });
});

// ============================================================
// INICIAR SERVIDOR EN EL PUERTO 3000
// ============================================================
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n🚀 Servidor Socket.io ejecutándose en http://localhost:${PORT}`);
  console.log(`   Estado: http://localhost:${PORT}/status\n`);
});
