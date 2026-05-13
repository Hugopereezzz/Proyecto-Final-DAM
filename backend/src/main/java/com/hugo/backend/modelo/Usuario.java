package com.hugo.backend.modelo;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
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

    private Integer monedas = 0;
    private Integer victorias = 0;

    /**
     * Token de sesión activa. Si es no-nulo, el usuario ya tiene una sesión abierta.
     * Se genera al hacer login y se borra al hacer logout.
     */
    @Column(unique = true)
    private String sessionToken;

    /** Fecha/hora en que caduca la sesión activa. Null si no hay sesión. */
    @Column
    private LocalDateTime sessionExpiresAt;

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
    public Integer getMonedas() { return monedas; }
    public void setMonedas(Integer monedas) { this.monedas = monedas; }
    public Integer getVictorias() { return victorias; }
    public void setVictorias(Integer victorias) { this.victorias = victorias; }
    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String sessionToken) { this.sessionToken = sessionToken; }
    public LocalDateTime getSessionExpiresAt() { return sessionExpiresAt; }
    public void setSessionExpiresAt(LocalDateTime sessionExpiresAt) { this.sessionExpiresAt = sessionExpiresAt; }
    public List<Faccion> getFacciones() { return facciones; }
    public void setFacciones(List<Faccion> facciones) { this.facciones = facciones; }
}
