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
     * - Si el usuario ya tiene una sesión activa (sessionToken != null), rechaza con empty.
     * - Si las credenciales son correctas, genera un sessionToken único y lo guarda.
     */
    @Transactional
    public Optional<Usuario> login(String nickname, String password) {
        Optional<Usuario> opt = usuarioRepository.findByNickname(nickname);
        if (opt.isEmpty()) return Optional.empty();

        Usuario u = opt.get();

        // Verificar contraseña
        if (!passwordEncoder.matches(password, u.getPassword())) return Optional.empty();

        // Bloquear si ya hay una sesión activa
        if (u.getSessionToken() != null) return Optional.empty();

        // Crear y persistir el token de sesión
        u.setSessionToken(UUID.randomUUID().toString());
        usuarioRepository.save(u);

        return Optional.of(u);
    }

    /**
     * Devuelve true si las credenciales son correctas PERO el usuario ya tiene sesión activa.
     * Se usa para diferenciar 401 (credenciales malas) de 409 (ya conectado).
     */
    public boolean tieneSesionActiva(String nickname, String password) {
        return usuarioRepository.findByNickname(nickname)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .map(u -> u.getSessionToken() != null)
                .orElse(false);
    }

    /**
     * Cierra la sesión del usuario borrando su sessionToken.
     */
    @Transactional
    public boolean logout(String sessionToken) {
        Optional<Usuario> opt = usuarioRepository.findBySessionToken(sessionToken);
        if (opt.isEmpty()) return false;
        Usuario u = opt.get();
        u.setSessionToken(null);
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
