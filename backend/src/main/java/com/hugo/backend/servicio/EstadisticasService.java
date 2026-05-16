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

//Servicio de estadisticas.
//Se encarga de todo lo relacionado con calcular y consultar estadisticas del juego.
//Trabaja principalmente con MongoDB para las consultas de estadisticas.
@Service
public class EstadisticasService {

    @Autowired
    private PartidaRepository partidaRepository;    //Para leer partidas de SQL
    @Autowired
    private PartidaMongoRepository mongoRepository; //Para leer y escribir en MongoDB

    //@Transactional significa que si algo falla a mitad del proceso,
    //todos los cambios se deshacen y la base de datos queda como estaba.
    //Copia todas las partidas de SQL a MongoDB, pero solo las que no existen ya en Mongo
    //para evitar duplicados.
    @Transactional
    public void copiarPartidasAMongo() {
        List<Partida> partidas = partidaRepository.findAll();
        for (Partida p : partidas) {

            //Si la partida ya existe en MongoDB, la saltamos
            if (mongoRepository.findByOriginalId(p.getId()).isPresent()) {
                continue;
            }

            //Crea el documento de MongoDB con los datos de la partida SQL
            PartidaDoc doc = new PartidaDoc();
            doc.setOriginalId(p.getId());
            doc.setEstado(p.getEstado());
            doc.setNumeroRonda(p.getNumeroRonda());

            //Convierte cada participante de SQL a su version MongoDB
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
            mongoRepository.save(doc); //Guarda la partida en MongoDB
        }
    }

    //Devuelve todas las partidas guardadas en MongoDB
    public List<PartidaDoc> obtenerPartidasMongo() {
        return mongoRepository.findAll();
    }

    //Devuelve el usuario con mas victorias.
    //Recorre todas las partidas y cuenta cuantas veces cada jugador quedo en posicion 1.
    public Map<String, Object> obtenerUsuarioTop() {
        List<PartidaDoc> partidas = mongoRepository.findAll();
        Map<String, Long> victorias = new HashMap<>();

        for (PartidaDoc pd : partidas) {
            for (ParticipanteDoc p : pd.getParticipantes()) {
                //Solo cuenta si el jugador quedo en primera posicion (ganador)
                if (p.getPosicion() != null && p.getPosicion() == 1) {
                    victorias.put(p.getNickname(), victorias.getOrDefault(p.getNickname(), 0L) + 1);
                }
            }
        }

        //Devuelve el jugador con mas victorias, o un mapa vacio si no hay datos
        return victorias.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(e -> Map.of("nickname", (Object) e.getKey(), "victorias", e.getValue()))
                .orElse(Collections.emptyMap());
    }

    //Devuelve el tipo de faccion que mas veces ha ganado.
    //Funciona igual que obtenerUsuarioTop pero agrupando por tipo de faccion.
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

    //Devuelve la lista de todos los jugadores ordenados por victorias de mayor a menor.
    //Cada elemento de la lista tiene el nickname y el numero de victorias.
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

        //Convierte el mapa a una lista ordenada de mayor a menor victorias
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

    //Devuelve la lista de tipos de faccion ordenados por victorias de mayor a menor.
    //Funciona igual que rankingUsuarios pero agrupando por tipo de faccion.
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

    //Devuelve todas las estadisticas de un usuario concreto buscandolo por nickname.
    //Primero sincroniza SQL con MongoDB para asegurarse de tener los datos mas recientes.
    public Map<String, Object> obtenerEstadisticasUsuario(String nickname) {

        //Sincroniza los datos de SQL a MongoDB antes de calcular
        copiarPartidasAMongo();

        List<PartidaDoc> partidas = mongoRepository.findAll();
        int partidasJugadas = 0;
        int victorias = 0;
        Map<String, Integer> faccionesCount = new HashMap<>(); //Cuenta cuantas veces uso cada faccion
        int totalRondas = 0;

        //Recorre todas las partidas buscando las que jugo este usuario
        for (PartidaDoc pd : partidas) {
            for (ParticipanteDoc p : pd.getParticipantes()) {
                if (nickname.equalsIgnoreCase(p.getNickname())) {
                    partidasJugadas++;
                    totalRondas += pd.getNumeroRonda();
                    if (p.getPosicion() != null && p.getPosicion() == 1) {
                        victorias++;
                    }
                    //Suma una vez mas el uso de esta faccion
                    String faccion = p.getFaccionNombre();
                    faccionesCount.put(faccion, faccionesCount.getOrDefault(faccion, 0) + 1);
                }
            }
        }

        //La faccion favorita es la que mas veces ha usado
        String faccionFavorita = faccionesCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Ninguna");

        //Estimacion del tiempo jugado: 30s por ronda + 10s de transicion entre rondas = 40s por ronda
        int tiempoJugadoSegundos = totalRondas * 40;
        int horas = tiempoJugadoSegundos / 3600;
        int minutos = (tiempoJugadoSegundos % 3600) / 60;

        //Construye el mapa de estadisticas que se devolvera al frontend
        Map<String, Object> stats = new HashMap<>();
        stats.put("nickname", nickname);
        stats.put("partidasJugadas", partidasJugadas);
        stats.put("victorias", victorias);
        stats.put("faccionFavorita", faccionFavorita);
        stats.put("tiempoJugado", String.format("%dh %dm", horas, minutos)); //Formato "2h 30m"
        stats.put("rondasTotales", totalRondas);

        return stats;
    }

    //Guarda una partida directamente en MongoDB.
    //Se usa cuando el juego termina y manda los datos de la partida al servidor.
    public void registrarPartida(PartidaDoc doc) {
        mongoRepository.save(doc);
    }

    //Inserta una partida de prueba en MongoDB con datos inventados.
    //Solo se usa en desarrollo para tener datos con los que probar sin jugar partidas reales.
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
        p1.setPosicion(1); //Este jugador de prueba gana la partida

        doc.setParticipantes(List.of(p1));
        mongoRepository.save(doc);
    }
}