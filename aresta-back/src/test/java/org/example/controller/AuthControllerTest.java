package org.example.controller;

import io.javalin.Javalin;
import io.javalin.http.HttpStatus;
import org.example.config.DatabaseConfig;
import org.example.db.DatabaseManager;
import org.example.dto.LoginRequestDto;
import org.example.dto.LoginResponseDto;
import org.example.repository.JdbcUserRepository;
import org.example.repository.UserRepository;

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

import com.fasterxml.jackson.databind.ObjectMapper;

import static org.junit.jupiter.api.Assertions.*;

class AuthControllerTest {

    private DatabaseManager dbManager;
    private Javalin app;
    private int port;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @BeforeEach
    void setUp(@TempDir Path tempDir) throws Exception {
        String dbPath = tempDir.resolve("test_auth.db").toString();
        DatabaseConfig config = new DatabaseConfig(true, dbPath, 2);
        dbManager = new DatabaseManager(config);
        dbManager.initDatabase();

        UserRepository userRepository = new JdbcUserRepository(dbManager.getDataSource());
        AuthController authController = new AuthController(userRepository);

        app = Javalin.create();
        app.post("/api/auth/login", authController::login);
        app.get("/api/auth/me", authController::me);

        app.start(0);
        port = app.port();
    }

    @AfterEach
    void tearDown() {
        if (app != null) app.stop();
        if (dbManager != null) dbManager.close();
    }

    @Test
    @DisplayName("Should authenticate admin user 'viktor' with password 'orlaweb123123#'")
    void testSuccessfulLogin() throws Exception {
        LoginRequestDto requestDto = new LoginRequestDto("viktor", "orlaweb123123#");
        String jsonBody = objectMapper.writeValueAsString(requestDto);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, response.statusCode());

        LoginResponseDto loginResponse = objectMapper.readValue(response.body(), LoginResponseDto.class);
        assertNotNull(loginResponse.token());
        assertEquals("viktor", loginResponse.user().name());
        assertEquals("ADMIN", loginResponse.user().role());
    }

    @Test
    @DisplayName("Should reject login with invalid password")
    void testInvalidPasswordLogin() throws Exception {
        LoginRequestDto requestDto = new LoginRequestDto("viktor", "wrongpassword");
        String jsonBody = objectMapper.writeValueAsString(requestDto);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        assertEquals(HttpStatus.UNAUTHORIZED.getCode(), response.statusCode());
    }
}
