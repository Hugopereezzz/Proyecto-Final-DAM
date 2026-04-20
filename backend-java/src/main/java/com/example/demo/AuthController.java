package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    public static class AuthRequest {
        public String username;
        public String password;
    }

    public static class AuthResponse {
        public boolean success;
        public String message;
        public String username;
        public String displayName;
        public String avatarBase64;
        public int credits;
        public int healthLevel;
        public int ammoLevel;
        public int speedLevel;
        public int alliedSupportCount;
        public int wins;
        public String missileSkin;
        public int xp;
        
        public AuthResponse(User user, boolean success, String message) {
            this.success = success;
            this.message = message;
            if (user != null) {
                this.username = user.getUsername();
                this.displayName = user.getDisplayName() != null ? user.getDisplayName() : user.getUsername();
                this.avatarBase64 = user.getAvatarBase64();
                this.credits = user.getCredits();
                this.healthLevel = user.getHealthLevel();
                this.ammoLevel = user.getAmmoLevel();
                this.speedLevel = user.getSpeedLevel();
                this.alliedSupportCount = user.getAlliedSupportCount();
                this.wins = user.getWins();
                this.missileSkin = user.getMissileSkin();
                this.xp = user.getXp();
            }
        }
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        if (request.username == null || request.username.trim().isEmpty() || request.password == null) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, false, "Datos inválidos"));
        }
        
        Optional<User> existing = userRepository.findByUsername(request.username);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, false, "El usuario ya existe"));
        }

        User newUser = new User(request.username, request.password);
        userRepository.save(newUser);
        return ResponseEntity.ok(new AuthResponse(newUser, true, "Registrado con éxito"));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        Optional<User> user = userRepository.findByUsername(request.username);
        
        if (user.isEmpty() || !user.get().getPassword().equals(request.password)) {
            return ResponseEntity.status(401).body(new AuthResponse(null, false, "Credenciales inválidas"));
        }

        return ResponseEntity.ok(new AuthResponse(user.get(), true, "Inicio de sesión con éxito"));
    }

    @GetMapping("/stats/{username}")
    public ResponseEntity<AuthResponse> getStats(@PathVariable String username) {
        Optional<User> user = userRepository.findByUsername(username);
        if (user.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new AuthResponse(user.get(), true, "Stats actualizadas"));
    }

    public static class UpdateProfileRequest {
        public String username;
        public String displayName;
        public String avatarBase64;
        public String missileSkin;
    }

    @PostMapping("/update-profile")
    public ResponseEntity<AuthResponse> updateProfile(@RequestBody UpdateProfileRequest request) {
        if (request.username == null || request.username.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, false, "Usuario inválido"));
        }
        Optional<User> userOpt = userRepository.findByUsername(request.username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(new AuthResponse(null, false, "Usuario no encontrado"));
        }

        User user = userOpt.get();
        if (request.displayName != null && !request.displayName.trim().isEmpty()) {
            user.setDisplayName(request.displayName.trim());
        }
        if (request.avatarBase64 != null) {
            user.setAvatarBase64(request.avatarBase64);
        }
        if (request.missileSkin != null) {
            user.setMissileSkin(request.missileSkin);
        }

        userRepository.save(user);
        return ResponseEntity.ok(new AuthResponse(user, true, "Perfil actualizado con éxito"));
    }
}
