package com.hugo.backend.servicio;

import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.repositorio.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

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

    public Optional<Usuario> login(String nickname, String password) {
        return usuarioRepository.findByNickname(nickname)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()));
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
            if (datos.getNickname() != null) u.setNickname(datos.getNickname());
            if (datos.getEmail() != null) u.setEmail(datos.getEmail());
            return usuarioRepository.save(u);
        }).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    public List<Usuario> obtenerRanking() {
        return usuarioRepository.findTop10ByOrderByMonedasDesc();
    }
}
