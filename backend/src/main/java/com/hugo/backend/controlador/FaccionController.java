package com.hugo.backend.controlador;

import com.hugo.backend.modelo.Faccion;
import com.hugo.backend.servicio.FaccionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

//Controlador de facciones.
//Gestiona todo lo relacionado con las facciones del juego.
//Estas rutas SI requieren token JWT (no están en la lista de publicas de SecurityConfig.java)
@RestController
@RequestMapping("/api/facciones")
public class FaccionController {

    //Inyecta el servicio que tiene la logica de facciones
    @Autowired
    private FaccionService faccionService;

    //Crea una faccion nueva.
    //El frontend manda algo como:
    //{ "usuarioId": 1, "nombre": "Los Elfos", "tipo": "magia" }
    @PostMapping
    public ResponseEntity<Faccion> crearFaccion(@RequestBody Map<String, Object> body) {
        // Saca cada campo de la peticion y lo convierte al tipo correcto
        Long usuarioId = Long.valueOf(body.get("usuarioId").toString()); // ID del usuario que crea la facción
        String nombre = body.get("nombre").toString();                   // Nombre de la faccion
        String tipo = body.get("tipo").toString();                       // Tipo de facción (magia, guerrero, etc.)

        //Le pasa los datos al servicio para que cree la facción y la devuelve
        return ResponseEntity.ok(faccionService.crearFaccionDirecto(usuarioId, nombre, tipo));
    }

    //Devuelve la lista de TODAS las facciones existentes
    @GetMapping
    public List<Faccion> listarTodas() {
        return faccionService.obtenerTodas();
    }

    //Devuelve las facciones ordenadas por algun criterio (victorias, puntos...)
    //Lo que define ese orden esta en el servicio
    @GetMapping("/ranking")
    public List<Faccion> ranking() {
        return faccionService.obtenerRanking();
    }

    //Actualiza los datos de una faccion existente buscandola por su ID.
    //Ejemplo: PUT /api/facciones/3 → actualiza la faccion con ID 3
    //El frontend manda en el cuerpo los nuevos datos de la faccion
    @PutMapping("/{id}")
    public ResponseEntity<Faccion> actualizar(@PathVariable Long id, @RequestBody Faccion faccion) {
        return ResponseEntity.ok(faccionService.actualizarFaccion(id, faccion));
    }

    //Elimina una faccion por su ID.
    //Ejemplo: DELETE /api/facciones/3 pues borra la facción con ID 3
    //Devuelve 204 (No Content) que significa "se hizo bien pero no hay nada que devolver"
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        faccionService.eliminarFaccion(id);
        return ResponseEntity.noContent().build();
    }
}