package com.hugo.backend.servicio;

import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.repositorio.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Transactional
    public Usuario guardarUsuario(Usuario usuario) {
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword()));
        usuario.setMonedas(0);
        return usuarioRepository.save(usuario);
    }

    /**
     * Intenta hacer login con las credenciales dadas.
     * <ul>
     *   <li>Si el usuario tiene un token pero ya caducó: limpia la sesión vieja y permite el acceso.</li>
     *   <li>Si el usuario tiene un token aún vigente: rechaza con Optional.empty() (-> 409).</li>
     *   <li>Si las credenciales son incorrectas: rechaza con Optional.empty() (-> 401).</li>
     * </ul>
     */
    @Transactional
    public Optional<Usuario> login(String nickname, String password) {
        Optional<Usuario> opt = usuarioRepository.findByNickname(nickname);
        if (opt.isEmpty()) return Optional.empty();

        Usuario u = opt.get();

        // Verificar contraseña
        if (!passwordEncoder.matches(password, u.getPassword())) return Optional.empty();

        // Si hay sesión activa, comprobar si ha caducado
        if (u.getSessionToken() != null) {
            if (u.getSessionExpiresAt() != null && u.getSessionExpiresAt().isBefore(LocalDateTime.now())) {
                // Sesión caducada: limpiar y permitir nuevo acceso
                u.setSessionToken(null);
                u.setSessionExpiresAt(null);
            } else {
                // Sesión todavía vigente: bloquear
                return Optional.empty();
            }
        }

        // Crear token nuevo con expiración de 3 minutos
        u.setSessionToken(UUID.randomUUID().toString());
        u.setSessionExpiresAt(LocalDateTime.now().plusMinutes(3));
        usuarioRepository.save(u);

        return Optional.of(u);
    }

    /**
     * Devuelve true si las credenciales son correctas Y el usuario tiene una sesión AÚN VIGENTE.
     * Una sesión caducada (sessionExpiresAt en el pasado) NO se considera activa.
     * Se usa para diferenciar 401 (credenciales malas) de 409 (ya conectado).
     */
    public boolean tieneSesionActiva(String nickname, String password) {
        return usuarioRepository.findByNickname(nickname)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .map(u -> u.getSessionToken() != null
                        && u.getSessionExpiresAt() != null
                        && u.getSessionExpiresAt().isAfter(LocalDateTime.now()))
                .orElse(false);
    }

    /**
     * Cierra la sesión del usuario borrando su sessionToken y la fecha de expiración.
     */
    @Transactional
    public boolean logout(String sessionToken) {
        Optional<Usuario> opt = usuarioRepository.findBySessionToken(sessionToken);
        if (opt.isEmpty()) return false;
        Usuario u = opt.get();
        u.setSessionToken(null);
        u.setSessionExpiresAt(null);
        usuarioRepository.save(u);
        return true;
    }

    /**
     * Renueva la expiración del token activo por 3 minutos más.
     * Si el token no existe o ya ha caducado, devuelve false para forzar re-login.
     */
    @Transactional
    public boolean refreshSession(String sessionToken) {
        Optional<Usuario> opt = usuarioRepository.findBySessionToken(sessionToken);
        if (opt.isEmpty()) return false;

        Usuario u = opt.get();
        // Si ya caducó, invalidamos y devolvemos false
        if (u.getSessionExpiresAt() == null || u.getSessionExpiresAt().isBefore(LocalDateTime.now())) {
            u.setSessionToken(null);
            u.setSessionExpiresAt(null);
            usuarioRepository.save(u);
            return false;
        }

        // Extender 3 minutos más desde ahora
        u.setSessionExpiresAt(LocalDateTime.now().plusMinutes(3));
        usuarioRepository.save(u);
        return true;
    }

    public List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll();
    }

    public Optional<Usuario> obtenerPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    @Transactional
    public void eliminarUsuario(Long id) {
        usuarioRepository.deleteById(id);
    }

    @Transactional
    public Usuario actualizarUsuario(Long id, Usuario datos) {
        return usuarioRepository.findById(id).map(u -> {
            if (datos.getNombre() != null) u.setNombre(datos.getNombre());
            if (datos.getApellidos() != null) u.setApellidos(datos.getApellidos());
            if (datos.getEmail() != null) u.setEmail(datos.getEmail());
            if (datos.getMonedas() != null) u.setMonedas(datos.getMonedas());
            if (datos.getNickname() != null) u.setNickname(datos.getNickname());
            return usuarioRepository.save(u);
        }).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    @Transactional
    public void incrementarVictorias(String nickname) {
        usuarioRepository.findByNickname(nickname).ifPresent(u -> {
            u.setVictorias(u.getVictorias() + 1);
            usuarioRepository.save(u);
        });
    }

    public List<Usuario> obtenerRanking() {
        return usuarioRepository.findTop10ByOrderByVictoriasDesc();
    }
}
