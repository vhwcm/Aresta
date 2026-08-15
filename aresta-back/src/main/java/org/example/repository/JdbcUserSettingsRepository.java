package org.example.repository;

import org.example.model.UserSettings;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

public class JdbcUserSettingsRepository implements UserSettingsRepository {
    private static final Logger logger = LoggerFactory.getLogger(JdbcUserSettingsRepository.class);
    private final DataSource dataSource;

    public JdbcUserSettingsRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Optional<UserSettings> findByUserId(Long userId) {
        String sql = "SELECT user_id, page_animation_enabled, language, updated_at FROM user_settings WHERE user_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(new UserSettings(
                        rs.getLong("user_id"),
                        rs.getBoolean("page_animation_enabled"),
                        rs.getString("language"),
                        rs.getString("updated_at")
                    ));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar configurações do usuário {}: {}", userId, e.getMessage(), e);
        }
        return Optional.empty();
    }

    @Override
    public UserSettings saveOrUpdate(UserSettings settings) {
        String sql = "INSERT INTO user_settings (user_id, page_animation_enabled, language, updated_at) "
                   + "VALUES (?, ?, ?, CURRENT_TIMESTAMP) "
                   + "ON CONFLICT(user_id) DO UPDATE SET "
                   + "page_animation_enabled=excluded.page_animation_enabled, "
                   + "language=excluded.language, "
                   + "updated_at=CURRENT_TIMESTAMP";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, settings.userId());
            stmt.setBoolean(2, settings.pageAnimationEnabled());
            stmt.setString(3, settings.language() != null ? settings.language() : "pt-BR");
            stmt.executeUpdate();
            return findByUserId(settings.userId()).orElse(settings);
        } catch (SQLException e) {
            logger.error("Erro ao salvar configurações do usuário {}: {}", settings.userId(), e.getMessage(), e);
            throw new RuntimeException("Falha ao salvar configurações do usuário", e);
        }
    }
}
