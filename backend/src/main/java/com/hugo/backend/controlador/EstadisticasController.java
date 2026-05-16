package com.hugo.backend.controlador;

import com.hugo.backend.document.PartidaDoc;
import com.hugo.backend.servicio.EstadisticasService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


//Controlador de estadisticas (sacadas de MongoDB, como pide Sergio).
// Todas las rutas de aquí son PUBLICAS (porque en SecurityConfig.java
// pusimos /api/estadisticas/** como permitAll), cualquiera puede consultarlas sin token.

@RestController
@RequestMapping("/api/estadisticas")
public class EstadisticasController {

    @Autowired

    //Inyecta el servicio que tiene toda la logica de estadisticas
    private EstadisticasService estadisticasService;


    //Copia las partidas que hay en la base de datos SQL
    //a MongoDB para poder sacarlas de ahi
    @PostMapping("/copiar")
    public ResponseEntity<Void> copiar() {
        estadisticasService.copiarPartidasAMongo();
        return ResponseEntity.ok().build();
    }

    //Devuelve la lista de todas las partidas guardadas en MongoDB
    @GetMapping("/partidas")
    public List<PartidaDoc> listarPartidas() {
        return estadisticasService.obtenerPartidasMongo();
    }

    //Devuelve el usuario que más victorias tiene
    @GetMapping("/usuario-top")
    public Map<String, Object> usuarioTop() {
        return estadisticasService.obtenerUsuarioTop();
    }

    //Devuelve la faccion que ha ganado mas partidas en total
    @GetMapping("/tipo-faccion-top")
    public Map<String, Object> tipoFaccionTop() {
        return estadisticasService.obtenerTipoFaccionTop();
    }

    //Devuelve la lista de usuarios con mas victorias ordenados de
    //mayor a menos para el ranking
    @GetMapping("/rankingUsuarios")
    public List<Map<String, Object>> rankingUsuarios() {
        return estadisticasService.rankingUsuarios();
    }
    
    //Devuelve la lista de facciones con mas victorias ordenados de
    //mayor a menor
    @GetMapping("/rankingTiposFaccion")
    public List<Map<String, Object>> rankingTiposFaccion() {
        return estadisticasService.rankingTiposFaccion();
    }

    //Devuelve las estadisticas concretas de un usuario buscandolo por su nickname
    //Ejemplo: /api/estadisticas/admin devuelve las estadisticas del usuario "admin"
    //que se usan en el boton "estadisticas"
    @GetMapping("/{nickname}")
    public Map<String, Object> obtenerEstadisticasUsuario(@PathVariable String nickname) {
        return estadisticasService.obtenerEstadisticasUsuario(nickname);
    }

    //Inserta datos de prueba en MongoDB para poder testear sin partidas reales.
    //Esto solo se usa en desarrollo para hacer pruebas
    @GetMapping("/seed")
    public String seed() {
        estadisticasService.seedData();
        return "Datos de prueba insertados en MongoDB";
    }

    //Recibe los datos de las partidas recien acabadas y las guarda en MongoDB
    //El fontend manda un JSON como: { nickname: hugo, faccion: faccion1, resultado: victoria, ...}
    @PostMapping("/registrar")
    public ResponseEntity<Void> registrar(@RequestBody PartidaDoc doc) {
        estadisticasService.registrarPartida(doc);
        return ResponseEntity.ok().build();
    }
}
