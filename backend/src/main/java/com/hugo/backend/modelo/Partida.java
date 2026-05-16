package com.hugo.backend.modelo;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

//Representa una partida en la base de datos SQL.
//Es la tabla principal del juego, contiene el estado y los jugadores de cada partida.
@Entity
public class Partida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String estado;   //Estado de la partida: "EN_CURSO" o "FINALIZADO"
    private int numeroRonda; //Ronda actual de la partida

    //Lista de todos los jugadores que participan en esta partida.
    //@OneToMany significa que una partida tiene muchos participantes.
    //mappedBy = "partida" indica que la relacion esta definida en ParticipantePartida.
    //cascade = CascadeType.ALL significa que si se borra una partida,
    //se borran automaticamente todos sus participantes tambien.
    //orphanRemoval = true significa que si se quita un participante de la lista,
    //se borra de la base de datos automaticamente.
    @OneToMany(mappedBy = "partida", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ParticipantePartida> participantes = new ArrayList<>(); //Empieza como lista vacia

    //Getters y setters para acceder y modificar cada campo desde fuera de la clase

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public int getNumeroRonda() { return numeroRonda; }
    public void setNumeroRonda(int numeroRonda) { this.numeroRonda = numeroRonda; }

    public List<ParticipantePartida> getParticipantes() { return participantes; }
    public void setParticipantes(List<ParticipantePartida> participantes) { this.participantes = participantes; }
}