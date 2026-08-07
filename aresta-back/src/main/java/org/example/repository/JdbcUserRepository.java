package org.example.repository;

import org.example.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class JdbcUserRepository implements UserRepository {
    private static final Logger logger = LoggerFactory.getLogger(JdbcUserRepository.class);
    private final DataSource dataSource;

    public JdbcUserRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public User save(User user) {
        String sql = "INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, user.name());
            stmt.setString(2, user.email());
            stmt.setString(3, user.passwordHash());
            stmt.setString(4, user.role() != null ? user.role() : "USER");
            stmt.setBoolean(5, user.isActive());
            stmt.executeUpdate();

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    long id = generatedKeys.getLong(1);
                    logger.debug("Usuário salvo com id: {}", id);
                    return findById(id).orElseThrow();
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao salvar usuário {}: {}", user.email(), e.getMessage(), e);
            throw new RuntimeException("Falha ao salvar usuário no banco de dados", e);
        }
        throw new IllegalStateException("Não foi possível gerar a chave ID para o usuário");
    }

    @Override
    public User update(Long id, User user) {
        String sql = "UPDATE users SET name = ?, email = ?, password_hash = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, user.name());
            stmt.setString(2, user.email());
            stmt.setString(3, user.passwordHash());
            stmt.setString(4, user.role());
            stmt.setBoolean(5, user.isActive());
            stmt.setLong(6, id);

            int rowsAffected = stmt.executeUpdate();
            if (rowsAffected > 0) {
                return findById(id).orElseThrow();
            }
        } catch (SQLException e) {
            logger.error("Erro ao atualizar usuário ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Falha ao atualizar usuário no banco de dados", e);
        }
        throw new IllegalArgumentException("Usuário com ID " + id + " não foi encontrado para atualização");
    }

    @Override
    public boolean deleteById(Long id) {
        String sql = "DELETE FROM users WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);
            int rows = stmt.executeUpdate();
            return rows > 0;
        } catch (SQLException e) {
            logger.error("Erro ao deletar usuário por ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Falha ao deletar usuário", e);
        }
    }

    @Override
    public Optional<User> findById(Long id) {
        String sql = "SELECT id, name, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar usuário por ID {}: {}", id, e.getMessage(), e);
        }
        return Optional.empty();
    }

    @Override
    public Optional<User> findByEmail(String email) {
        String sql = "SELECT id, name, email, password_hash, role, is_active, created_at, updated_at FROM users WHERE email = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, email);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar usuário por Email {}: {}", email, e.getMessage(), e);
        }
        return Optional.empty();
    }

    @Override
    public Optional<User> findByEmailOrName(String identifier) {
        String sql = "SELECT id, name, email, password_hash, role, is_active, created_at, updated_at "
                   + "FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(name) = LOWER(?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, identifier);
            stmt.setString(2, identifier);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUser(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar usuário por identificador {}: {}", identifier, e.getMessage(), e);
        }
        return Optional.empty();
    }

    @Override
    public List<User> findAll() {
        String sql = "SELECT id, name, email, password_hash, role, is_active, created_at, updated_at FROM users ORDER BY id ASC";
        List<User> users = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                users.add(mapRowToUser(rs));
            }
        } catch (SQLException e) {
            logger.error("Erro ao listar usuários: {}", e.getMessage(), e);
        }
        return users;
    }

    private User mapRowToUser(ResultSet rs) throws SQLException {
        return new User(
                rs.getLong("id"),
                rs.getString("name"),
                rs.getString("email"),
                rs.getString("password_hash"),
                rs.getString("role"),
                rs.getBoolean("is_active"),
                rs.getString("created_at"),
                rs.getString("updated_at")
        );
    }
}
