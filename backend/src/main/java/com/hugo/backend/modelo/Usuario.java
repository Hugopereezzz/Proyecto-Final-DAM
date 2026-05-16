package com.hugo.backend.modelo;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

//Representa un usuario en la base de datos SQL.
//Es una de las tablas mas importantes de la app, casi todo gira alrededor de ella.
@Entity
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String apellidos;

    //@NotBlank significa que este campo no puede estar vacio al registrarse.
    //@Column(unique = true) significa que no puede haber dos usuarios con el mismo nickname.
    //@JsonProperty("nombreUsuario") significa que en el JSON este campo se llama
    //"nombreUsuario" en lugar de "nickname" (para que coincida con lo que manda el frontend).
    @NotBlank
    @Column(unique = true)
    @JsonProperty("nombreUsuario")
    private String nickname;

    //@NotBlank significa que la contrasena no puede estar vacia.
    //@JsonProperty("contrasena") hace que en el JSON se llame "contrasena"
    //en lugar de "password" (de nuevo para coincidir con el frontend).
    //aqui se guarda ya encriptada con BCrypt, no en texto plano.
    @NotBlank
    @JsonProperty("contrasena")
    private String password;

    @Column
    private String email;

    private Integer monedas = 0;    //Monedas del usuario, empieza en 0
    private Integer victorias = 0;  //Victorias del usuario, empieza en 0

    //Token que se genera cuando el usuario hace login y se borra cuando hace logout.
    //Si este campo tiene algun valor, significa que el usuario tiene una sesion activa.
    //Si es null, el usuario no esta logueado.
    //@Column(unique = true) evita que dos usuarios tengan el mismo token a la vez.
    @Column(unique = true)
    private String sessionToken;

    //Fecha y hora exacta en que expira la sesion activa.
    //Si es null, no hay sesion abierta.
    //El sistema comprueba esto para saber si el token sigue siendo valido o ha caducado.
    @Column
    private LocalDateTime sessionExpiresAt;

    //Lista de todas las facciones que tiene este usuario.
    //Un usuario puede tener muchas facciones (@OneToMany).
    //Si se borra el usuario, se borran todas sus facciones automaticamente (cascade + orphanRemoval).
    @OneToMany(mappedBy = "propietario", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Faccion> facciones = new ArrayList<>(); //Empieza como lista vacia

    //Getters y setters para acceder y modificar cada campo desde fuera de la clase

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