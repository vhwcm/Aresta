package org.example.controller;

import com.auth0.jwt.interfaces.DecodedJWT;
import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
import org.example.model.UserBook;
import org.example.repository.UserBookRepository;
import org.example.security.JwtUtil;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public class UserBookController {
    private final UserBookRepository repository;

    public UserBookController(UserBookRepository repository) {
        this.repository = repository;
    }

    private Long extractUserId(Context ctx) {
        String authHeader = ctx.header("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            Optional<DecodedJWT> jwtOpt = JwtUtil.verifyToken(token);
            if (jwtOpt.isPresent()) {
                Long userId = jwtOpt.get().getClaim("userId").asLong();
                if (userId != null) return userId;
            }
        }
        return 1L; // Usuário padrão de testes/demo
    }

    public void getUserBooks(Context ctx) {
        Long userId = extractUserId(ctx);
        List<UserBook> books = repository.findByUserId(userId);
        ctx.json(books);
    }

    public void addUserBook(Context ctx) {
        Long userId = extractUserId(ctx);
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        Long bookId = ((Number) body.get("bookId")).longValue();
        String status = body.get("status") != null ? body.get("status").toString() : "QUERO_LER";
        int page = body.get("currentPage") != null ? ((Number) body.get("currentPage")).intValue() : 0;

        UserBook saved = repository.save(new UserBook(userId, bookId, status, page));
        ctx.status(HttpStatus.CREATED).json(saved);
    }

    public void updateUserBook(Context ctx) {
        Long id = Long.parseLong(ctx.pathParam("id"));
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        String status = body.get("status") != null ? body.get("status").toString() : "LENDO";
        int page = body.get("currentPage") != null ? ((Number) body.get("currentPage")).intValue() : 0;

        boolean updated = repository.updateStatusAndPage(id, status, page);
        if (updated) {
            repository.findById(id).ifPresentOrElse(ctx::json, () -> ctx.status(HttpStatus.NOT_FOUND));
        } else {
            ctx.status(HttpStatus.NOT_FOUND);
        }
    }

    public void deleteUserBook(Context ctx) {
        Long userId = extractUserId(ctx);
        Long id = Long.parseLong(ctx.pathParam("id"));
        boolean deleted = repository.deleteById(id, userId);
        if (deleted) {
            ctx.status(HttpStatus.NO_CONTENT);
        } else {
            ctx.status(HttpStatus.NOT_FOUND);
        }
    }

    public void deleteUserBookByBookId(Context ctx) {
        Long userId = extractUserId(ctx);
        Long bookId = Long.parseLong(ctx.pathParam("bookId"));
        boolean deleted = repository.deleteByUserIdAndBookId(userId, bookId);
        if (deleted) {
            ctx.status(HttpStatus.NO_CONTENT);
        } else {
            ctx.status(HttpStatus.NOT_FOUND);
        }
    }
}
