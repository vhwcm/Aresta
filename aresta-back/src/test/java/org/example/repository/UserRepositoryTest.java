package org.example.repository;

import org.example.config.DatabaseConfig;
import org.example.db.DatabaseManager;
import org.example.model.User;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class UserRepositoryTest {

    private DatabaseManager dbManager;
    private UserRepository repository;

    @BeforeEach
    void setUp(@TempDir Path tempDir) throws Exception {
        String dbPath = tempDir.resolve("test_user_repo.db").toString();
        DatabaseConfig config = new DatabaseConfig(true, dbPath, 2);
        dbManager = new DatabaseManager(config);
        dbManager.initDatabase();

        repository = new JdbcUserRepository(dbManager.getDataSource());
    }

    @AfterEach
    void tearDown() {
        if (dbManager != null) {
            dbManager.close();
        }
    }

    @Test
    @DisplayName("Should create user and retrieve by email and id")
    void shouldCreateAndFindUser() {
        User user = new User("Alice", "alice@example.com");
        User savedUser = repository.save(user);

        assertNotNull(savedUser.id());
        assertEquals("Alice", savedUser.name());
        assertEquals("alice@example.com", savedUser.email());

        Optional<User> foundByEmail = repository.findByEmail("alice@example.com");
        assertTrue(foundByEmail.isPresent());
        assertEquals(savedUser.id(), foundByEmail.get().id());
    }

    @Test
    @DisplayName("Should list all created users including seeded admin")
    void shouldListAllUsers() {
        int initialCount = repository.findAll().size();

        repository.save(new User("Bob", "bob@example.com"));
        repository.save(new User("Charlie", "charlie@example.com"));

        List<User> users = repository.findAll();
        assertEquals(initialCount + 2, users.size());
    }
}
