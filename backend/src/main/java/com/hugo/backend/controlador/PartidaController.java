package com.hugo.backend.controlador;

import com.hugo.backend.modelo.Partida;
import com.hugo.backend.servicio.PartidaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/partidas")
@CrossOrigin(origins = "*")
public class PartidaController {

    @Autowired
    private PartidaService partidaService;

    @PostMapping
    public ResponseEntity<Partida> guardar(@RequestBody Partida partida) {
        System.out.println(">>> RECIBIDA PETICIÓN PARA GUARDAR PARTIDA: " + partida.getEstado());
        if (partida.getParticipantes() != null) {
            System.out.println(">>> NÚMERO DE PARTICIPANTES: " + partida.getParticipantes().size());
        }
        try {
            Partida guardada = partidaService.guardarPartida(partida);
            System.out.println(">>> PARTIDA GUARDADA CON ÉXITO, ID: " + guardada.getId());
            return ResponseEntity.ok(guardada);
        } catch (Exception e) {
            System.err.println(">>> ERROR AL GUARDAR PARTIDA: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    @GetMapping
    public List<Partida> listar() {
        return partidaService.obtenerTodas();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Partida> obtenerPorId(@PathVariable Long id) {
        return ResponseEntity.ok(partidaService.obtenerPorId(id));
    }
}
