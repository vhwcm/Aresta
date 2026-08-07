package org.example.repository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

public class JdbcAppConfigRepository implements AppConfigRepository {
    private static final Logger logger = LoggerFactory.getLogger(JdbcAppConfigRepository.class);
    private final DataSource dataSource;

    public JdbcAppConfigRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Optional<String> getValue(String key) {
        String sql = "SELECT value FROM app_config WHERE key = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, key);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(rs.getString("value"));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar chave '{}' na tabela app_config: {}", key, e.getMessage(), e);
        }
        return Optional.empty();
    }

    @Override
    public void save(String key, String value) {
        String sql = "INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, key);
            stmt.setString(2, value);
            stmt.executeUpdate();
            logger.debug("Configuração salva: {} = {}", key, value);
        } catch (SQLException e) {
            logger.error("Erro ao salvar chave '{}' na tabela app_config: {}", key, e.getMessage(), e);
            throw new RuntimeException("Falha ao salvar configuração", e);
        }
    }
}
