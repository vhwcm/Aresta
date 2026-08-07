package org.example.controller;

import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
import io.javalin.http.NotFoundResponse;
import org.example.dto.CreateUserRequestDto;
import org.example.dto.UpdateUserRequestDto;
import org.example.dto.UserResponseDto;
import org.example.model.User;
import org.example.repository.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public class UserController {
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void getAll(Context ctx) {
        List<UserResponseDto> users = userRepository.findAll()
                .stream()
                .map(UserResponseDto::fromDomain)
                .toList();
        ctx.json(users);
    }

    public void getById(Context ctx) {
        long id = ctx.pathParamAsClass("id", Long.class).get();
        User user = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundResponse("Usuário não encontrado com ID: " + id));
        ctx.json(UserResponseDto.fromDomain(user));
    }

    public void create(Context ctx) {
        CreateUserRequestDto dto = ctx.bodyAsClass(CreateUserRequestDto.class);
        if (dto.email() == null || dto.email().isBlank() || dto.name() == null || dto.name().isBlank()) {
            ctx.status(HttpStatus.BAD_REQUEST).json("Nome e Email são obrigatórios");
            return;
        }

        String rawPassword = (dto.password() != null && !dto.password().isBlank()) ? dto.password() : "default123";
        String hashedPassword = BCrypt.hashpw(rawPassword, BCrypt.gensalt());
        String role = (dto.role() != null && !dto.role().isBlank()) ? dto.role() : "USER";
        boolean isActive = dto.isActive() == null || dto.isActive();

        User user = new User(dto.name(), dto.email(), hashedPassword, role, isActive);
        User savedUser = userRepository.save(user);

        logger.info("Novo usuário criado via REST API: {}", savedUser.email());
        ctx.status(HttpStatus.CREATED).json(UserResponseDto.fromDomain(savedUser));
    }

    public void update(Context ctx) {
        long id = ctx.pathParamAsClass("id", Long.class).get();
        User existingUser = userRepository.findById(id)
                .orElseThrow(() -> new NotFoundResponse("Usuário não encontrado com ID: " + id));

        UpdateUserRequestDto dto = ctx.bodyAsClass(UpdateUserRequestDto.class);

        String newPasswordHash = existingUser.passwordHash();
        if (dto.password() != null && !dto.password().isBlank()) {
            newPasswordHash = BCrypt.hashpw(dto.password(), BCrypt.gensalt());
        }

        String name = (dto.name() != null && !dto.name().isBlank()) ? dto.name() : existingUser.name();
        String email = (dto.email() != null && !dto.email().isBlank()) ? dto.email() : existingUser.email();
        String role = (dto.role() != null && !dto.role().isBlank()) ? dto.role() : existingUser.role();
        boolean isActive = dto.isActive() != null ? dto.isActive() : existingUser.isActive();

        User updatedUser = new User(id, name, email, newPasswordHash, role, isActive, existingUser.createdAt(), null);
        User result = userRepository.update(id, updatedUser);

        logger.info("Usuário ID {} atualizado via REST API", id);
        ctx.json(UserResponseDto.fromDomain(result));
    }

    public void delete(Context ctx) {
        long id = ctx.pathParamAsClass("id", Long.class).get();
        boolean deleted = userRepository.deleteById(id);
        if (!deleted) {
            throw new NotFoundResponse("Usuário não encontrado para remoção: " + id);
        }
        logger.info("Usuário ID {} removido via REST API", id);
        ctx.status(HttpStatus.NO_CONTENT);
    }
}
