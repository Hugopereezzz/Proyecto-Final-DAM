package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UserRepository userRepository;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @PostMapping
    public ResponseEntity<?> crearUsuario(@RequestBody User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            return ResponseEntity.badRequest().body("Nickname ya existe");
        }
        if (user.getEmail() != null && userRepository.existsByEmail(user.getEmail())) {
            return ResponseEntity.badRequest().body("Email ya existe");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user.setCredits(0);
        
        User saved = userRepository.save(user);
        return ResponseEntity.ok(saved);
    }

    @GetMapping
    public List<User> listarUsuarios() {
        return userRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> obtenerUsuario(@PathVariable Long id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody User userDetails) {
        return userRepository.findById(id).map(user -> {
            if (userDetails.getUsername() != null && !userDetails.getUsername().equals(user.getUsername())) {
                if (userRepository.existsByUsername(userDetails.getUsername())) {
                    return ResponseEntity.badRequest().body("Nickname ya existe");
                }
                user.setUsername(userDetails.getUsername());
            }
            if (userDetails.getEmail() != null && !userDetails.getEmail().equals(user.getEmail())) {
                if (userRepository.existsByEmail(userDetails.getEmail())) {
                    return ResponseEntity.badRequest().body("Email ya existe");
                }
                user.setEmail(userDetails.getEmail());
            }
            if (userDetails.getDisplayName() != null) user.setDisplayName(userDetails.getDisplayName());
            if (userDetails.getPassword() != null) user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
            
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarUsuario(@PathVariable Long id) {
        return userRepository.findById(id).map(user -> {
            userRepository.delete(user);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
