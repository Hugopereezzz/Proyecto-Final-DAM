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

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
    private final AuthService authService;

    public JwtAuthFilter(AuthService authService) {
        this.authService = authService;
    }

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
        return skip;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        log.info("JwtAuthFilter - Path: {}, Method: {}, Auth header present: {}", 
                request.getServletPath(), request.getMethod(), header != null);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            log.info("Processing JWT token for path: {}", request.getServletPath());
            if (authService.validateToken(token)) {
                Long userId = authService.getUserIdFromToken(token);
                log.info("Token valid for userId: {}", userId);
                var authorities = java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_USER"));
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(userId, null, authorities);
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            } else {
                log.warn("Invalid JWT token on path: {}", request.getServletPath());
            }
        } else {
            log.info("No Bearer token found in request");
        }
        filterChain.doFilter(request, response);
    }
}
