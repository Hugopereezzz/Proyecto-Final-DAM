package com.hugo.backend.repositorio;

import com.hugo.backend.modelo.Partida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

//Repositorio de partidas para SQL.
//No tiene consultas personalizadas porque con las que hereda
//de JpaRepository (buscar por ID, guardar, borrar, listar todas...) es suficiente.
@Repository
public interface PartidaRepository extends JpaRepository<Partida, Long> {
}