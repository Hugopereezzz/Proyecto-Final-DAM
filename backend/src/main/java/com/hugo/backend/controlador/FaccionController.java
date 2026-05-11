package com.hugo.backend.controlador;

import com.hugo.backend.modelo.Faccion;
import com.hugo.backend.servicio.FaccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/facciones")
public class FaccionController {

    @Autowired
    private FaccionService faccionService;

    @PostMapping
    public ResponseEntity<Faccion> crearFaccion(@RequestBody Map<String, Object> body) {
        Long usuarioId = Long.valueOf(body.get("usuarioId").toString());
        String nombre = body.get("nombre").toString();
        String tipo = body.get("tipo").toString();
        return ResponseEntity.ok(faccionService.crearFaccionDirecto(usuarioId, nombre, tipo));
    }

    @GetMapping
    public List<Faccion> listarTodas() {
        return faccionService.obtenerTodas();
    }

    @GetMapping("/ranking")
    public List<Faccion> ranking() {
        return faccionService.obtenerRanking();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Faccion> actualizar(@PathVariable Long id, @RequestBody Faccion faccion) {
        return ResponseEntity.ok(faccionService.actualizarFaccion(id, faccion));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        faccionService.eliminarFaccion(id);
        return ResponseEntity.noContent().build();
    }
}
