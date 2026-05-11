package com.hugo.backend.servicio;

import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.repositorio.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Servicio que contiene la lógica de negocio para la gestión de usuarios.
 */
@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    /**
     * Guarda un nuevo usuario si el nombre no está ocupado.
     */
    public Usuario guardarUsuario(Usuario usuario) {
        // 1. Verificamos si el nombre ya existe
        if (usuarioRepository.findByNombreUsuario(usuario.getNombreUsuario()).isPresent()) {
            throw new RuntimeException("El nombre de usuario ya está en uso");
        }
        // 2. Si no existe, lo guardamos
        return usuarioRepository.save(usuario);
    }

    /**
     * Lista completa de usuarios.
     */
    public List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll();
    }

    /**
     * Comprueba si el login es correcto.
     */
    public Optional<Usuario> validarLogin(String nombreUsuario, String contrasena) {
        return usuarioRepository.findByNombreUsuario(nombreUsuario)
                .filter(u -> u.getContrasena().equals(contrasena));
    }

    /**
     * Ranking de victorias.
     */
    public List<Usuario> obtenerRanking() {
        return usuarioRepository.findTop10ByOrderByVictoriasDesc();
    }
}
