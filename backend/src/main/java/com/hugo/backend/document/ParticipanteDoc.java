package com.hugo.backend.document;

public class ParticipanteDoc {
    private Long usuarioId;
    private String nickname;
    private Long faccionId;
    private String faccionNombre;
    private String faccionTipo;
    private int vida;
    private Integer posicion;

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
