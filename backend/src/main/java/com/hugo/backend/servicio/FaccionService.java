package com.hugo.backend.servicio;

import com.hugo.backend.modelo.Faccion;
import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.repositorio.FaccionRepository;
import com.hugo.backend.repositorio.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class FaccionService {

    @Autowired
    private FaccionRepository faccionRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    private static final Map<String, Integer> COSTES = Map.of(
            "Alliance", 200,
            "Rebels", 300,
            "Pirates", 300,
            "Federation", 350,
            "Empire", 500
    );

    @Transactional
    public Faccion comprarFaccion(Long usuarioId, String nombre, String tipo) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        int coste = COSTES.getOrDefault(tipo, 200);

        if (usuario.getMonedas() < coste) {
            throw new RuntimeException("Monedas insuficientes");
        }

        usuario.setMonedas(usuario.getMonedas() - coste);
        
        Faccion faccion = new Faccion();
        faccion.setNombre(nombre);
        faccion.setTipo(tipo);
        faccion.setPropietario(usuario);
        
        usuarioRepository.save(usuario);
        return faccionRepository.save(faccion);
    }

    @Transactional
    public Faccion crearFaccionDirecto(Long usuarioId, String nombre, String tipo) {
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        Faccion faccion = new Faccion();
        faccion.setNombre(nombre);
        faccion.setTipo(tipo);
        faccion.setPropietario(usuario);
        
        return faccionRepository.save(faccion);
    }

    public List<Faccion> obtenerTodas() {
        return faccionRepository.findAll();
    }

    public List<Faccion> obtenerRanking() {
        return faccionRepository.findAllByOrderByVictoriasDesc();
    }

    @Transactional
    public void eliminarFaccion(Long id) {
        faccionRepository.deleteById(id);
    }

    @Transactional
    public Faccion actualizarFaccion(Long id, Faccion datos) {
        return faccionRepository.findById(id).map(f -> {
            if (datos.getNombre() != null) f.setNombre(datos.getNombre());
            if (datos.getTipo() != null) f.setTipo(datos.getTipo());
            f.setVidas(datos.getVidas());
            f.setVictorias(datos.getVictorias());
            return faccionRepository.save(f);
        }).orElseThrow(() -> new RuntimeException("Faccion no encontrada"));
    }
}
