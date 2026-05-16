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

//Servicio de facciones.
//Contiene toda la logica de negocio relacionada con las facciones del juego.
@Service
public class FaccionService {

    @Autowired
    private FaccionRepository faccionRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    //Tabla de precios de cada tipo de faccion.
    //Cuanto mas poderosa la faccion, mas cara es.
    private static final Map<String, Integer> COSTES = Map.of(
            "Alliance",  200,
            "Rebels",    300,
            "Pirates",   300,
            "Federation",350,
            "Empire",    500
    );

    //Compra una faccion descontando monedas al usuario.
    //Si el usuario no tiene suficientes monedas, lanza un error.
    //@Transactional garantiza que si algo falla a mitad (por ejemplo se descuentan
    //las monedas pero falla al guardar la faccion), todo se deshace.
    @Transactional
    public Faccion comprarFaccion(Long usuarioId, String nombre, String tipo) {
        //Busca el usuario o lanza error si no existe
        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        //Obtiene el coste del tipo de faccion, o 200 por defecto si el tipo no esta en la tabla
        int coste = COSTES.getOrDefault(tipo, 200);

        //Comprueba si el usuario tiene suficientes monedas
        if (usuario.getMonedas() < coste) {
            throw new RuntimeException("Monedas insuficientes");
        }

        //Descuenta las monedas al usuario
        usuario.setMonedas(usuario.getMonedas() - coste);

        //Crea la faccion y la asocia al usuario
        Faccion faccion = new Faccion();
        faccion.setNombre(nombre);
        faccion.setTipo(tipo);
        faccion.setPropietario(usuario);

        //Guarda el usuario con las monedas actualizadas y la faccion nueva
        usuarioRepository.save(usuario);
        return faccionRepository.save(faccion);
    }

    //Crea una faccion directamente sin coste de monedas.
    //Se usa desde el panel de administracion para crear facciones sin restricciones.
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

    //Devuelve todas las facciones de la base de datos
    public List<Faccion> obtenerTodas() {
        return faccionRepository.findAll();
    }

    //Devuelve todas las facciones ordenadas por victorias de mayor a menor
    public List<Faccion> obtenerRanking() {
        return faccionRepository.findAllByOrderByVictoriasDesc();
    }

    //Elimina una faccion por su ID
    @Transactional
    public void eliminarFaccion(Long id) {
        faccionRepository.deleteById(id);
    }

    //Actualiza los datos de una faccion existente.
    //Solo actualiza nombre y tipo si vienen informados (no sobreescribe con null).
    //Las vidas y victorias siempre se actualizan con el valor que llegue.
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