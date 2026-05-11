package com.example.demo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ZonaController {

    @Autowired
    private ZonaRepository zonaRepository;

    @Autowired
    private UserRepository userRepository;

    private final Map<String, Double> COSTE_TIPO = Map.of(
        "Continental", 100.0,
        "Isla", 250.0,
        "Ártica", 500.0
    );

    @GetMapping("/usuarios/{id}/zonas")
    public List<Zona> listarZonasUsuario(@PathVariable Long id) {
        return zonaRepository.findByPropietarioId(id);
    }

    @PostMapping("/usuarios/{id}/comprar-zona")
    @Transactional
    public ResponseEntity<?> comprarZona(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return userRepository.findById(id).map(user -> {
            String tipo = body.get("tipo");
            String nombre = body.getOrDefault("nombre", "Nueva Zona");
            
            Double coste = COSTE_TIPO.get(tipo);
            if (coste == null) return ResponseEntity.badRequest().body("Tipo de zona no válido");
            
            if (user.getCredits() < coste) {
                return ResponseEntity.badRequest().body("Monedas insuficientes");
            }

            user.setCredits((int) (user.getCredits() - coste));
            userRepository.save(user);

            Zona zona = new Zona(nombre, tipo, coste, user);
            return ResponseEntity.ok(zonaRepository.save(zona));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/zonas")
    public List<Zona> listarTodas() {
        return zonaRepository.findAll();
    }

    @GetMapping("/zonas/ranking")
    public List<Zona> ranking() {
        return zonaRepository.findAllByOrderByVictoriasDesc();
    }

    @PutMapping("/zonas/{id}")
    public ResponseEntity<Zona> actualizar(@PathVariable Long id, @RequestBody Zona details) {
        return zonaRepository.findById(id).map(z -> {
            if (details.getNombre() != null) z.setNombre(details.getNombre());
            if (details.getTipo() != null) z.setTipo(details.getTipo());
            if (details.getVidas() > 0) z.setVidas(details.getVidas());
            return ResponseEntity.ok(zonaRepository.save(z));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/zonas/{id}")
    public ResponseEntity<?> eliminar(@PathVariable Long id) {
        return zonaRepository.findById(id).map(z -> {
            zonaRepository.delete(z);
            return ResponseEntity.ok().build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
