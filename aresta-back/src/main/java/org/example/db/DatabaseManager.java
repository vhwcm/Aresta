package org.example.db;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.example.config.DatabaseConfig;
import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

public class DatabaseManager implements AutoCloseable {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseManager.class);

    private final DatabaseConfig config;
    private final HikariDataSource dataSource;

    public DatabaseManager(DatabaseConfig config) {
        this.config = config;

        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setJdbcUrl(config.getJdbcUrl());
        hikariConfig.setMaximumPoolSize(config.getMaxPoolSize());
        hikariConfig.setPoolName("ArestaHikariPool");
        hikariConfig.addDataSourceProperty("journal_mode", "WAL");

        this.dataSource = new HikariDataSource(hikariConfig);
        logger.info("HikariCP DataSource inicializado para banco: {}", config.getJdbcUrl());
    }

    public DataSource getDataSource() {
        return dataSource;
    }

    public void initDatabase() {
        logger.info("Executando Flyway migrations no banco: {}", config.getJdbcUrl());
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .locations("classpath:db/migration")
                .load();

        try {
            flyway.repair();
        } catch (Exception e) {
            logger.warn("Aviso ao executar Flyway repair: {}", e.getMessage());
        }

        int migrationCount = flyway.migrate().migrationsExecuted;
        logger.info("Flyway concluiu com sucesso. Migrações executadas: {}", migrationCount);

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            stmt.execute("PRAGMA journal_mode=WAL;");
        } catch (SQLException e) {
            logger.error("Erro ao aplicar PRAGMA WAL no SQLite: {}", e.getMessage(), e);
        }
    }

    @Override
    public void close() {
        if (dataSource != null && !dataSource.isClosed()) {
            dataSource.close();
            logger.info("HikariCP DataSource encerrado com sucesso.");
        }
    }
}
