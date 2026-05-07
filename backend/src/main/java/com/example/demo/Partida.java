package com.example.demo;

import jakarta.persistence.*;
import java.util.Date;

@Entity
@Table(name = "partidas")
public class Partida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    public String estado; // "FINALIZADA", "EN_CURSO"
    public int numeroRonda;
    
    public String ganador;
    public int continentGanador = -1;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    public String infoParticipantes; // Listado de jugadores y sus resultados en JSON string

    public Date fecha = new Date();
}
