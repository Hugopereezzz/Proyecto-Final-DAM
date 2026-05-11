package com.hugo.backend.repositorio;

import com.hugo.backend.modelo.Faccion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FaccionRepository extends JpaRepository<Faccion, Long> {
    List<Faccion> findAllByOrderByVictoriasDesc();
}
