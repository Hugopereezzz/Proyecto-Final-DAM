package com.hugo.backend.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

//@Document indica que esta clase se guarda en MongoDB, no en SQL.
//"partidas_estadisticas" es el nombre de la coleccion donde se guardan
//(en MongoDB se llaman colecciones, en SQL se llaman tablas).
@Document(collection = "partidas_estadisticas")
public class PartidaDoc {

    @Id
    private String id;                          //ID unico que genera MongoDB automaticamente
    private Long originalId;                    //ID de la partida en la base de datos SQL (para relacionarlas)
    private String estado;                      //Estado de la partida (ej: "finalizada", "en curso"...)
    private int numeroRonda;                    //En que ronda se encuentra o termino la partida
    private List<ParticipanteDoc> participantes;//Lista de jugadores que participaron en la partida

    //Getters y setters para acceder y modificar cada campo desde fuera de la clase

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Long getOriginalId() { return originalId; }
    public void setOriginalId(Long originalId) { this.originalId = originalId; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public int getNumeroRonda() { return numeroRonda; }
    public void setNumeroRonda(int numeroRonda) { this.numeroRonda = numeroRonda; }

    public List<ParticipanteDoc> getParticipantes() { return participantes; }
    public void setParticipantes(List<ParticipanteDoc> participantes) { this.participantes = participantes; }
}