package com.hugo.backend.servicio;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.repositorio.UsuarioRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@Service
public class AuthService {
    private final UsuarioRepository usuarioRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final Key key = Keys.hmacShaKeyFor(Decoders.BASE64.decode("uVv1oZQe3lq3Jw9uXlZkY2h0b3Rlc3QxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTA="));

    // Nickname del usuario administrador (middleware)
    public static final String ADMIN_NICKNAME = "middleware_admin";

    public AuthService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @jakarta.annotation.PostConstruct
    public void init() {
        if (usuarioRepository.findByNickname(ADMIN_NICKNAME).isEmpty()) {
            Usuario admin = new Usuario();
            admin.setNombre("Admin Middleware");
            admin.setNickname(ADMIN_NICKNAME);
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setMonedas(0);
            usuarioRepository.save(admin);
            System.out.println(">>> [AuthService] Usuario administrador inicializado con éxito");
        }
    }

    /**
     * Login exclusivo para el usuario administrador (middleware)
     */
    public String loginAdmin(String nickname, String rawPassword) {
        if (!ADMIN_NICKNAME.equals(nickname)) {
            return null; // Solo el admin puede hacer login por este método
        }
        Optional<Usuario> opt = authenticate(nickname, rawPassword);
        if (opt.isEmpty()) return null;
        return generateToken(opt.get());
    }

    public String login(String nickname, String rawPassword) {
        Optional<Usuario> opt = authenticate(nickname, rawPassword);
        if (opt.isEmpty()) return null;
        return generateToken(opt.get());
    }

    public Optional<Usuario> authenticate(String nickname, String rawPassword) {
        Optional<Usuario> opt = usuarioRepository.findByNickname(nickname);
        if (opt.isEmpty()) return Optional.empty();
        Usuario u = opt.get();
        // Nota: Asegúrate de que la contraseña en BD esté hasheada con BCrypt
        if (!passwordEncoder.matches(rawPassword, u.getPassword())) return Optional.empty();
        return Optional.of(u);
    }

    public String generateToken(Usuario u) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(u.getId().toString())
                .setIssuedAt(Date.from(now))
                .setExpiration(Date.from(now.plusSeconds(3600)))
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String encode(String raw) { return passwordEncoder.encode(raw); }

    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Long getUserIdFromToken(String token) {
        try {
            return Long.valueOf(Jwts.parserBuilder().setSigningKey(key).build()
                    .parseClaimsJws(token).getBody().getSubject());
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Reset password del usuario middleware_admin (SOLO DESARROLLO)
     */
    public boolean resetMiddlewarePassword(String newPassword) {
        Optional<Usuario> opt = usuarioRepository.findByNickname(ADMIN_NICKNAME);
        if (opt.isEmpty()) return false;
        Usuario u = opt.get();
        u.setPassword(passwordEncoder.encode(newPassword));
        usuarioRepository.save(u);
        return true;
    }
}
