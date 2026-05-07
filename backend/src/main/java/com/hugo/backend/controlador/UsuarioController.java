package com.hugo.backend.controlador;

import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.servicio.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controlador REST que expone los endpoints para la gestión de usuarios.
 * Permite la comunicación entre el frontend y el backend.
 */
@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*") // Permite peticiones desde cualquier origen (necesario para el frontend Angular)
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    /**
     * Registrar un nuevo usuario.
     */
    @PostMapping("/registro")
    public ResponseEntity<?> registrarUsuario(@Valid @RequestBody Usuario usuario) {
        try {
            // Guardamos el usuario usando el servicio
            Usuario guardado = usuarioService.guardarUsuario(usuario);
            return ResponseEntity.ok(guardado);
        } catch (RuntimeException e) {
            // Si el nombre ya existe, devolvemos error 409 (Conflict)
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    /**
     * Iniciar sesión.
     */
    @PostMapping("/login")
    public ResponseEntity<Usuario> login(@RequestBody Usuario loginRequest) {
        return usuarioService.validarLogin(loginRequest.getNombreUsuario(), loginRequest.getContrasena())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).build()); // 401 si falla el login
    }

    /**
     * Lista de todos los usuarios (para pruebas).
     */
    @GetMapping
    public List<Usuario> listarUsuarios() {
        return usuarioService.obtenerTodos();
    }

    /**
     * Ranking de los 10 mejores.
     */
    @GetMapping("/ranking")
    public List<Usuario> obtenerRanking() {
        return usuarioService.obtenerRanking();
    }
}
