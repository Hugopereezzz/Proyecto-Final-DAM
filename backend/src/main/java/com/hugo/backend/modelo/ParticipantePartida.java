package com.hugo.backend.modelo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
public class ParticipantePartida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "partida_id")
    @JsonIgnore
    private Partida partida;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private Usuario usuario;

    @ManyToOne
    @JoinColumn(name = "faccion_id")
    private Faccion faccion;

    private int vida;
    private Integer posicion;

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
