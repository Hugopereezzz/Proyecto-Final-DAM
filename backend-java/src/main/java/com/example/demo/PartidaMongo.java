package com.example.demo;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.List;

@Document(collection = "partidas_stats")
public class PartidaMongo {

    @Id
    public String id;
    
    public Long partidaIdSql;
    public String estado;
    public int numeroRonda;
    public List<MatchPlayer> participantes;
    public String ganador; // Nombre del ganador si aplica
    public int continentGanador = -1;
    public Date fecha = new Date();

    public static class MatchPlayer {
        public String name;
        public int cityId;
        public int continentIndex;
        public boolean isBot;
    }
}
