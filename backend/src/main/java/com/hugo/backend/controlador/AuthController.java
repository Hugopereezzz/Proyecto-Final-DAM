package com.hugo.backend.controlador;

import com.hugo.backend.servicio.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");

        String token = authService.loginAdmin(username, password);
        if (token != null) {
            return ResponseEntity.ok(Map.of("token", token));
        }

        return ResponseEntity.status(401).body("Credenciales inválidas");
    }

    @PostMapping("/reset-middleware-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String newPassword = request.get("newPassword");
        if (authService.resetMiddlewarePassword(newPassword)) {
            return ResponseEntity.ok("Password actualizado");
        }
        return ResponseEntity.status(404).body("Usuario administrador no encontrado");
    }
}
