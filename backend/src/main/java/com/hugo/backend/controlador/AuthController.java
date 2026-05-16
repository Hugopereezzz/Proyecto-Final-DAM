package com.hugo.backend.controlador;

import com.hugo.backend.servicio.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

//Este archivo es el "controlador de autenticacion".
//Un controlador es el que recibe las peticiones HTTP del frontend
//y decide que hacer con ellas.
//Este en concreto maneja todo lo relacionado con el login del administrador, y solo del admin
// el de los usuarios 'normales' estan en otro archivo.

@RestController
@RequestMapping("/api/auth")  //Todas las rutas de este archivo empiezan por /api/auth
public class AuthController {



     //Inyecta el servicio de autenticacin para poder usarlo aqui
    @Autowired
    private AuthService authService;


    //escucha peticiones POST en el login (como ya dijimos antes todas las rutas empiezan igual asique seria
    // /api/auth/login)

    //El frontend manda un JSON que lo hace automaticamente SringBoot, nosotros no.
    //Manda este formato {"username: admin, password: admin1234"}
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String password = request.get("password");


        //Le pide a AuthService que compruebe si las credenciales son correctas
        //Si son validas devuelve un token JWT, y sino, devuelve null
        String token = authService.loginAdmin(username, password);

        //Si es correcto el login, devuelve el token al frontend, el cual guardara
        //el toekn y lo usara en las peticiones
        if (token != null) {
            return ResponseEntity.ok(Map.of("token", token));
        }

        //Si el login es incorrecto devuelve el error 401 (No autorizado)
        return ResponseEntity.status(401).body("Credenciales inválidas");
    }


    //Escucha peticiones POST en middleware-password (/api/auth/reset-middleware-password)
    //Permite cambiar la contraseña del usuario admin que se crea automaticamente como pide
    // la rúbrica de ADT
    @PostMapping("/reset-middleware-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {

        //Saca la nueva contraseña del cuerpo de la peticion
        //El frontend manda el JSON como: { "newPassword": "nuevaPass123" }
        String newPassword = request.get("newPassword");
        if (authService.resetMiddlewarePassword(newPassword)) {

            //Si la contrseña es cambiada con exito devuelve "Password actualizado"
            return ResponseEntity.ok("Password actualizado");
        }

        //Si por algun casual no encuentra al user admin en la bd, devuelve el codigo 404 (not found)
        return ResponseEntity.status(404).body("Usuario administrador no encontrado");
    }
}
