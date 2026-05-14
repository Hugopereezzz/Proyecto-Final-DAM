package com.hugo.backend.servicio;

import com.hugo.backend.document.ParticipanteDoc;
import com.hugo.backend.document.PartidaDoc;
import com.hugo.backend.modelo.Partida;
import com.hugo.backend.modelo.ParticipantePartida;
import com.hugo.backend.repositorio.PartidaMongoRepository;
import com.hugo.backend.repositorio.PartidaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
public class EstadisticasService {

    @Autowired
    private PartidaRepository partidaRepository;
    @Autowired
    private PartidaMongoRepository mongoRepository;

    @Transactional
    public void copiarPartidasAMongo() {
        List<Partida> partidas = partidaRepository.findAll();
        for (Partida p : partidas) {
            // Solo copiar si no existe ya en Mongo
            if (mongoRepository.findByOriginalId(p.getId()).isPresent()) {
                continue;
            }

            PartidaDoc doc = new PartidaDoc();
            doc.setOriginalId(p.getId());
            doc.setEstado(p.getEstado());
            doc.setNumeroRonda(p.getNumeroRonda());
            List<ParticipanteDoc> docs = new ArrayList<>();
            for (ParticipantePartida part : p.getParticipantes()) {
                ParticipanteDoc pDoc = new ParticipanteDoc();
                pDoc.setUsuarioId(part.getUsuario().getId());
                pDoc.setNickname(part.getUsuario().getNickname());
                pDoc.setFaccionId(part.getFaccion().getId());
                pDoc.setFaccionNombre(part.getFaccion().getNombre());
                pDoc.setFaccionTipo(part.getFaccion().getTipo());
                pDoc.setVida(part.getVida());
                pDoc.setPosicion(part.getPosicion());
                docs.add(pDoc);
            }
            doc.setParticipantes(docs);
            mongoRepository.save(doc);
        }
    }

    public List<PartidaDoc> obtenerPartidasMongo() {
        return mongoRepository.findAll();
    }

    public Map<String, Object> obtenerUsuarioTop() {
        List<PartidaDoc> partidas = mongoRepository.findAll();
        Map<String, Long> victorias = new HashMap<>();
        for (PartidaDoc pd : partidas) {
            for (ParticipanteDoc p : pd.getParticipantes()) {
                if (p.getPosicion() != null && p.getPosicion() == 1) {
                    victorias.put(p.getNickname(), victorias.getOrDefault(p.getNickname(), 0L) + 1);
                }
            }
        }
        return victorias.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> Map.of("nickname", (Object) e.getKey(), "victorias", e.getValue()))
                .orElse(Collections.emptyMap());
    }

    public Map<String, Object> obtenerTipoFaccionTop() {
        List<PartidaDoc> partidas = mongoRepository.findAll();
        Map<String, Long> victorias = new HashMap<>();
        for (PartidaDoc pd : partidas) {
            for (ParticipanteDoc p : pd.getParticipantes()) {
                if (p.getPosicion() != null && p.getPosicion() == 1) {
                    victorias.put(p.getFaccionTipo(), victorias.getOrDefault(p.getFaccionTipo(), 0L) + 1);
                }
            }
        }
        return victorias.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> Map.of("tipo", (Object) e.getKey(), "victorias", e.getValue()))
                .orElse(Collections.emptyMap());
    }

    public List<Map<String, Object>> rankingUsuarios() {
        List<PartidaDoc> partidas = mongoRepository.findAll();
        Map<String, Long> victorias = new HashMap<>();
        for (PartidaDoc pd : partidas) {
            for (ParticipanteDoc p : pd.getParticipantes()) {
                if (p.getPosicion() != null && p.getPosicion() == 1) {
                    victorias.put(p.getNickname(), victorias.getOrDefault(p.getNickname(), 0L) + 1);
                }
            }
        }
        List<Map<String, Object>> ranking = new ArrayList<>();
        victorias.entrySet().stream()
                .filter(e -> e.getKey() != null)
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(e -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("nickname", e.getKey());
                    item.put("victorias", e.getValue());
                    ranking.add(item);
                });
        return ranking;
    }

    public List<Map<String, Object>> rankingTiposFaccion() {
        List<PartidaDoc> partidas = mongoRepository.findAll();
        Map<String, Long> victorias = new HashMap<>();
        for (PartidaDoc pd : partidas) {
            for (ParticipanteDoc p : pd.getParticipantes()) {
                if (p.getPosicion() != null && p.getPosicion() == 1) {
                    victorias.put(p.getFaccionTipo(), victorias.getOrDefault(p.getFaccionTipo(), 0L) + 1);
                }
            }
        }
        List<Map<String, Object>> ranking = new ArrayList<>();
        victorias.entrySet().stream()
                .filter(e -> e.getKey() != null)
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(e -> {
                    Map<String, Object> item = new HashMap<>();
                    item.put("tipo", e.getKey());
                    item.put("victorias", e.getValue());
                    ranking.add(item);
                });
        return ranking;
    }

    public Map<String, Object> obtenerEstadisticasUsuario(String nickname) {
        // Sincronizar datos antes de calcular
        copiarPartidasAMongo();

        List<PartidaDoc> partidas = mongoRepository.findAll();
        int partidasJugadas = 0;
        int victorias = 0;
        Map<String, Integer> faccionesCount = new HashMap<>();
        int totalRondas = 0;

        for (PartidaDoc pd : partidas) {
            for (ParticipanteDoc p : pd.getParticipantes()) {
                if (nickname.equalsIgnoreCase(p.getNickname())) {
                    partidasJugadas++;
                    totalRondas += pd.getNumeroRonda();
                    if (p.getPosicion() != null && p.getPosicion() == 1) {
                        victorias++;
                    }
                    String faccion = p.getFaccionNombre();
                    faccionesCount.put(faccion, faccionesCount.getOrDefault(faccion, 0) + 1);
                }
            }
        }

        String faccionFavorita = faccionesCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Ninguna");

        // Estimación de tiempo: 30s por ronda + 10s de transición = 40s
        int tiempoJugadoSegundos = totalRondas * 40;
        int horas = tiempoJugadoSegundos / 3600;
        int minutos = (tiempoJugadoSegundos % 3600) / 60;

        Map<String, Object> stats = new HashMap<>();
        stats.put("nickname", nickname);
        stats.put("partidasJugadas", partidasJugadas);
        stats.put("victorias", victorias);
        stats.put("faccionFavorita", faccionFavorita);
        stats.put("tiempoJugado", String.format("%dh %dm", horas, minutos));
        stats.put("rondasTotales", totalRondas);

        return stats;
    }

    public void registrarPartida(PartidaDoc doc) {
        mongoRepository.save(doc);
    }

    public void seedData() {
        PartidaDoc doc = new PartidaDoc();
        doc.setOriginalId(0L);
        doc.setEstado("FINALIZADA");
        doc.setNumeroRonda(5);
        
        ParticipanteDoc p1 = new ParticipanteDoc();
        p1.setNickname("TestPlayer");
        p1.setFaccionNombre("Faccion de Prueba");
        p1.setFaccionTipo("MISTICO");
        p1.setVida(100);
        p1.setPosicion(1);
        
        doc.setParticipantes(List.of(p1));
        mongoRepository.save(doc);
    }
}
