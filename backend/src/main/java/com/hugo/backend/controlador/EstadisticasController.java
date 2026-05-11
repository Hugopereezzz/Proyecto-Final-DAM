package com.hugo.backend.controlador;

import com.hugo.backend.document.PartidaDoc;
import com.hugo.backend.servicio.EstadisticasService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/estadisticas")
public class EstadisticasController {

    @Autowired
    private EstadisticasService estadisticasService;

    @PostMapping("/copiar")
    public ResponseEntity<Void> copiar() {
        estadisticasService.copiarPartidasAMongo();
        return ResponseEntity.ok().build();
    }

    @GetMapping("/partidas")
    public List<PartidaDoc> listarPartidas() {
        return estadisticasService.obtenerPartidasMongo();
    }

    @GetMapping("/usuario-top")
    public Map<String, Object> usuarioTop() {
        return estadisticasService.obtenerUsuarioTop();
    }

    @GetMapping("/tipo-faccion-top")
    public Map<String, Object> tipoFaccionTop() {
        return estadisticasService.obtenerTipoFaccionTop();
    }

    @GetMapping("/ranking-usuarios")
    public List<Map<String, Object>> rankingUsuarios() {
        return estadisticasService.rankingUsuarios();
    }

    @GetMapping("/ranking-tipos-faccion")
    public List<Map<String, Object>> rankingTiposFaccion() {
        return estadisticasService.rankingTiposFaccion();
    }
}
