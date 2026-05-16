package com.hugo.backend.repositorio;

import com.hugo.backend.modelo.Faccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

//Repositorio de facciones.
//Un repositorio es el que se encarga de hablar con la base de datos SQL.
//Al extender JpaRepository, Spring nos da gratis todas las operaciones
//basicas sin tener que escribirlas: buscar, guardar, actualizar, borrar...
@Repository
public interface FaccionRepository extends JpaRepository<Faccion, Long> {

    //Busca todas las facciones ordenadas por victorias de mayor a menor.
    //Spring entiende el nombre del metodo y genera la consulta SQL automaticamente.
    //Es equivalente a escribir: SELECT * FROM faccion ORDER BY victorias DESC
    List<Faccion> findAllByOrderByVictoriasDesc();
}