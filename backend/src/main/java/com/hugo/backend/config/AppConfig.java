package com.hugo.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AppConfig {


//Esto crea el encriptador de pasword que va a usar la app. 
// Al ponerle @Bean, Spring sabe que tiene que tener esto listo y darselo a cualquier parte que lo necesite 
// BCrypt es lento porque esta diseñado para que cada encriptación tarde unos 100-300 milisegundos en lugar de microsegundos 
// reduciendo mucho los intentos por segundo que hacen para desencriptarlo

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
