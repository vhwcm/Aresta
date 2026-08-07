package org.example.db;

import org.example.config.DatabaseConfig;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DatabaseConfigTest {

    private String originalDebugProperty;

    @BeforeEach
    void setUp() {
        originalDebugProperty = System.getProperty("app.debug");
    }

    @AfterEach
    void tearDown() {
        if (originalDebugProperty != null) {
            System.setProperty("app.debug", originalDebugProperty);
        } else {
            System.clearProperty("app.debug");
        }
    }

    @Test
    @DisplayName("Should select DEV database when debug flag is true")
    void shouldSelectDevDatabaseWhenDebugIsTrue() {
        DatabaseConfig config = new DatabaseConfig(true);
        assertTrue(config.isDebug());
        assertEquals("aresta_dev.db", config.getDatabasePath());
        assertEquals("jdbc:sqlite:aresta_dev.db", config.getJdbcUrl());
    }

    @Test
    @DisplayName("Should select PROD database when debug flag is false")
    void shouldSelectProdDatabaseWhenDebugIsFalse() {
        DatabaseConfig config = new DatabaseConfig(false);
        assertFalse(config.isDebug());
        assertEquals("aresta_prod.db", config.getDatabasePath());
        assertEquals("jdbc:sqlite:aresta_prod.db", config.getJdbcUrl());
    }

    @Test
    @DisplayName("Should determine debug mode from System Property if not explicitly passed")
    void shouldReadDebugFromSystemProperty() {
        System.setProperty("app.debug", "true");
        DatabaseConfig devConfig = DatabaseConfig.fromEnvironment();
        assertTrue(devConfig.isDebug());
        assertEquals("jdbc:sqlite:aresta_dev.db", devConfig.getJdbcUrl());

        System.setProperty("app.debug", "false");
        DatabaseConfig prodConfig = DatabaseConfig.fromEnvironment();
        assertFalse(prodConfig.isDebug());
        assertEquals("jdbc:sqlite:aresta_prod.db", prodConfig.getJdbcUrl());
    }
}
