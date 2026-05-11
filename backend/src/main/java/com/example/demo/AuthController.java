package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        String nickname = credentials.get("nickname");
        String password = credentials.get("password");

        // RN-01.1: Solo middleware_admin puede autenticarse
        if ("middleware_admin".equals(nickname) && "admin1234".equals(password)) {
            String token = jwtService.generateToken(nickname);
            return ResponseEntity.ok(Map.of(
                "token", token,
                "expiresIn", 3600
            ));
        }

        // RN-01.2: Otros nicknames -> 401
        return ResponseEntity.status(401).body("Acceso denegado: Credenciales inválidas o no autorizado");
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // RF-02: Logout simbólico
        return ResponseEntity.ok("Sesión cerrada");
    }
}
