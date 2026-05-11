package com.hugo.backend.document;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "partidas_estadisticas")
public class PartidaDoc {
    @Id
    private String id;
    private Long originalId;
    private String estado;
    private int numeroRonda;
    private List<ParticipanteDoc> participantes;

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
