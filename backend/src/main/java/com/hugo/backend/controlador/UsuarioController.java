package com.hugo.backend.controlador;

import com.hugo.backend.modelo.Faccion;
import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.servicio.FaccionService;
import com.hugo.backend.servicio.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

//Controlador de usuarios.
//Gestiona todo lo relacionado con los usuarios normales de la app.
//Algunas rutas son publicas (registro, login, logout) y el resto requieren token JWT.
@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*") // Permite peticiones desde cualquier dominio (CORS)
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private FaccionService faccionService;

    //Registra un usuario nuevo.
    //@Valid comprueba que el objeto Usuario cumple las validaciones definidas en el modelo
    //(que el nickname no esta vacio, y esas cosas)
    @PostMapping("/registro")
    public ResponseEntity<Usuario> registrarUsuario(@Valid @RequestBody Usuario usuario) {
        return ResponseEntity.ok(usuarioService.guardarUsuario(usuario));
    }

    //Login para usuarios normales (no el admin).
    //El frontend manda: { "nombreUsuario": "hugo", "contrasena": "1234" }
    //Respuestas posibles:
    // 200 -> login correcto, devuelve el usuario con su sessionToken
    // 401 -> contrasena o usuario incorrectos
    // 409 -> el usuario ya esta logueado en otra ventana (sesion activa)
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciales) {
        String nickname = credenciales.get("nombreUsuario");
        String password = credenciales.get("contrasena");

        Optional<Usuario> resultado = usuarioService.login(nickname, password);
        if (resultado.isPresent()) {
            //Login correcto -> devuelve el usuario con su sessionToken
            return ResponseEntity.ok(resultado.get());
        }

        //Si el login da fallo, comprueba si es porque ya tiene sesion activa en otro lado
        boolean sesionActiva = usuarioService.tieneSesionActiva(nickname, password);
        if (sesionActiva) {
            return ResponseEntity.status(409).body("Usuario ya conectado desde otra ventana");
        }

        //Si no es por sesion activa, es que las credenciales son incorrectas
        return ResponseEntity.status(401).body("Credenciales invalidas");
    }

    // Cierra la sesion del usuario borrando su sessionToken inmediatamente al darle al boton.
    //El frontend manda JSON: { "sessionToken": "abc123..." }
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> body) {
        String token = body.get("sessionToken");

        //Si no mandan token, error
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body("sessionToken requerido");
        }

        boolean ok = usuarioService.logout(token);
        return ok
                ? ResponseEntity.ok("Sesion cerrada")           // 200 -> sesion cerrada bien
                : ResponseEntity.status(404).body("Sesion no encontrada"); // 404 -> no existia ese token
    }

    // Renueva la sesion del usuario otros 3 minutos para que no expire mientras esta activo.
    // El frontend llama a este endpoint cada 2 minutos automaticamente.
    // El frontend manda: { "sessionToken": "abc123..." }
    //   200 -> sesion renovada correctamente
    //   401 -> el token ya expiro, el frontend debe hacer logout
    @PostMapping("/refresh-session")
    public ResponseEntity<?> refreshSession(@RequestBody Map<String, String> body) {
        String token = body.get("sessionToken");

        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body("sessionToken requerido");
        }

        boolean ok = usuarioService.refreshSession(token);
        return ok
                ? ResponseEntity.ok("Sesion renovada")
                : ResponseEntity.status(401).body("Sesion caducada");
    }

    //Devuelve la lista de usuarios ordenados por victorias (de mayor a menor)
    @GetMapping("/ranking")
    public List<Usuario> ranking() {
        return usuarioService.obtenerRanking();
    }

    //Devuelve la lista de todos los usuarios registrados
    @GetMapping
    public List<Usuario> listarUsuarios() {
        return usuarioService.obtenerTodos();
    }

    //Devuelve un usuario concreto buscandolo por su ID.
    //Ejemplo: GET /api/usuarios/5 -> devuelve el usuario con ID 5
    //Si no existe devuelve 404 9not found)
    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtenerUsuario(@PathVariable Long id) {
        return usuarioService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    //Actualiza los datos de un usuario existente buscandolo por su ID.
    //El frontend manda en el JSON los nuevos datos del usuario
    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario usuario) {
        return ResponseEntity.ok(usuarioService.actualizarUsuario(id, usuario));
    }

    //Elimina un usuario por su ID.
    //Devuelve 204 (No Content) que significa "se hizo bien pero no hay nada que devolver"
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.noContent().build();
    }

    //Suma una victoria al usuario indicado por su username.
    //Se llama cuando una partida termina y hay un ganador.
    //Ejemplo: POST /api/usuarios/incrementar-victorias/hugo -> +1 victoria a "hugo"
    @PostMapping("/incrementar-victorias/{username}")
    public ResponseEntity<Void> incrementarVictorias(@PathVariable String username) {
        System.out.println("[API] Incrementando victorias para: " + username);
        usuarioService.incrementarVictorias(username);
        return ResponseEntity.ok().build();
    }

    //Devuelve todas las facciones que tiene un usuario concreto.
    //Ejemplo: GET /api/usuarios/5/facciones -> facciones del usuario con ID 5
    @GetMapping("/{id}/facciones")
    public ResponseEntity<List<Faccion>> listarFaccionesUsuario(@PathVariable Long id) {
        return usuarioService.obtenerPorId(id)
                .map(u -> ResponseEntity.ok(u.getFacciones()))
                .orElse(ResponseEntity.notFound().build());
    }

    //Permite a un usuario comprar una faccion nueva.
    //{id} es el ID del usuario que compra.
    //El frontend manda: { "nombre": "Los Elfos", "tipo": "magia" }
    @PostMapping("/comprarFaccion/{id}")
    public ResponseEntity<Faccion> comprarFaccion(@PathVariable Long id, @RequestBody PurchaseRequest request) {
        return ResponseEntity.ok(faccionService.comprarFaccion(id, request.getNombre(), request.getTipo()));
    }

    //Clase auxiliar que representa el cuerpo de la peticion de compra de faccion.
    //Solo existe para poder recibir el JSON con nombre y tipo de la faccion a comprar.
    //{ "nombre": "Los Elfos", "tipo": "magia" }
    public static class PurchaseRequest {
        private String nombre;
        private String tipo;
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
    }
}