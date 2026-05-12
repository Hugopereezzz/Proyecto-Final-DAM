package com.hugo.backend.servicio;

import com.hugo.backend.modelo.ParticipantePartida;
import com.hugo.backend.modelo.Partida;
import com.hugo.backend.modelo.Faccion;
import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.repositorio.PartidaRepository;
import com.hugo.backend.repositorio.FaccionRepository;
import com.hugo.backend.repositorio.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class PartidaService {

    @Autowired
    private PartidaRepository partidaRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private FaccionRepository faccionRepository;
    @Autowired
    @Lazy
    private EstadisticasService estadisticasService;

    @Transactional
    public Partida guardarPartida(Partida datos) {
        System.out.println(">>> [PartidaService] Guardando partida con " +
                (datos.getParticipantes() != null ? datos.getParticipantes().size() : 0) + " participantes");

        for (ParticipantePartida p : datos.getParticipantes()) {
            p.setPartida(datos);

            // Recompensas al usuario
            if (p.getUsuario() != null && p.getUsuario().getId() != null) {
                Long uId = p.getUsuario().getId();
                Usuario u = usuarioRepository.findById(uId).orElse(null);
                if (u != null) {
                    int premio = (p.getPosicion() != null && p.getPosicion() == 1) ? 200 : 50;
                    u.setMonedas(u.getMonedas() + premio);
                    usuarioRepository.save(u);
                    System.out.println(">>> [PartidaService] Usuario " + uId + " recibe " + premio + " monedas");
                } else {
                    System.out.println(">>> [PartidaService] AVISO: Usuario con id=" + uId + " no encontrado. Se omite recompensa.");
                    p.setUsuario(null); // Evitar FK violation
                }
            }

            // Recompensas a la facción
            if (p.getFaccion() != null && p.getFaccion().getId() != null) {
                Long fId = p.getFaccion().getId();
                Faccion f = faccionRepository.findById(fId).orElse(null);
                if (f != null) {
                    if (p.getPosicion() != null && p.getPosicion() == 1) {
                        f.setVictorias(f.getVictorias() + 1);
                    } else {
                        f.setVidas(Math.max(0, f.getVidas() - 1));
                    }
                    faccionRepository.save(f);
                    System.out.println(">>> [PartidaService] Facción " + fId + " actualizada");
                } else {
                    System.out.println(">>> [PartidaService] AVISO: Facción con id=" + fId + " no encontrada. Se omite actualización.");
                    p.setFaccion(null); // Evitar FK violation
                }
            }
        }

        Partida guardada = partidaRepository.save(datos);
        System.out.println(">>> [PartidaService] Partida guardada con ID: " + guardada.getId());

        // Replicar en MongoDB para estadísticas
        try {
            estadisticasService.guardarEnMongo(guardada);
            System.out.println(">>> [PartidaService] Partida replicada en MongoDB");
        } catch (Exception e) {
            System.err.println(">>> [PartidaService] AVISO: No se pudo replicar en MongoDB: " + e.getMessage());
        }

        return guardada;
    }

    @Transactional
    public void finalizarPartidaSimple(Long idPartida, Long idGanador, Long idPerdedor) {
        if (idPartida == null || idGanador == null || idPerdedor == null) {
            throw new IllegalArgumentException("Los IDs no pueden ser nulos");
        }
        Partida partida = partidaRepository.findById(idPartida).orElseThrow();
        partida.setEstado("FINALIZADO");

        Usuario uGanador = usuarioRepository.findById(idGanador).orElseThrow();
        uGanador.setMonedas(uGanador.getMonedas() + 200);
        
        partida.getParticipantes().stream()
                .filter(p -> p.getUsuario().getId().equals(idGanador))
                .findFirst()
                .ifPresent(p -> {
                    Faccion fl = p.getFaccion();
                    fl.setVictorias(fl.getVictorias() + 1);
                    faccionRepository.save(fl);
                });

        Usuario uPerdedor = usuarioRepository.findById(idPerdedor).orElseThrow();
        uPerdedor.setMonedas(uPerdedor.getMonedas() + 50);
        
        partida.getParticipantes().stream()
                .filter(p -> p.getUsuario().getId().equals(idPerdedor))
                .findFirst()
                .ifPresent(p -> {
                    Faccion fl = p.getFaccion();
                    fl.setVidas(Math.max(0, fl.getVidas() - 1));
                    faccionRepository.save(fl);
                });

        usuarioRepository.save(uGanador);
        usuarioRepository.save(uPerdedor);
        partidaRepository.save(partida);
    }

    @Transactional
    public void finalizarPartidaConPosiciones(Long idPartida, List<Map<String, Object>> jugadores) {
        if (idPartida == null) throw new IllegalArgumentException("El ID de partida no puede ser nulo");
        Partida partida = partidaRepository.findById(idPartida).orElseThrow();
        partida.setEstado("FINALIZADO");

        for (Map<String, Object> j : jugadores) {
            Object idObj = j.get("idJugador");
            Object posObj = j.get("posicion");
            if (idObj == null || posObj == null) continue;

            Long idJugador = Long.valueOf(idObj.toString());
            int posicion = Integer.parseInt(posObj.toString());
            Usuario u = usuarioRepository.findById(idJugador).orElseThrow();
            int premio = 500 - 50 * (posicion - 1);
            u.setMonedas(u.getMonedas() + premio);
            usuarioRepository.save(u);

            partida.getParticipantes().stream()
                    .filter(p -> p.getUsuario().getId().equals(idJugador))
                    .findFirst()
                    .ifPresent(p -> {
                        Faccion fl = p.getFaccion();
                        if (posicion == 1) {
                            fl.setVictorias(fl.getVictorias() + 1);
                        } else {
                            fl.setVidas(Math.max(0, fl.getVidas() - 1));
                        }
                        p.setPosicion(posicion);
                        faccionRepository.save(fl);
                    });
        }
        partidaRepository.save(partida);
    }

    public List<Partida> obtenerTodas() {
        return partidaRepository.findAll();
    }

    public Partida obtenerPorId(Long id) {
        if (id == null) throw new IllegalArgumentException("El ID no puede ser nulo");
        return partidaRepository.findById(id).orElseThrow();
    }
}
