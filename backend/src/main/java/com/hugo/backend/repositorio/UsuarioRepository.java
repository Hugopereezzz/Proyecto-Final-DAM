package com.hugo.backend.repositorio;

import com.hugo.backend.modelo.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

//Repositorio de usuarios para SQL.
//Spring genera automaticamente todas las consultas a partir del nombre del metodo,
//no hay que escribir SQL a mano.
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    //Busca un usuario por su nickname.
    //Se usa por ejemplo al hacer login o al comprobar si el admin ya existe.
    //Devuelve Optional porque puede que no exista ese nickname.
    Optional<Usuario> findByNickname(String nickname);

    //Busca un usuario por su email.
    //Util para comprobar si un email ya esta registrado.
    //Devuelve Optional porque puede que no exista ese email.
    Optional<Usuario> findByEmail(String email);

    //Busca un usuario por su sessionToken.
    //Se usa para identificar quien esta detras de una sesion activa.
    //Devuelve Optional porque puede que el token no exista o haya expirado.
    Optional<Usuario> findBySessionToken(String sessionToken);

    //Devuelve los 10 usuarios con mas victorias, ordenados de mayor a menor.
    //Se usa para mostrar el ranking de jugadores.
    //Es equivalente a: SELECT * FROM usuario ORDER BY victorias DESC LIMIT 10
    List<Usuario> findTop10ByOrderByVictoriasDesc();
}