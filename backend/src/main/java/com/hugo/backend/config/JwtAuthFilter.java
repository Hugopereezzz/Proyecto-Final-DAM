package com.hugo.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.hugo.backend.servicio.AuthService;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;


//Este archivo es un filtro es decir, un vigilante que intercepta
//TODAS las peticiones que llegan al servidor antes de que lleguen
//a cualquier endpoint. Su trabajo es comprobar si el usuario
//que hace la peticion tiene un token JWT valido.

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    //Sistema de logs para dejar rastro de lo que pasa
    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    //Necesita AuthService para poder validar tokens y sacar datos de ellos
    private final AuthService authService;

    public JwtAuthFilter(AuthService authService) {
        this.authService = authService;
    }



    //Decide si este filtro debe ignorar ciertas rutas.
    //Las rutas de login y registro no necesitan token porque son publicas
    //asi que las dejamos pasar sin comprobar nada.
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        boolean skip = path != null && (
            path.startsWith("/api/auth") || 
            path.startsWith("/api/usuarios/registro") || 
            path.startsWith("/api/usuarios/login")
        );
        if (skip) {
            log.debug("Skipping JwtAuthFilter for path: {}", path);
        }
        return skip;  //Skip es un booleano, si es true, el filtro se salta esta peticion
    }


    //Este metodo se ejecuta en cada peticion que NO fue ignorada, es decir, que el skip devolvio false.
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        //Busca en la cabecera de la petición el campo "Authorization"
        //Los tokens JWT siempre viajan ahí, con formato: "Bearer eltoken123..."
        String header = request.getHeader("Authorization");
        log.info("JwtAuthFilter - Path: {}, Method: {}, Auth header present: {}", 
                request.getServletPath(), request.getMethod(), header != null);

        //Si hay cabecera y empieza por "Bearer ", hay un token que analizar        
        if (header != null && header.startsWith("Bearer ")) {

            //Aqui lo que hacemos es quitar Bearer , que son 6 letras mas 1 del space
            //para que solo nos quede el token
            String token = header.substring(7);
            log.info("Processing JWT token for path: {}", request.getServletPath());

            //Comprueba si el token es válido, que no sea falso ni que haya expirado)
            if (authService.validateToken(token)) {

                //Saca el ID del usuario que esta dentro del token
                Long userId = authService.getUserIdFromToken(token);
                log.info("Token valid for userId: {}", userId);

                //Le asigna el rol ROLE_USER a este usuario para esta peticion
                var authorities = java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"));

                //Esto crea un objeto que representa que ese usuario esta autenticado
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);

                //Añade detalles extra de la petición por ejemplo la IP
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                //Esto le dice a Spring que ese usuario ya está verificado asique le deja pasar
                SecurityContextHolder.getContext().setAuthentication(auth);
            } else {
                log.warn("Invalid JWT token on path: {}", request.getServletPath());
            }

            //Si no habia token = el usuario no esta identificado
            //Spring lo tratara como anonimo y bloqueara rutas protegidas
        } else {
            log.info("No Bearer token found in request");
        }

        //Pasa la peticion al siguiente eslabon de la cadena
        //ya sea otro filtro o el endpoint final
        filterChain.doFilter(request, response);
    }
}
