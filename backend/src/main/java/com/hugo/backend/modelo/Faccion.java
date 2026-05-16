package com.hugo.backend.modelo;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

//@Entity indica que esta clase es una tabla en la base de datos SQL.
//Cada objeto Faccion que se guarde sera una fila en esa tabla.
@Entity
public class Faccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //El ID se genera automaticamente (1, 2, 3...)
    private Long id;

    private String nombre;       //Nombre de la faccion (ej: "Los Elfos")
    private String tipo;         //Tipo: Empire, Federation, Rebels, Pirates o Alliance
    private int vidas = 5;       //Vidas con las que empieza la faccion en cada partida
    private int victorias = 0;   //Contador de victorias, empieza en 0

    //@ManyToOne significa que muchas facciones pueden pertenecer a un mismo usuario.
    //@JoinColumn indica que en la tabla Faccion habra una columna "usuario_id"
    //que apunta al usuario dueno de esta faccion.
    //@JsonIgnore evita que cuando se devuelva una faccion en JSON
    //se incluya todo el objeto usuario dentro (evita bucles infinitos y datos innecesarios).
    @ManyToOne
    @JoinColumn(name = "usuario_id")
    @JsonIgnore
    private Usuario propietario;

    //Getters y setters para acceder y modificar cada campo desde fuera de la clase

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public int getVidas() { return vidas; }
    public void setVidas(int vidas) { this.vidas = vidas; }

    public int getVictorias() { return victorias; }
    public void setVictorias(int victorias) { this.victorias = victorias; }

    public Usuario getPropietario() { return propietario; }
    public void setPropietario(Usuario propietario) { this.propietario = propietario; }
}