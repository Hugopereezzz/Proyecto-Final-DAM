package com.hugo.backend.modelo;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;

    private String apellidos;

    @NotBlank
    @Column(unique = true)
    @JsonProperty("nombreUsuario")
    private String nickname;

    @NotBlank
    @JsonProperty("contrasena")
    private String password;

    @Column
    private String email;

    private int monedas = 0;

    @OneToMany(mappedBy = "propietario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Faccion> facciones = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }
    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public int getMonedas() { return monedas; }
    public void setMonedas(int monedas) { this.monedas = monedas; }
    public List<Faccion> getFacciones() { return facciones; }
    public void setFacciones(List<Faccion> facciones) { this.facciones = facciones; }
}
