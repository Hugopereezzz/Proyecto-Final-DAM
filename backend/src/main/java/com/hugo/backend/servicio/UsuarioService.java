package com.hugo.backend.servicio;

import com.hugo.backend.modelo.Usuario;
import com.hugo.backend.repositorio.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

//Servicio de usuarios.
//Contiene toda la logica relacionada con los usuarios: registro, login,
//logout, sesiones, actualizaciones y ranking.
@Service
public class UsuarioService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder; //El encriptador de contrasenas del AppConfig

    //Registra un usuario nuevo.
    //Antes de guardarlo encripta su contrasena y le pone 0 monedas iniciales.
    @Transactional
    public Usuario guardarUsuario(Usuario usuario) {
        usuario.setPassword(passwordEncoder.encode(usuario.getPassword())); //Encripta la contrasena
        usuario.setMonedas(0); //Empieza sin monedas
        return usuarioRepository.save(usuario);
    }

    //Intenta hacer login con nickname y contrasena.
    //Hay tres casos posibles:
    //  - Credenciales incorrectas -> devuelve vacio (el controlador devuelve 401)
    //  - Tiene sesion activa vigente -> devuelve vacio (el controlador devuelve 409)
    //  - Todo correcto -> crea sesion nueva y devuelve el usuario
    @Transactional
    public Optional<Usuario> login(String nickname, String password) {
        Optional<Usuario> opt = usuarioRepository.findByNickname(nickname);
        if (opt.isEmpty()) return Optional.empty(); //El nickname no existe

        Usuario u = opt.get();

        //Comprueba si la contrasena es correcta
        if (!passwordEncoder.matches(password, u.getPassword())) return Optional.empty();

        //Si ya tiene un token de sesion, comprueba si ha caducado
        if (u.getSessionToken() != null) {
            if (u.getSessionExpiresAt() != null && u.getSessionExpiresAt().isBefore(LocalDateTime.now())) {
                //La sesion ha caducado, la limpia y deja entrar al usuario
                u.setSessionToken(null);
                u.setSessionExpiresAt(null);
            } else {
                //La sesion sigue activa, bloquea el login (ya esta conectado en otro lado)
                return Optional.empty();
            }
        }

        //Crea un token de sesion nuevo, unico y aleatorio (UUID)
        //y le da 3 minutos de vida antes de caducar
        u.setSessionToken(UUID.randomUUID().toString());
        u.setSessionExpiresAt(LocalDateTime.now().plusMinutes(3));
        usuarioRepository.save(u);

        return Optional.of(u);
    }

    //Comprueba si un usuario tiene una sesion activa y vigente.
    //Se usa en el controlador para diferenciar entre:
    //  - 401: contrasena incorrecta
    //  - 409: contrasena correcta pero ya esta conectado en otro lado
    public boolean tieneSesionActiva(String nickname, String password) {
        return usuarioRepository.findByNickname(nickname)
                .filter(u -> passwordEncoder.matches(password, u.getPassword()))
                .map(u -> u.getSessionToken() != null
                        && u.getSessionExpiresAt() != null
                        && u.getSessionExpiresAt().isAfter(LocalDateTime.now())) //La sesion no ha caducado
                .orElse(false);
    }

    //Cierra la sesion del usuario borrando su token y fecha de expiracion.
    //Devuelve true si se cerro bien, false si el token no existia.
    @Transactional
    public boolean logout(String sessionToken) {
        Optional<Usuario> opt = usuarioRepository.findBySessionToken(sessionToken);
        if (opt.isEmpty()) return false; //No existe ese token

        Usuario u = opt.get();
        u.setSessionToken(null);        //Borra el token
        u.setSessionExpiresAt(null);    //Borra la fecha de expiracion
        usuarioRepository.save(u);
        return true;
    }

    //Renueva la sesion activa otros 3 minutos.
    //El frontend llama a esto cada 2 minutos para que la sesion no caduque
    //mientras el usuario sigue usando la app.
    //Si el token ya caducó, lo borra y devuelve false para forzar un nuevo login.
    @Transactional
    public boolean refreshSession(String sessionToken) {
        Optional<Usuario> opt = usuarioRepository.findBySessionToken(sessionToken);
        if (opt.isEmpty()) return false; //El token no existe

        Usuario u = opt.get();

        //Si la sesion ya caduco, la limpia y obliga a hacer login de nuevo
        if (u.getSessionExpiresAt() == null || u.getSessionExpiresAt().isBefore(LocalDateTime.now())) {
            u.setSessionToken(null);
            u.setSessionExpiresAt(null);
            usuarioRepository.save(u);
            return false;
        }

        //Extiende la sesion 3 minutos mas desde ahora mismo
        u.setSessionExpiresAt(LocalDateTime.now().plusMinutes(3));
        usuarioRepository.save(u);
        return true;
    }

    //Devuelve todos los usuarios de la base de datos
    public List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll();
    }

    //Busca un usuario por su ID, devuelve Optional por si no existe
    public Optional<Usuario> obtenerPorId(Long id) {
        return usuarioRepository.findById(id);
    }

    //Elimina un usuario por su ID
    @Transactional
    public void eliminarUsuario(Long id) {
        usuarioRepository.deleteById(id);
    }

    //Actualiza los datos de un usuario.
    //Solo actualiza los campos que vienen informados, los que llegan null los ignora
    //para no sobreescribir datos existentes por accidente.
    @Transactional
    public Usuario actualizarUsuario(Long id, Usuario datos) {
        return usuarioRepository.findById(id).map(u -> {
            if (datos.getNombre() != null) u.setNombre(datos.getNombre());
            if (datos.getApellidos() != null) u.setApellidos(datos.getApellidos());
            if (datos.getEmail() != null) u.setEmail(datos.getEmail());
            if (datos.getMonedas() != null) u.setMonedas(datos.getMonedas());
            if (datos.getNickname() != null) u.setNickname(datos.getNickname());
            return usuarioRepository.save(u);
        }).orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
    }

    //Suma una victoria al usuario con ese nickname.
    //Se llama cuando una partida termina y hay un ganador.
    //ifPresent significa que solo actua si el usuario existe, si no existe no hace nada.
    @Transactional
    public void incrementarVictorias(String nickname) {
        usuarioRepository.findByNickname(nickname).ifPresent(u -> {
            u.setVictorias(u.getVictorias() + 1);
            usuarioRepository.save(u);
        });
    }

    //Devuelve el top 10 de usuarios con mas victorias para el ranking
    public List<Usuario> obtenerRanking() {
        return usuarioRepository.findTop10ByOrderByVictoriasDesc();
    }
}