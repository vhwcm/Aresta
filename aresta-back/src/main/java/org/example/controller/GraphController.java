package org.example.controller;

import com.auth0.jwt.interfaces.DecodedJWT;
import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
import org.example.dto.GraphDTO.GraphDataDTO;
import org.example.model.Theme;
import org.example.model.ThemeConnection;
import org.example.repository.GraphRepository;
import org.example.security.JwtUtil;

import java.util.Map;
import java.util.Optional;

public class GraphController {
    private final GraphRepository repository;

    public GraphController(GraphRepository repository) {
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
        return 1L; // Fallback para dev/demo
    }

    public void getGraph(Context ctx) {
        Long userId = extractUserId(ctx);
        GraphDataDTO graphData = repository.getGraphForUser(userId);
        ctx.json(graphData);
    }

    public void createNode(Context ctx) {
        Long userId = extractUserId(ctx);
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        String name = (String) body.get("name");
        String color = body.get("color") != null ? (String) body.get("color") : "#E57B55";
        String description = (String) body.get("description");

        if (name == null || name.isBlank()) {
            ctx.status(HttpStatus.BAD_REQUEST).result("O nome do tema é obrigatório.");
            return;
        }

        Theme created = repository.createTheme(new Theme(userId, name, color, description));
        ctx.status(HttpStatus.CREATED).json(created);
    }

    public void updateNode(Context ctx) {
        Long userId = extractUserId(ctx);
        Long id = Long.parseLong(ctx.pathParam("id"));
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        String name = (String) body.get("name");
        String color = (String) body.get("color");
        String description = (String) body.get("description");

        boolean updated = repository.updateTheme(id, userId, name, color, description);
        if (updated) {
            repository.findThemeById(id, userId).ifPresentOrElse(ctx::json, () -> ctx.status(HttpStatus.NOT_FOUND));
        } else {
            ctx.status(HttpStatus.NOT_FOUND);
        }
    }

    public void deleteNode(Context ctx) {
        Long userId = extractUserId(ctx);
        Long id = Long.parseLong(ctx.pathParam("id"));
        boolean deleted = repository.deleteTheme(id, userId);
        if (deleted) {
            ctx.status(HttpStatus.NO_CONTENT);
        } else {
            ctx.status(HttpStatus.NOT_FOUND);
        }
    }

    public void createConnection(Context ctx) {
        Long userId = extractUserId(ctx);
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        Long sourceId = ((Number) body.get("sourceId")).longValue();
        Long targetId = ((Number) body.get("targetId")).longValue();

        ThemeConnection conn = repository.createConnection(userId, sourceId, targetId);
        ctx.status(HttpStatus.CREATED).json(conn);
    }

    public void deleteConnection(Context ctx) {
        Long userId = extractUserId(ctx);
        Long sourceId = Long.parseLong(ctx.pathParam("sourceId"));
        Long targetId = Long.parseLong(ctx.pathParam("targetId"));

        boolean deleted = repository.deleteConnectionBetweenThemes(userId, sourceId, targetId);
        if (deleted) {
            ctx.status(HttpStatus.NO_CONTENT);
        } else {
            ctx.status(HttpStatus.NOT_FOUND);
        }
    }

    public void linkBookToNode(Context ctx) {
        Long nodeId = Long.parseLong(ctx.pathParam("id"));
        Map<String, Object> body = ctx.bodyAsClass(Map.class);
        Long userBookId = ((Number) body.get("userBookId")).longValue();

        boolean linked = repository.linkBookToTheme(userBookId, nodeId);
        if (linked) {
            ctx.status(HttpStatus.OK).json(Map.of("success", true));
        } else {
            ctx.status(HttpStatus.BAD_REQUEST);
        }
    }

    public void unlinkBookFromNode(Context ctx) {
        Long nodeId = Long.parseLong(ctx.pathParam("id"));
        Long userBookId = Long.parseLong(ctx.pathParam("userBookId"));

        boolean unlinked = repository.unlinkBookFromTheme(userBookId, nodeId);
        if (unlinked) {
            ctx.status(HttpStatus.NO_CONTENT);
        } else {
            ctx.status(HttpStatus.NOT_FOUND);
        }
    }
}
