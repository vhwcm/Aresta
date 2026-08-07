package org.example.controller;

import com.auth0.jwt.interfaces.DecodedJWT;
import io.javalin.Javalin;
import io.javalin.http.HttpStatus;
import io.javalin.http.UnauthorizedResponse;
import org.example.config.DatabaseConfig;
import org.example.db.DatabaseManager;
import org.example.dto.CreateUserRequestDto;
import org.example.dto.UserResponseDto;
import org.example.model.User;
import org.example.repository.JdbcUserRepository;
import org.example.repository.UserRepository;
import org.example.security.JwtUtil;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Path;
import java.util.Optional;

import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;

class UserControllerTest {

    private DatabaseManager dbManager;
    private Javalin app;
    private int port;
    private String adminToken;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @BeforeEach
    void setUp(@TempDir Path tempDir) throws Exception {
        String dbPath = tempDir.resolve("test_api.db").toString();
        DatabaseConfig config = new DatabaseConfig(true, dbPath, 2);
        dbManager = new DatabaseManager(config);
        dbManager.initDatabase();

        UserRepository userRepository = new JdbcUserRepository(dbManager.getDataSource());
        User admin = userRepository.findByEmailOrName("viktor").orElseGet(() -> 
            userRepository.save(new User("viktor_test", "viktor_test@aresta.org", "hash", "ADMIN", true))
        );
        adminToken = JwtUtil.generateToken(admin);

        UserController userController = new UserController(userRepository);

        app = Javalin.create();

        app.before("/api/users*", ctx -> {
            String authHeader = ctx.header("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new UnauthorizedResponse("Unauthorized");
            }
            String token = authHeader.substring(7);
            Optional<DecodedJWT> jwtOpt = JwtUtil.verifyToken(token);
            if (jwtOpt.isEmpty() || !"ADMIN".equalsIgnoreCase(jwtOpt.get().getClaim("role").asString())) {
                throw new UnauthorizedResponse("Forbidden");
            }
        });

        app.get("/api/users", userController::getAll);
        app.post("/api/users", userController::create);
        app.delete("/api/users/{id}", userController::delete);

        app.start(0);
        port = app.port();
    }

    @AfterEach
    void tearDown() {
        if (app != null) app.stop();
        if (dbManager != null) dbManager.close();
    }

    @Test
    @DisplayName("Should create user via POST /api/users with Admin Bearer Token")
    void testCreateUserEndpoint() throws Exception {
        CreateUserRequestDto requestDto = new CreateUserRequestDto("Carol Test", "carol@example.com", "secret123", "ADMIN", true);
        String jsonBody = objectMapper.writeValueAsString(requestDto);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/users"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + adminToken)
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(HttpStatus.CREATED.getCode(), response.statusCode());

        UserResponseDto createdUser = objectMapper.readValue(response.body(), UserResponseDto.class);
        assertNotNull(createdUser.id());
        assertEquals("Carol Test", createdUser.name());
        assertEquals("carol@example.com", createdUser.email());
        assertEquals("ADMIN", createdUser.role());
        assertTrue(createdUser.isActive());
    }

    @Test
    @DisplayName("Should reject request without Bearer Token")
    void testUnauthenticatedRequest() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/users"))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(HttpStatus.UNAUTHORIZED.getCode(), response.statusCode());
    }
}
