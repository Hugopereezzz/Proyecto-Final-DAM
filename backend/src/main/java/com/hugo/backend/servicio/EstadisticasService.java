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
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(e -> ranking.add(Map.of("nickname", (Object) e.getKey(), "victorias", e.getValue())));
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
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(e -> ranking.add(Map.of("tipo", (Object) e.getKey(), "victorias", e.getValue())));
        return ranking;
    }
}
