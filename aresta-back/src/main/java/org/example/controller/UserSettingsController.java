package org.example.controller;

import com.auth0.jwt.interfaces.DecodedJWT;
import io.javalin.http.Context;
import org.example.model.UserSettings;
import org.example.repository.UserSettingsRepository;
import org.example.security.JwtUtil;

import java.util.Map;
import java.util.Optional;

public class UserSettingsController {
    private final UserSettingsRepository repository;

    public UserSettingsController(UserSettingsRepository repository) {
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

    public void getSettings(Context ctx) {
        Long userId = extractUserId(ctx);
        UserSettings settings = repository.findByUserId(userId)
                .orElseGet(() -> UserSettings.defaultSettings(userId));
        ctx.json(settings);
    }

    public void updateSettings(Context ctx) {
        Long userId = extractUserId(ctx);
        Map<String, Object> body = ctx.bodyAsClass(Map.class);

        boolean pageAnimationEnabled = true;
        if (body.containsKey("pageAnimationEnabled")) {
            Object val = body.get("pageAnimationEnabled");
            if (val instanceof Boolean b) {
                pageAnimationEnabled = b;
            }
        }

        String language = "pt-BR";
        if (body.containsKey("language") && body.get("language") != null) {
            language = body.get("language").toString();
        }

        UserSettings updated = repository.saveOrUpdate(new UserSettings(userId, pageAnimationEnabled, language));
        ctx.json(updated);
    }
}
