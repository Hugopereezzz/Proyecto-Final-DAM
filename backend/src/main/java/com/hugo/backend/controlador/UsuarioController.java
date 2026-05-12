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

    @PostMapping("/login")
    public ResponseEntity<Usuario> login(@RequestBody Map<String, String> credenciales) {
        return usuarioService.login(credenciales.get("nombreUsuario"), credenciales.get("contrasena"))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(401).build());
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

    @PostMapping("/{id}/comprar-faccion")
    public ResponseEntity<Faccion> comprarFaccion(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(faccionService.comprarFaccion(id, body.get("nombre"), body.get("tipo")));
    }
}
