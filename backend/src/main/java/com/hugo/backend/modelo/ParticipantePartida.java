package com.hugo.backend.modelo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

//Representa la participacion de un jugador en una partida concreta en SQL.
//Es la tabla intermedia que une Partida, Usuario y Faccion.
//Es decir, responde a la pregunta: "quien jugo que partida con que faccion y como le fue?"
@Entity
public class ParticipantePartida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //Relacion con la partida a la que pertenece este participante.
    //@JsonIgnore evita incluir toda la partida dentro del JSON (evita bucles infinitos).
    @ManyToOne
    @JoinColumn(name = "partida_id")
    @JsonIgnore
    private Partida partida;

    //Relacion con el usuario que participo
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    //Relacion con la faccion que uso ese usuario en esa partida
    @ManyToOne
    @JoinColumn(name = "faccion_id")
    private Faccion faccion;

    private int vida;          //Vida que le quedaba al terminar la partida
    private Integer posicion;  //Posicion final (1 = ganador, 2 = segundo...)

    //Getters y setters para acceder y modificar cada campo desde fuera de la clase

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Partida getPartida() { return partida; }
    public void setPartida(Partida partida) { this.partida = partida; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public Faccion getFaccion() { return faccion; }
    public void setFaccion(Faccion faccion) { this.faccion = faccion; }

    public int getVida() { return vida; }
    public void setVida(int vida) { this.vida = vida; }

    public Integer getPosicion() { return posicion; }
    public void setPosicion(Integer posicion) { this.posicion = posicion; }
}