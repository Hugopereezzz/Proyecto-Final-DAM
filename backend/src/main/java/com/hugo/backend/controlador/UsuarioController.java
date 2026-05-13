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

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private FaccionService faccionService;

    @PostMapping("/registro")
    public ResponseEntity<Usuario> registrarUsuario(@Valid @RequestBody Usuario usuario) {
        return ResponseEntity.ok(usuarioService.guardarUsuario(usuario));
    }

    /**
     * Login con control de sesión única.
     * - 200: login correcto, devuelve el objeto Usuario (con sessionToken).
     * - 401: credenciales incorrectas.
     * - 409: el usuario ya tiene una sesión activa (ya está logueado en otro lugar).
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credenciales) {
        String nickname = credenciales.get("nombreUsuario");
        String password = credenciales.get("contrasena");

        Optional<Usuario> resultado = usuarioService.login(nickname, password);
        if (resultado.isPresent()) {
            return ResponseEntity.ok(resultado.get());
        }

        // Comprobar si el fallo es por sesión activa o por credenciales incorrectas
        boolean sesionActiva = usuarioService.tieneSesionActiva(nickname, password);
        if (sesionActiva) {
            return ResponseEntity.status(409).body("Usuario ya conectado desde otra ventana");
        }

        return ResponseEntity.status(401).body("Credenciales inválidas");
    }

    /**
     * Logout: borra el sessionToken del usuario.
     * El frontend debe enviar { "sessionToken": "..." }
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody Map<String, String> body) {
        String token = body.get("sessionToken");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body("sessionToken requerido");
        }
        boolean ok = usuarioService.logout(token);
        return ok
                ? ResponseEntity.ok("Sesión cerrada")
                : ResponseEntity.status(404).body("Sesión no encontrada");
    }

    /**
     * Renueva la expiración del token activo otros 3 minutos.
     * El frontend llama a este endpoint cada 2 minutos mientras el usuario esté activo.
     * - 200: token renovado correctamente.
     * - 401: token caducado o inexistente → el frontend debe hacer logout.
     */
    @PostMapping("/refresh-session")
    public ResponseEntity<?> refreshSession(@RequestBody Map<String, String> body) {
        String token = body.get("sessionToken");
        if (token == null || token.isBlank()) {
            return ResponseEntity.badRequest().body("sessionToken requerido");
        }
        boolean ok = usuarioService.refreshSession(token);
        return ok
                ? ResponseEntity.ok("Sesión renovada")
                : ResponseEntity.status(401).body("Sesión caducada");
    }

    @GetMapping("/ranking")
    public List<Usuario> ranking() {
        return usuarioService.obtenerRanking();
    }

    @GetMapping
    public List<Usuario> listarUsuarios() {
        return usuarioService.obtenerTodos();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> obtenerUsuario(@PathVariable Long id) {
        return usuarioService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Usuario> actualizarUsuario(@PathVariable Long id, @RequestBody Usuario usuario) {
        return ResponseEntity.ok(usuarioService.actualizarUsuario(id, usuario));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarUsuario(@PathVariable Long id) {
        usuarioService.eliminarUsuario(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/incrementar-victorias/{username}")
    public ResponseEntity<Void> incrementarVictorias(@PathVariable String username) {
        System.out.println("[API] Incrementando victorias para: " + username);
        usuarioService.incrementarVictorias(username);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/facciones")
    public ResponseEntity<List<Faccion>> listarFaccionesUsuario(@PathVariable Long id) {
        return usuarioService.obtenerPorId(id)
                .map(u -> ResponseEntity.ok(u.getFacciones()))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/comprarFaccion/{id}")
    public ResponseEntity<Faccion> comprarFaccion(@PathVariable Long id, @RequestBody PurchaseRequest request) {
        return ResponseEntity.ok(faccionService.comprarFaccion(id, request.getNombre(), request.getTipo()));
    }

    // DTO temporal para la petición
    public static class PurchaseRequest {
        private String nombre;
        private String tipo;
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        public String getTipo() { return tipo; }
        public void setTipo(String tipo) { this.tipo = tipo; }
    }
}
