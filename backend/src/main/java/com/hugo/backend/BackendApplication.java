package com.hugo.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

//Clase principal de la aplicacion. Es el punto de arranque de todo.
//Cuando ejecutas el proyecto, Java entra por aqui primero.
//@SpringBootApplication le dice a Spring que escanee todos los archivos
//del proyecto y prepare todo lo que haya configurado (filtros, rutas, base de datos...).
@SpringBootApplication
public class BackendApplication {

    //Metodo main: el punto de entrada de cualquier programa Java.
    //SpringApplication.run arranca el servidor con toda la configuracion del proyecto.
    //A partir de aqui el servidor esta escuchando peticiones del frontend.
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}