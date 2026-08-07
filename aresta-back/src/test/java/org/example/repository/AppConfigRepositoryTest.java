package org.example.repository;

import org.example.config.DatabaseConfig;
import org.example.db.DatabaseManager;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class AppConfigRepositoryTest {

    private DatabaseManager dbManager;
    private AppConfigRepository repository;

    @BeforeEach
    void setUp(@TempDir Path tempDir) throws Exception {
        String dbPath = tempDir.resolve("test_repo.db").toString();
        DatabaseConfig config = new DatabaseConfig(true, dbPath, 2);
        dbManager = new DatabaseManager(config);
        dbManager.initDatabase();

        repository = new JdbcAppConfigRepository(dbManager.getDataSource());
    }

    @AfterEach
    void tearDown() {
        if (dbManager != null) {
            dbManager.close();
        }
    }

    @Test
    @DisplayName("Should find initial version config from migrations")
    void shouldFindVersionConfig() {
        Optional<String> version = repository.getValue("version");
        assertTrue(version.isPresent());
        assertEquals("1.0.0", version.get());
    }

    @Test
    @DisplayName("Should save and retrieve key-value pair")
    void shouldSaveAndRetrieveValue() {
        repository.save("theme", "dark");
        Optional<String> theme = repository.getValue("theme");
        assertTrue(theme.isPresent());
        assertEquals("dark", theme.get());
    }
}
