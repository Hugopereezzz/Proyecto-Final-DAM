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

@Service
public class PartidaService {

    @Autowired
    private PartidaRepository partidaRepository;
    @Autowired
    private UsuarioRepository usuarioRepository;
    @Autowired
    private FaccionRepository faccionRepository;

    @Transactional
    public Partida guardarPartida(Partida datos) {
        for (ParticipantePartida p : datos.getParticipantes()) {
            p.setPartida(datos);
        }
        return partidaRepository.save(datos);
    }

    @Transactional
    public void finalizarPartidaSimple(Long idPartida, Long idGanador, Long idPerdedor) {
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
        Partida partida = partidaRepository.findById(idPartida).orElseThrow();
        partida.setEstado("FINALIZADO");

        for (Map<String, Object> j : jugadores) {
            Long idJugador = Long.valueOf(j.get("idJugador").toString());
            int posicion = Integer.parseInt(j.get("posicion").toString());

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
        return partidaRepository.findById(id).orElseThrow();
    }

    @Transactional
    public void registrarPartidaFinalizada(Map<String, Object> payload) {
        Partida partida = new Partida();
        partida.setEstado("FINALIZADO");
        partida.setNumeroRonda(1);
        partida = partidaRepository.save(partida);

        // Ganador
        if (payload.containsKey("ganador") && payload.get("ganador") != null) {
            Map<String, Object> ganadorData = (Map<String, Object>) payload.get("ganador");
            procesarJugador(ganadorData, partida, 1);
        }

        // Perdedores
        if (payload.containsKey("perdedores") && payload.get("perdedores") != null) {
            List<Map<String, Object>> perdedoresData = (List<Map<String, Object>>) payload.get("perdedores");
            for (Map<String, Object> pData : perdedoresData) {
                procesarJugador(pData, partida, 2);
            }
        }
        
        partidaRepository.save(partida);
    }

    private void procesarJugador(Map<String, Object> data, Partida partida, int posicion) {
        if (data == null || !data.containsKey("nombreUsuario") || !data.containsKey("faccionId")) return;
        String nickname = data.get("nombreUsuario").toString();
        String faccionId = data.get("faccionId").toString();

        Usuario u = usuarioRepository.findByNickname(nickname).orElse(null);
        if (u == null) return;

        Faccion faccion = null;
        for (Faccion f : u.getFacciones()) {
            if (faccionId.equals(f.getTipo())) {
                faccion = f;
                break;
            }
        }

        if (faccion == null) {
            faccion = new Faccion();
            faccion.setNombre(faccionId);
            faccion.setTipo(faccionId);
            faccion.setPropietario(u);
            faccion.setVictorias(0);
            faccion.setVidas(5);
        }

        if (posicion == 1) {
            faccion.setVictorias(faccion.getVictorias() + 1);
            u.setMonedas(u.getMonedas() + 200);
        } else {
            faccion.setVidas(Math.max(0, faccion.getVidas() - 1));
            u.setMonedas(u.getMonedas() + 50);
        }

        faccion = faccionRepository.save(faccion);
        usuarioRepository.save(u);

        ParticipantePartida pp = new ParticipantePartida();
        pp.setPartida(partida);
        pp.setUsuario(u);
        pp.setFaccion(faccion);
        pp.setPosicion(posicion);
        pp.setVida(posicion == 1 ? 100 : 0);
        
        partida.getParticipantes().add(pp);
    }
}
