package org.example.controller;

import com.auth0.jwt.interfaces.DecodedJWT;
import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
import io.javalin.http.UnauthorizedResponse;
import org.example.dto.LoginRequestDto;
import org.example.dto.LoginResponseDto;
import org.example.dto.UserResponseDto;
import org.example.model.User;
import org.example.repository.UserRepository;
import org.example.security.JwtUtil;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Optional;

public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);
    private final UserRepository userRepository;

    public AuthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void login(Context ctx) {
        LoginRequestDto dto = ctx.bodyAsClass(LoginRequestDto.class);
        if (dto.login() == null || dto.login().isBlank() || dto.password() == null || dto.password().isBlank()) {
            ctx.status(HttpStatus.BAD_REQUEST).json("Login e Senha são obrigatórios.");
            return;
        }

        Optional<User> userOpt = userRepository.findByEmailOrName(dto.login().trim());
        if (userOpt.isEmpty()) {
            logger.warn("Tentativa de login com usuário inexistente: {}", dto.login());
            ctx.status(HttpStatus.UNAUTHORIZED).json("Usuário ou senha inválidos.");
            return;
        }

        User user = userOpt.get();

        if (!user.isActive()) {
            logger.warn("Tentativa de login de usuário inativo: {}", user.email());
            ctx.status(HttpStatus.FORBIDDEN).json("Sua conta está inativa. Contate o administrador.");
            return;
        }

        // Caso a senha no banco esteja em texto puro para 'viktor' inicial ou via hash BCrypt, validar adequadamente
        boolean passwordMatches = false;
        if (user.passwordHash().startsWith("$2a$") || user.passwordHash().startsWith("$2b$") || user.passwordHash().startsWith("$2y$")) {
            passwordMatches = BCrypt.checkpw(dto.password(), user.passwordHash());
        } else {
            passwordMatches = dto.password().equals(user.passwordHash());
            if (passwordMatches) {
                // Atualizar senha em texto puro para BCrypt
                String newHash = BCrypt.hashpw(dto.password(), BCrypt.gensalt());
                userRepository.update(user.id(), new User(user.id(), user.name(), user.email(), newHash, user.role(), user.isActive(), user.createdAt(), null));
            }
        }

        if (!passwordMatches) {
            logger.warn("Senha incorreta para usuário: {}", dto.login());
            ctx.status(HttpStatus.UNAUTHORIZED).json("Usuário ou senha inválidos.");
            return;
        }

        String token = JwtUtil.generateToken(user);
        logger.info("Login realizado com sucesso para o usuário: {} (Role: {})", user.email(), user.role());

        ctx.json(new LoginResponseDto(token, UserResponseDto.fromDomain(user)));
    }

    public void me(Context ctx) {
        String authHeader = ctx.header("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedResponse("Token não fornecido.");
        }

        String token = authHeader.substring(7);
        Optional<DecodedJWT> decodedOpt = JwtUtil.verifyToken(token);
        if (decodedOpt.isEmpty()) {
            throw new UnauthorizedResponse("Token inválido ou expirado.");
        }

        DecodedJWT jwt = decodedOpt.get();
        long userId = jwt.getClaim("userId").asLong();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedResponse("Usuário não encontrado."));

        ctx.json(UserResponseDto.fromDomain(user));
    }
}
