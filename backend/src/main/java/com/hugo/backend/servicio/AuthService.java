package com.hugo.backend.servicio;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.repositorio.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

//Servicio de autenticacion.
//Un servicio es donde vive la logica de negocio
//Este en concreto se encarga de todo lo relacionado con login y tokens JWT.
@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    //Clave secreta que se usa para firmar y verificar los tokens JWT.
    //Esta clave es como el sello del servidor, si alguien modifica el token
    //la firma no coincidira y el token sera rechazado.
    //OJO: en produccion esta clave deberia estar en una variable de entorno,
    //nunca escrita directamente en el codigo.
    private final Key key = Keys.hmacShaKeyFor(Decoders.BASE64.decode("uVv1oZQe3lq3Jw9uXlZkY2h0b3Rlc3QxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ1Njc4OTA="));

    //Nickname fijo del usuario administrador, usado en varios sitios del proyecto
    public static final String ADMIN_NICKNAME = "middleware_admin";

    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    //Login exclusivo para el administrador.
    //Si el nickname no es el del admin, rechaza directamente sin ni comprobar la contrasena.
    //Si es el admin y la contrasena es correcta, genera y devuelve un token JWT.
    public String loginAdmin(String nickname, String rawPassword) {
        if (!ADMIN_NICKNAME.equals(nickname)) {
            return null; //No es el admin, acceso denegado
        }
        Optional<Usuario> opt = authenticate(nickname, rawPassword);
        if (opt.isEmpty()) return null;
        return generateToken(opt.get());
    }

    //Login generico para cualquier usuario.
    //Comprueba credenciales y si son correctas devuelve un token JWT.
    public String login(String nickname, String rawPassword) {
        Optional<Usuario> opt = authenticate(nickname, rawPassword);
        if (opt.isEmpty()) return null;
        return generateToken(opt.get());
    }

    //Comprueba si el nickname existe y si la contrasena coincide con la encriptada.
    //Devuelve el usuario si todo es correcto, o un Optional vacio si algo falla.
    public Optional<Usuario> authenticate(String nickname, String rawPassword) {
        Optional<Usuario> opt = usuarioRepository.findByNickname(nickname);
        if (opt.isEmpty()) return Optional.empty(); //El nickname no existe

        Usuario u = opt.get();

        //passwordEncoder.matches compara la contrasena en texto plano
        //con la version encriptada guardada en la base de datos
        if (!passwordEncoder.matches(rawPassword, u.getPassword())) return Optional.empty();

        return Optional.of(u);
    }

    //Genera un token JWT para el usuario.
    //El token contiene el ID del usuario y expira en 1 hora (3600 segundos).
    //Esta firmado con la clave secreta para que no pueda ser falsificado.
    public String generateToken(Usuario u) {
        Instant now = Instant.now();
        return Jwts.builder()
                .setSubject(u.getId().toString()) //Guarda el ID del usuario dentro del token
                .setIssuedAt(Date.from(now))       //Fecha de creacion del token
                .setExpiration(Date.from(now.plusSeconds(3600))) //Expira en 1 hora
                .signWith(key, SignatureAlgorithm.HS256) //Firma el token con la clave secreta
                .compact(); //Convierte todo a la cadena de texto final
    }

    //Encripta una contrasena en texto plano usando BCrypt.
    //Se usa al crear o actualizar contrasenas antes de guardarlas en la base de datos.
    public String encode(String raw) { return passwordEncoder.encode(raw); }

    //Comprueba si un token JWT es valido (no esta manipulado y no ha expirado).
    //Devuelve true si es valido, false si algo falla.
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false; //El token es invalido o ha expirado
        }
    }

    //Saca el ID del usuario que esta guardado dentro del token JWT.
    //Se usa en el filtro JWT para saber que usuario esta haciendo la peticion.
    public Long getUserIdFromToken(String token) {
        try {
            return Long.valueOf(Jwts.parserBuilder().setSigningKey(key).build()
                    .parseClaimsJws(token).getBody().getSubject());
        } catch (Exception e) {
            return null; //Si el token es invalido devuelve null
        }
    }

    //Cambia la contrasena del administrador.
    //Solo se usa en desarrollo para resetear la contrasena del admin rapidamente.
    //En produccion esto deberia estar protegido o directamente eliminado.
    public boolean resetMiddlewarePassword(String newPassword) {
        Optional<Usuario> opt = usuarioRepository.findByNickname(ADMIN_NICKNAME);
        if (opt.isEmpty()) return false; //El admin no existe en la base de datos

        Usuario u = opt.get();
        u.setPassword(passwordEncoder.encode(newPassword)); //Encripta la nueva contrasena
        usuarioRepository.save(u); //Guarda el cambio en la base de datos
        return true;
    }
}