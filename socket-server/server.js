// ============================================================
// SERVIDOR SOCKET.IO - Gestion de salas y chat en tiempo real
// Se ejecuta en el puerto 3000 de forma independiente a Spring Boot
// ============================================================

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors()); //Permite peticiones desde cualquier origen

//Crea el servidor HTTP y le adjunta Socket.io por encima.
//Socket.io necesita un servidor HTTP normal como base para funcionar.
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', //Permite conexiones desde el frontend (localhost:4200)
    methods: ['GET', 'POST']
  }
});

// ============================================================
// ALMACEN EN MEMORIA
// Estos dos mapas son la "base de datos" temporal del servidor.
// Se pierden si el servidor se reinicia.
// ============================================================

//Guarda todas las salas existentes.
//Formato: { codigoSala: { nombre, tipo, jugadores, maxJugadores, enPartida } }
const salas = new Map();

//Guarda todos los usuarios conectados en este momento.
//Formato: { socketId: { nombre, salaActual } }
const usuarios = new Map();

//Genera un codigo de sala aleatorio de 6 caracteres en mayusculas.
//Ejemplo: "A3F9K2"
function generarCodigoSala() {
  return uuidv4().substring(0, 6).toUpperCase();
}

//Devuelve solo las salas que son publicas, no estan en partida y no estan llenas.
//Se usa para mostrar el lobby de salas disponibles.
function obtenerSalasPublicas() {
  const salasPublicas = [];
  salas.forEach((sala, codigo) => {
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
// io.on('connection') se dispara cada vez que un cliente se conecta.
// Cada cliente recibe un socket.id unico para identificarlo.
// ============================================================
io.on('connection', (socket) => {
  console.log(`[CONEXION] Nuevo cliente conectado: ${socket.id}`);

  // ---------------------------------------------------------
  // El cliente manda su nombre de usuario al conectarse.
  // Se guarda en el mapa de usuarios para saber quien es cada socket.
  // ---------------------------------------------------------
  socket.on('identificar', (nombreUsuario) => {
    usuarios.set(socket.id, { nombre: nombreUsuario, salaActual: null });
    console.log(`[ID] Usuario "${nombreUsuario}" identificado con socket ${socket.id}`);

    //Manda las salas publicas disponibles al usuario recien conectado
    socket.emit('salas-actualizadas', obtenerSalasPublicas());

    //Mensaje de bienvenida solo para este usuario
    socket.emit('mensaje-global', {
      remitente: 'SISTEMA',
      contenido: `Bienvenido al chat global, ${nombreUsuario}.`,
      tipo: 'sistema'
    });

    //Notifica a TODOS los demas que este usuario se conecto
    socket.broadcast.emit('mensaje-global', {
      remitente: 'SISTEMA',
      contenido: `${nombreUsuario} se ha conectado.`,
      tipo: 'sistema'
    });
  });

  // ---------------------------------------------------------
  // El cliente quiere crear una sala nueva.
  // Recibe: { nombre, tipo } donde tipo es 'publica' o 'privada'
  // ---------------------------------------------------------
  socket.on('crear-sala', ({ nombre, tipo }) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario) return;

    //Genera un codigo unico que no exista ya en el mapa de salas
    let codigo;
    do {
      codigo = generarCodigoSala();
    } while (salas.has(codigo));

    //Crea la sala con el creador como primer jugador y como host
    const nuevaSala = {
      nombre,
      tipo,
      host: socket.id,       //El que crea la sala es el host
      maxJugadores: 4,
      enPartida: false,       //Todavia no se esta jugando
      planesRonda: {},        //Aqui se guardan los planes de cada jugador en cada ronda
      jugadores: [
        { socketId: socket.id, nombre: usuario.nombre, listo: false }
      ]
    };
    salas.set(codigo, nuevaSala);
    usuario.salaActual = codigo;

    //Une este socket a la "room" de Socket.io con el codigo de sala.
    //Esto permite mandar mensajes solo a los jugadores de esa sala.
    socket.join(codigo);

    console.log(`[SALA] Sala "${nombre}" creada con codigo ${codigo} por ${usuario.nombre}`);

    //Confirma al creador que la sala se creo correctamente
    socket.emit('sala-creada', { ok: true, codigo, sala: nuevaSala });

    //Si es publica, actualiza el lobby para todos los usuarios
    if (tipo === 'publica') {
      io.emit('salas-actualizadas', obtenerSalasPublicas());
    }
  });

  // ---------------------------------------------------------
  // El cliente quiere unirse a una sala existente con su codigo.
  // Recibe: { codigo }
  // ---------------------------------------------------------
  socket.on('unirse-sala', ({ codigo }) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario) return;

    const codigoUpper = codigo.toUpperCase();
    const sala = salas.get(codigoUpper);

    //Validaciones antes de unirse
    if (!sala) {
      socket.emit('error-sala', { mensaje: 'El codigo de sala no existe.' });
      return;
    }
    if (sala.enPartida) {
      socket.emit('error-sala', { mensaje: 'No puedes unirte. La partida ya ha comenzado.' });
      return;
    }
    if (sala.jugadores.length >= sala.maxJugadores) {
      socket.emit('error-sala', { mensaje: 'La sala esta llena.' });
      return;
    }

    //Si ya estaba en la sala, le confirma que sigue dentro sin hacer nada mas
    const yaEsta = sala.jugadores.find(j => j.socketId === socket.id);
    if (yaEsta) {
      socket.emit('sala-unido', { ok: true, codigo: codigoUpper, sala });
      return;
    }

    //Añade al jugador a la sala
    sala.jugadores.push({ socketId: socket.id, nombre: usuario.nombre, listo: false });
    usuario.salaActual = codigoUpper;
    socket.join(codigoUpper);

    console.log(`[SALA] ${usuario.nombre} se unio a la sala ${codigoUpper}`);

    //Notifica a TODOS en la sala que hay un jugador nuevo
    io.to(codigoUpper).emit('sala-actualizada', sala);

    //Confirma al jugador que se unio correctamente
    socket.emit('sala-unido', { ok: true, codigo: codigoUpper, sala });

    //Actualiza el lobby para todos (cambia el contador de jugadores)
    io.emit('salas-actualizadas', obtenerSalasPublicas());
  });

  // ---------------------------------------------------------
  // El jugador pulsa el boton de listo/no listo en la sala.
  // Cambia su estado y notifica a todos en la sala.
  // ---------------------------------------------------------
  socket.on('cambiar-listo', () => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    const sala = salas.get(usuario.salaActual);
    if (!sala) return;

    //Invierte el estado de listo del jugador (true->false o false->true)
    const jugador = sala.jugadores.find(j => j.socketId === socket.id);
    if (jugador) {
      jugador.listo = !jugador.listo;
      console.log(`[LISTO] ${usuario.nombre} listo: ${jugador.listo}`);
    }

    //Notifica a todos en la sala del cambio
    io.to(usuario.salaActual).emit('sala-actualizada', sala);
  });

  // ---------------------------------------------------------
  // El jugador manda un mensaje al chat de su sala.
  // Solo lo reciben los jugadores de esa sala.
  // Recibe: { contenido }
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

    //io.to(sala) manda el mensaje SOLO a los jugadores de esa sala
    io.to(usuario.salaActual).emit('mensaje-sala', mensaje);
  });

  // ---------------------------------------------------------
  // El jugador manda un mensaje al chat global.
  // Lo reciben TODOS los usuarios conectados al servidor.
  // Recibe: { contenido }
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

    //io.emit sin sala manda el mensaje a TODOS
    io.emit('mensaje-global', mensaje);
  });

  // ---------------------------------------------------------
  // El jugador abandona la sala en la que esta.
  // Si era el host y quedan jugadores, se reasigna el host.
  // Si era el ultimo, se borra la sala.
  // ---------------------------------------------------------
  socket.on('salir-sala', () => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    const codigo = usuario.salaActual;
    const sala = salas.get(codigo);

    if (sala) {
      //Elimina al jugador de la lista
      sala.jugadores = sala.jugadores.filter(j => j.socketId !== socket.id);

      if (sala.jugadores.length === 0) {
        //Si no quedan jugadores, borra la sala
        salas.delete(codigo);
        console.log(`[SALA] Sala ${codigo} eliminada (sin jugadores)`);
      } else {
        //Si el host se fue, el siguiente jugador de la lista pasa a ser host
        if (sala.host === socket.id) {
          sala.host = sala.jugadores[0].socketId;
        }
        //Notifica a los que quedan del cambio
        io.to(codigo).emit('sala-actualizada', sala);
      }
    }

    socket.leave(codigo);       //Saca el socket de la room de Socket.io
    usuario.salaActual = null;  //Limpia la sala actual del usuario

    //Actualiza el lobby para todos
    io.emit('salas-actualizadas', obtenerSalasPublicas());
    console.log(`[SALA] ${usuario.nombre} salio de la sala ${codigo}`);
  });

  // ---------------------------------------------------------
  // El cliente pide la lista actualizada de salas publicas.
  // Se usa al entrar al lobby para ver las salas disponibles.
  // ---------------------------------------------------------
  socket.on('pedir-salas', () => {
    socket.emit('salas-actualizadas', obtenerSalasPublicas());
  });

  // ============================================================
  // EVENTOS DE JUEGO
  // ============================================================

  //El host pulsa el boton de iniciar juego.
  //Valida que todos esten listos y tengan faccion elegida antes de empezar.
  socket.on('iniciar-juego', () => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    const sala = salas.get(usuario.salaActual);
    if (!sala || sala.host !== socket.id) return; //Solo el host puede iniciar

    //Todos deben estar marcados como listos
    const todosListos = sala.jugadores.every(j => j.listo);
    if (!todosListos) {
      socket.emit('error-sala', { mensaje: 'Todos los operativos deben estar LISTOS.' });
      return;
    }

    //Todos deben haber elegido una faccion
    const todosTienenFaccion = sala.jugadores.every(j => !!j.faccionId);
    if (!todosTienenFaccion) {
      socket.emit('error-sala', { mensaje: 'Todos los operativos deben ELEGIR FACCION.' });
      return;
    }

    if (sala.jugadores.length < 2) {
      socket.emit('error-sala', { mensaje: 'Se necesitan al menos 2 operativos.' });
      return;
    }

    //Marca la sala como en partida para que no aparezca en el lobby
    sala.enPartida = true;
    io.emit('salas-actualizadas', obtenerSalasPublicas());

    console.log(`[JUEGO] Iniciando batalla en sala ${usuario.salaActual}`);

    //Prepara los datos de la batalla: IDs de facciones, nombres y orden aleatorio de turno
    const ids = sala.jugadores.map(j => j.faccionId);
    const nombres = sala.jugadores.map(j => j.nombre);
    const order = ids.map((_, i) => i).sort(() => Math.random() - 0.5); //Orden aleatorio

    //Notifica a todos en la sala que la batalla ha comenzado con estos datos
    io.to(usuario.salaActual).emit('batalla-comenzada', { ids, order, nombres });
  });

  //Un jugador elige su faccion en la sala de espera.
  //Guarda la eleccion y notifica a todos en la sala.
  socket.on('seleccionar-faccion', (faccionId) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    const sala = salas.get(usuario.salaActual);
    if (!sala) return;

    const jugador = sala.jugadores.find(j => j.socketId === socket.id);
    if (jugador) {
      jugador.faccionId = faccionId;
      console.log(`[JUEGO] ${jugador.nombre} eligio faccion: ${faccionId}`);
    }

    //Notifica a todos en la sala de la eleccion
    io.to(usuario.salaActual).emit('sala-actualizada', sala);
  });

  //Un jugador realiza una accion de combate (ataque, habilidad, rendicion...).
  //Se reenvía a todos en la sala para que el juego este sincronizado.
  socket.on('realizar-accion', (accion) => {
    const usuario = usuarios.get(socket.id);
    const salaId = usuario?.salaActual || Array.from(socket.rooms).find(r => r !== socket.id);
    if (!salaId) return;

    const sala = salas.get(salaId);

    //Si la accion es rendicion o muerte, marca al jugador como eliminado
    //para no esperarle en la resolucion de planes
    if (sala && (accion.abilityId === 'system_surrender' || accion.abilityId === 'system_death')) {
      if (!sala.eliminados) sala.eliminados = new Set();
      sala.eliminados.add(socket.id);
      console.log(`[JUEGO] Sala ${salaId}: ${usuario?.nombre || 'Alguien'} se ha eliminado del conteo de planes.`);
    }

    console.log(`[ACCION] Sala ${salaId}: ${usuario?.nombre || 'Desconocido'} -> ${accion.abilityId}`);

    //Reenvia la accion a todos en la sala para que todos vean lo que paso
    io.to(salaId).emit('accion-recibida', accion);
  });

  //Sincroniza el inicio oficial de la batalla y resetea los planes de ronda anteriores.
  socket.on('comenzar-batalla', (datosBatalla) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    //Limpia los planes y eliminados de la partida anterior
    const sala = salas.get(usuario.salaActual);
    if (sala) {
        sala.planesRonda = {};
        sala.eliminados = new Set();
    }

    io.to(usuario.salaActual).emit('batalla-comenzada', datosBatalla);
  });

  //Recibe el plan de accion de un jugador para esta ronda.
  //Cuando todos los jugadores activos han enviado su plan, resuelve la ronda.
  socket.on('enviar-plan', ({ actorIdx, plan }) => {
    const usuario = usuarios.get(socket.id);
    if (!usuario || !usuario.salaActual) return;

    const sala = salas.get(usuario.salaActual);
    if (!sala) return;

    //Guarda el plan de este jugador
    sala.planesRonda[socket.id] = { actorIdx, plan };
    console.log(`[PLAN] Sala ${usuario.salaActual}: ${usuario.nombre} envio su plan.`);

    //Notifica a los demas que este jugador ya envio su plan (sin revelar el contenido)
    socket.to(usuario.salaActual).emit('plan-recibido', { actorIdx, plan: null });

    //Calcula cuantos jugadores activos (no eliminados) deben enviar plan
    if (!sala.eliminados) sala.eliminados = new Set();
    const jugadoresEsperados = sala.jugadores.filter(j => !sala.eliminados.has(j.socketId)).length;

    //Cuando todos los jugadores activos han enviado su plan, resuelve la ronda
    if (Object.keys(sala.planesRonda).length >= jugadoresEsperados) {
      console.log(`[RESOLUCION] Sala ${usuario.salaActual}: Todos los planes recibidos. Enviando resolucion.`);

      const todosLosPlanes = Object.values(sala.planesRonda);
      const seed = Math.random(); //Semilla aleatoria para que todos los clientes calculen lo mismo

      //Manda todos los planes y la semilla a todos en la sala para resolver la ronda
      io.to(usuario.salaActual).emit('ronda-resuelta', {
        planes: todosLosPlanes,
        seed: seed
      });

      //Limpia los planes para la siguiente ronda
      sala.planesRonda = {};
    }
  });

  // ---------------------------------------------------------
  // El cliente se desconecta (cierra la pestaña, pierde conexion...).
  // Se limpia todo lo relacionado con ese usuario automaticamente.
  // ---------------------------------------------------------
  socket.on('disconnect', () => {
    const usuario = usuarios.get(socket.id);
    if (usuario) {
      //Si estaba en una sala, lo elimina de ella
      if (usuario.salaActual) {
        const sala = salas.get(usuario.salaActual);
        if (sala) {
          sala.jugadores = sala.jugadores.filter(j => j.socketId !== socket.id);
          if (sala.jugadores.length === 0) {
            salas.delete(usuario.salaActual); //Borra la sala si quedo vacia
          } else {
            if (sala.host === socket.id) sala.host = sala.jugadores[0].socketId; //Reasigna host
            io.to(usuario.salaActual).emit('sala-actualizada', sala);
          }
        }
      }

      //Notifica al chat global que el usuario se desconecto
      socket.broadcast.emit('mensaje-global', {
        remitente: 'SISTEMA',
        contenido: `${usuario.nombre} se ha desconectado.`,
        tipo: 'sistema'
      });

      //Limpia al usuario del mapa y actualiza el lobby
      usuarios.delete(socket.id);
      io.emit('salas-actualizadas', obtenerSalasPublicas());
      console.log(`[DESCONEXION] Usuario "${usuario.nombre}" desconectado`);
    }
  });
});

// ============================================================
// RUTA DE ESTADO
// GET /status -> devuelve cuantas salas y usuarios hay activos.
// Sirve para comprobar rapidamente que el servidor esta vivo.
// ============================================================
app.get('/status', (req, res) => {
  res.json({ estado: 'activo', salas: salas.size, usuarios: usuarios.size });
});

// ============================================================
// ARRANCA EL SERVIDOR EN EL PUERTO 3000
// ============================================================
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`\n Servidor Socket.io ejecutandose en http://localhost:${PORT}`);
  console.log(`   Estado: http://localhost:${PORT}/status\n`);
});