package com.hugo.backend.controlador;

import com.hugo.backend.servicio.PartidaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/partidas")
@CrossOrigin(origins = "*")
public class PartidaController {

    @Autowired
    private PartidaService partidaService;

    @PostMapping("/registrar")
    public ResponseEntity<Void> registrarPartida(@RequestBody Map<String, Object> payload) {
        partidaService.registrarPartidaFinalizada(payload);
        return ResponseEntity.ok().build();
    }
}
