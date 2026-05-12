package com.hugo.backend.repositorio;

import com.hugo.backend.document.PartidaDoc;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PartidaMongoRepository extends MongoRepository<PartidaDoc, String> {
    @Override
    @NonNull
    List<PartidaDoc> findAll();
}
