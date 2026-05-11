package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partidas")
@CrossOrigin(origins = "*")
public class PartidaController {

    @Autowired
    private PartidaRepository partidaRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ZonaRepository zonaRepository;

    @PostMapping("/guardar")
    public ResponseEntity<Partida> guardar(@RequestBody Partida partida) {
        return ResponseEntity.ok(partidaRepository.save(partida));
    }

    @PostMapping("/finalizar")
    @Transactional
    public ResponseEntity<?> finalizar(@RequestBody Map<String, Long> ids) {
        Long ganadorId = ids.get("ganadorId");
        Long perdedorId = ids.get("perdedorId");
        Long zonaGanadoraId = ids.get("zonaGanadoraId");
        Long zonaPerdedoraId = ids.get("zonaPerdedoraId");

        userRepository.findById(ganadorId).ifPresent(u -> {
            u.setCredits(u.getCredits() + 200);
            u.setWins(u.getWins() + 1);
            userRepository.save(u);
        });
        if (zonaGanadoraId != null) {
            zonaRepository.findById(zonaGanadoraId).ifPresent(z -> {
                z.setVictorias(z.getVictorias() + 1);
                zonaRepository.save(z);
            });
        }

        userRepository.findById(perdedorId).ifPresent(u -> {
            u.setCredits(u.getCredits() + 50);
            userRepository.save(u);
        });
        if (zonaPerdedoraId != null) {
            zonaRepository.findById(zonaPerdedoraId).ifPresent(z -> {
                z.setVidas(z.getVidas() - 1);
                zonaRepository.save(z);
            });
        }

        return ResponseEntity.ok("Partida finalizada");
    }

    @PostMapping("/finalizar-con-posiciones")
    @Transactional
    public ResponseEntity<?> finalizarConPosiciones(@RequestBody List<Map<String, Object>> resultados) {
        for (Map<String, Object> res : resultados) {
            Long userId = ((Number) res.get("userId")).longValue();
            Long zonaId = ((Number) res.get("zonaId")).longValue();
            int posicion = ((Number) res.get("posicion")).intValue();

            int premio = 500 - 50 * (posicion - 1);
            
            userRepository.findById(userId).ifPresent(u -> {
                u.setCredits(u.getCredits() + premio);
                if (posicion == 1) u.setWins(u.getWins() + 1);
                userRepository.save(u);
            });

            zonaRepository.findById(zonaId).ifPresent(z -> {
                if (posicion != 1) z.setVidas(z.getVidas() - 1);
                if (posicion == 1) z.setVictorias(z.getVictorias() + 1);
                zonaRepository.save(z);
            });
        }
        return ResponseEntity.ok("Resultados procesados");
    }

    @GetMapping
    public List<Partida> listar() {
        return partidaRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Partida> detalle(@PathVariable Long id) {
        return partidaRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
