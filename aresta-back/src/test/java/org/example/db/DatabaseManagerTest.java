package org.example.db;

import org.example.config.DatabaseConfig;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.junit.jupiter.api.Assertions.*;

class DatabaseManagerTest {

    @Test
    @DisplayName("Should initialize database with HikariCP and Flyway migrations")
    void testDevDatabaseInitialization(@TempDir Path tempDir) throws Exception {
        String dbPath = tempDir.resolve("aresta_dev.db").toString();
        DatabaseConfig config = new DatabaseConfig(true, dbPath, 2);

        try (DatabaseManager dbManager = new DatabaseManager(config)) {
            dbManager.initDatabase();

            try (Connection conn = dbManager.getDataSource().getConnection();
                 Statement stmt = conn.createStatement()) {

                assertNotNull(conn);
                assertFalse(conn.isClosed());

                // Query app_config table created by Flyway V2 migration
                try (ResultSet rs = stmt.executeQuery("SELECT value FROM app_config WHERE key = 'version'")) {
                    assertTrue(rs.next());
                    assertEquals("1.0.0", rs.getString("value"));
                }
            }
        }
    }

    @Test
    @DisplayName("Should configure PROD database when debug is false")
    void testProdDatabaseConfig() {
        DatabaseConfig prodConfig = new DatabaseConfig(false);
        try (DatabaseManager prodDbManager = new DatabaseManager(prodConfig)) {
            assertEquals("jdbc:sqlite:aresta_prod.db", prodConfig.getJdbcUrl());
            assertNotNull(prodDbManager.getDataSource());
        }
    }
}
