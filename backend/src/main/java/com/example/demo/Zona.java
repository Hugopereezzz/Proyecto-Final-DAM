package com.example.demo;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "zonas")
@Data
@NoArgsConstructor
public class Zona {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String tipo; // "Continental", "Isla", "Ártica"
    private int vidas = 5;
    private int victorias = 0;
    private double coste;

    @ManyToOne
    @JoinColumn(name = "usuario_id")
    private User propietario;

    public Zona(String nombre, String tipo, double coste, User propietario) {
        this.nombre = nombre;
        this.tipo = tipo;
        this.coste = coste;
        this.propietario = propietario;
    }
}
