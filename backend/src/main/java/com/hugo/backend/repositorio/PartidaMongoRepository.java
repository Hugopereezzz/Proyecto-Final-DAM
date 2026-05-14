package com.hugo.backend.repositorio;

import com.hugo.backend.document.PartidaDoc;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartidaMongoRepository extends CrudRepository<PartidaDoc, String> {
    List<PartidaDoc> findAll();
    java.util.Optional<PartidaDoc> findByOriginalId(Long originalId);
}
