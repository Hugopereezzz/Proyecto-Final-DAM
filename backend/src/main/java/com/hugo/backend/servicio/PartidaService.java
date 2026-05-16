package com.hugo.backend.servicio;

import com.hugo.backend.modelo.ParticipantePartida;
import com.hugo.backend.modelo.Partida;
import com.hugo.backend.modelo.Faccion;
import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.repositorio.PartidaRepository;
import com.hugo.backend.repositorio.FaccionRepository;
import com.hugo.backend.repositorio.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

//Servicio de partidas.
//Contiene la logica de negocio del juego: como se guardan las partidas,
//como se reparten premios al terminar y como se actualizan las estadisticas.
@Service
public class PartidaService {

    @Autowired
    private PartidaRepository partidaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private FaccionRepository faccionRepository;

    //Guarda una partida nueva en la base de datos.
    //Antes de guardar, asigna a cada participante la referencia a su partida
    //porque la relacion entre ambos la gestiona ParticipantePartida.
    @Transactional
    public Partida guardarPartida(Partida datos) {
        for (ParticipantePartida p : datos.getParticipantes()) {
            p.setPartida(datos); //Le dice a cada participante a que partida pertenece
        }
        return partidaRepository.save(datos);
    }

    //Finaliza una partida de dos jugadores (ganador vs perdedor).
    //Reparte premios y actualiza estadisticas de facciones.
    //Premio ganador: +200 monedas y +1 victoria en su faccion.
    //Premio perdedor: +50 monedas de consolacion y -1 vida en su faccion.
    @Transactional
    public void finalizarPartidaSimple(Long idPartida, Long idGanador, Long idPerdedor) {
        //Busca la partida y la marca como finalizada
        Partida partida = partidaRepository.findById(idPartida).orElseThrow();
        partida.setEstado("FINALIZADO");

        //Gestiona al ganador
        Usuario uGanador = usuarioRepository.findById(idGanador).orElseThrow();
        uGanador.setMonedas(uGanador.getMonedas() + 200); //+200 monedas al ganador

        //Busca la faccion del ganador en la partida y le suma una victoria
        partida.getParticipantes().stream()
                .filter(p -> p.getUsuario().getId().equals(idGanador))
                .findFirst()
                .ifPresent(p -> {
                    Faccion fl = p.getFaccion();
                    fl.setVictorias(fl.getVictorias() + 1); //+1 victoria a la faccion ganadora
                    faccionRepository.save(fl);
                });

        //Gestiona al perdedor
        Usuario uPerdedor = usuarioRepository.findById(idPerdedor).orElseThrow();
        uPerdedor.setMonedas(uPerdedor.getMonedas() + 50); //+50 monedas de consolacion al perdedor

        //Busca la faccion del perdedor en la partida y le quita una vida
        //Math.max(0, ...) evita que las vidas bajen de 0
        partida.getParticipantes().stream()
                .filter(p -> p.getUsuario().getId().equals(idPerdedor))
                .findFirst()
                .ifPresent(p -> {
                    Faccion fl = p.getFaccion();
                    fl.setVidas(Math.max(0, fl.getVidas() - 1)); //-1 vida a la faccion perdedora, minimo 0
                    faccionRepository.save(fl);
                });

        //Guarda todos los cambios en la base de datos
        usuarioRepository.save(uGanador);
        usuarioRepository.save(uPerdedor);
        partidaRepository.save(partida);
    }

    //Finaliza una partida con varios jugadores asignando posiciones.
    //El premio depende de la posicion: 1o recibe 500 monedas, 2o 450, 3o 400...
    //Formula del premio: 500 - 50 * (posicion - 1)
    //El ganador (posicion 1) suma una victoria a su faccion.
    //El resto pierden una vida en su faccion.
    @Transactional
    public void finalizarPartidaConPosiciones(Long idPartida, List<Map<String, Object>> jugadores) {
        //Busca la partida y la marca como finalizada
        Partida partida = partidaRepository.findById(idPartida).orElseThrow();
        partida.setEstado("FINALIZADO");

        //Recorre cada jugador con su posicion final
        for (Map<String, Object> j : jugadores) {
            Long idJugador = Long.valueOf(j.get("idJugador").toString());
            int posicion = Integer.parseInt(j.get("posicion").toString());

            //Calcula y asigna el premio segun la posicion
            //Posicion 1: 500 monedas, posicion 2: 450, posicion 3: 400...
            Usuario u = usuarioRepository.findById(idJugador).orElseThrow();
            int premio = 500 - 50 * (posicion - 1);
            u.setMonedas(u.getMonedas() + premio);
            usuarioRepository.save(u);

            //Actualiza la faccion del jugador segun su posicion
            partida.getParticipantes().stream()
                    .filter(p -> p.getUsuario().getId().equals(idJugador))
                    .findFirst()
                    .ifPresent(p -> {
                        Faccion fl = p.getFaccion();
                        if (posicion == 1) {
                            fl.setVictorias(fl.getVictorias() + 1); //El ganador suma una victoria
                        } else {
                            fl.setVidas(Math.max(0, fl.getVidas() - 1)); //El resto pierden una vida
                        }
                        p.setPosicion(posicion); //Guarda la posicion final del participante
                        faccionRepository.save(fl);
                    });
        }
        partidaRepository.save(partida);
    }

    //Devuelve todas las partidas de la base de datos
    public List<Partida> obtenerTodas() {
        return partidaRepository.findAll();
    }

    //Busca una partida por su ID o lanza error si no existe
    public Partida obtenerPorId(Long id) {
        return partidaRepository.findById(id).orElseThrow();
    }
}