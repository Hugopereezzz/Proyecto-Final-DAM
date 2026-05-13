package com.hugo.backend.repositorio;

import com.hugo.backend.modelo.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByNickname(String nickname);
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findBySessionToken(String sessionToken);
    List<Usuario> findTop10ByOrderByVictoriasDesc();
}
