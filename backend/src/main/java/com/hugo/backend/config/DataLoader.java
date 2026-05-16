package com.hugo.backend.config;

import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.repositorio.UsuarioRepository;
import com.hugo.backend.servicio.AuthService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Optional;

@Configuration
public class DataLoader {

//Este archivo se encarga de preparar datos iniciales en la base de datos
//cuando la aplicacion arranca por primera vez.

    @Bean
    CommandLineRunner initDatabase(UsuarioRepository repository, AuthService authService) {
        return args -> {

            //Coge el nickname del admin que está definido en AuthService
            String adminNickname = AuthService.ADMIN_NICKNAME;

            //Busca en la base de datos si ya existe un usuario con ese nickname.
            //Optional sirve pa no tener errores cuando algo no existe en la base de datos.
            Optional<Usuario> adminOpt = repository.findByNickname(adminNickname);

            
            //Si el adminOtp que es como lo hgemos declarado esta vacio quiere decir 
            //que el admin no existe todavia por lo cual lo crea
            if (adminOpt.isEmpty()) {
                System.out.println("[BOOTSTRAP] Creando usuario administrador: " + adminNickname);

                //Crea un objeto Usuario y le rellena todos sus datos como marca la rubrica de Sergio
                Usuario admin = new Usuario();
                admin.setNombre("Admin");
                admin.setApellidos("Middleware");
                admin.setNickname(adminNickname);
                admin.setPassword(authService.encode("admin1234")); // Password por defecto
                admin.setEmail("admin@proyecto.com");
                admin.setMonedas(0);
                admin.setVictorias(0);

                //Guarda el admin en la base de datos
                repository.save(admin);
                System.out.println("[BOOTSTRAP] Usuario administrador creado con éxito.");
            } else {

                // Si ya existia, no hace nada, solo avisa por consola que ya existe
                System.out.println("[BOOTSTRAP] El usuario administrador ya existe.");
            }
        };
    }
}
