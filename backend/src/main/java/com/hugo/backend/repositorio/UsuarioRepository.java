package com.hugo.backend.repositorio;

import com.hugo.backend.modelo.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio para la gestión de usuarios en la base de datos.
 * Proporciona métodos CRUD básicos gracias a JpaRepository.
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    // Método para buscar un usuario por su nombre
    Optional<Usuario> findByNombreUsuario(String nombreUsuario);
    
    // Método para buscar un usuario por su correo electrónico
    Optional<Usuario> findByEmail(String email);
}
