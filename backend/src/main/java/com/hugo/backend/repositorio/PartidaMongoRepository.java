package com.hugo.backend.repositorio;

import com.hugo.backend.document.PartidaDoc;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

//Repositorio de partidas para MongoDB (no SQL).
//Funciona igual que los otros repositorios pero en lugar de hablar
//con la base de datos SQL, habla con MongoDB.
//El <PartidaDoc, String> significa que maneja documentos PartidaDoc
//cuyo ID es de tipo String (MongoDB usa IDs en formato texto, no numeros).
@Repository
public interface PartidaMongoRepository extends CrudRepository<PartidaDoc, String> {

    //Devuelve todas las partidas guardadas en MongoDB
    List<PartidaDoc> findAll();

    //Busca una partida en MongoDB por el ID que tenia en la base de datos SQL.
    //Sirve para relacionar el documento de MongoDB con su partida original en SQL.
    //Devuelve un Optional porque puede que no exista ninguna partida con ese ID.
    java.util.Optional<PartidaDoc> findByOriginalId(Long originalId);
}