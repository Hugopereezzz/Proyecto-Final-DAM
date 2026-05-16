package com.hugo.backend.document;

//Representa los datos de UN participante dentro de una partida guardada en MongoDB.
//No es una tabla de base de datos SQL, es un "subdocumento" que va
//incrustado dentro de PartidaDoc.
//Es decir, cada partida tiene una lista de estos objetos, uno por jugador.
public class ParticipanteDoc {

    private Long usuarioId;       //ID del usuario en la base de datos
    private String nickname;      //Nombre del jugador
    private Long faccionId;       //ID de la faccion que uso en la partida
    private String faccionNombre; //Nombre de la faccion (ej: "Los Elfos")
    private String faccionTipo;   //Tipo de faccion (ej: "magia", "guerrero"...)
    private int vida;             //Vida que le quedaba al terminar la partida
    private Integer posicion;     //Posicion final en la partida (1 = ganador, 2 = segundo...)

    //A partir de aqui son los getters y setters.
    //Son metodos para leer y modificar cada campo desde fuera de la clase.
    //Java obliga a hacerlo asi para mantener los datos protegidos.

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public Long getFaccionId() { return faccionId; }
    public void setFaccionId(Long faccionId) { this.faccionId = faccionId; }

    public String getFaccionNombre() { return faccionNombre; }
    public void setFaccionNombre(String faccionNombre) { this.faccionNombre = faccionNombre; }

    public String getFaccionTipo() { return faccionTipo; }
    public void setFaccionTipo(String faccionTipo) { this.faccionTipo = faccionTipo; }

    public int getVida() { return vida; }
    public void setVida(int vida) { this.vida = vida; }

    public Integer getPosicion() { return posicion; }
    public void setPosicion(Integer posicion) { this.posicion = posicion; }
}