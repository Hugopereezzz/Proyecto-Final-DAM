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

    @Bean
    CommandLineRunner initDatabase(UsuarioRepository repository, AuthService authService) {
        return args -> {
            String adminNickname = AuthService.ADMIN_NICKNAME;
            Optional<Usuario> adminOpt = repository.findByNickname(adminNickname);

            if (adminOpt.isEmpty()) {
                System.out.println("[BOOTSTRAP] Creando usuario administrador: " + adminNickname);
                Usuario admin = new Usuario();
                admin.setNombre("Admin");
                admin.setApellidos("Middleware");
                admin.setNickname(adminNickname);
                admin.setPassword(authService.encode("admin1234")); // Password por defecto
                admin.setEmail("admin@proyecto.com");
                admin.setMonedas(0);
                admin.setVictorias(0);
                repository.save(admin);
                System.out.println("[BOOTSTRAP] Usuario administrador creado con éxito.");
            } else {
                System.out.println("[BOOTSTRAP] El usuario administrador ya existe.");
            }
        };
    }
}
