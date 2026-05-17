package com.hugo.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;


//En este archivo se define quien puede acceder a que y como funciona la seguridad

@Configuration
public class SecurityConfig {

    //Necesita el filtro JWT que creamos antes para añadirlo a la cadena de seguridad
    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    
    //Definde todas las reglas de seguridad del juego
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            
            //Desactiva CSRF porque la app usa tokens JWT en lugar de sesiones
            //CSRF es un tipo de ataque qeu solo afecta a apps con sesiones tradicionales
            //asi que aqui no hace falta
            .csrf(csrf -> csrf.disable())

            //Activa CORS con la configuracion que hacemos mas abajo
            //CORS es lo que permite el frontend pueda hablar con el backend
            //sin esto el navegador bloauearia las peticiones
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

            //Le dice a la app que NO guarde sesiones
            //cada peticion es independiente y debe traer su propio token (JWT)
            //la app no recuerda a los usuarios entre las peticiones
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            //Definde que rutas son publicas, y cuales necesitas estar autenticado
            .authorizeHttpRequests(auth -> auth
                    
                    //Las peticiones OPTIONS las deja pasar siempre
                    //OPTIONS es una peticion que el navegador hace antes de la real
                    //para preguntar "puedo hacer esto?"
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                    //Estas rutas son publicas, y cualquiera puede entar sin token
                    .requestMatchers("/api/auth/**", "/api/usuarios/registro", "/api/usuarios/login", "/api/usuarios/logout", "/api/usuarios/ranking", "/api/usuarios/incrementar-victorias/**", "/api/usuarios/refresh-session", "/api/estadisticas/**").permitAll()
                    
                    //Cualquiera de las demas rutas necesitas estar autenticado (token valido)
                    .anyRequest().authenticated()
            )
            
            //Añade nuestro filtro JWT justo antes del filtro de login de Spring.
            //asi, antes de que Spring intente autenticar a nadie,
            //ya hemos comprobado si el token JWT es válido.
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        // Removed httpBasic to avoid browser basic auth challenge for APIs
        return http.build();
    }

    
    //Configura las reglas de CORS (que origenes, metodos y cabeceras estan permitidos)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        //Permite peticiones desde cualquier origen (cualquier dominio o puerto)
        //En produccion seria mas restrictivo, solo el dominio del frontend
        configuration.setAllowedOriginPatterns(List.of("*"));

        //Permite estos metodos HTTP:
        //GET = obtener datos, POST = crear, PUT/PATCH = modificar, DELETE = borrar
        //OPTIONS = la de antes
        configuration.setAllowedMethods(List.of("GET","POST","PUT","PATCH","DELETE","OPTIONS"));

        //Permite cualquier cabecera en las peticiones (Authorization, Content-Type, etc.)
        configuration.setAllowedHeaders(List.of("*"));

        //No permite enviar cookies entre dominios distintos
        configuration.setAllowCredentials(false);

        //Aplica esta configuración a todas las rutas de la app
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
