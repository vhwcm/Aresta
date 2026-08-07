package org.example.repository;

import org.example.dto.GraphDTO.*;
import org.example.model.Theme;
import org.example.model.ThemeConnection;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.*;
import java.util.*;

public class JdbcGraphRepository implements GraphRepository {
    private static final Logger logger = LoggerFactory.getLogger(JdbcGraphRepository.class);
    private final DataSource dataSource;

    public JdbcGraphRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public GraphDataDTO getGraphForUser(Long userId) {
        List<GraphNodeDTO> nodes = new ArrayList<>();
        List<GraphEdgeDTO> edges = new ArrayList<>();

        // 1. Buscar todos os temas (nós) do usuário
        String sqlThemes = "SELECT id, name, color, description FROM themes WHERE user_id = ? ORDER BY id ASC";
        Map<Long, List<UserBookItemDTO>> themeBooksMap = getBooksForThemes(userId);

        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sqlThemes)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    long themeId = rs.getLong("id");
                    String name = rs.getString("name");
                    String color = rs.getString("color");
                    String description = rs.getString("description");
                    List<UserBookItemDTO> books = themeBooksMap.getOrDefault(themeId, Collections.emptyList());

                    nodes.add(new GraphNodeDTO(themeId, name, color, description, books));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar nós do grafo para usuário {}: {}", userId, e.getMessage(), e);
        }

        // 2. Buscar todas as conexões (arestas) do usuário
        String sqlEdges = "SELECT id, source_theme_id, target_theme_id FROM theme_connections WHERE user_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sqlEdges)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    edges.add(new GraphEdgeDTO(
                        rs.getLong("id"),
                        rs.getLong("source_theme_id"),
                        rs.getLong("target_theme_id")
                    ));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar conexões do grafo para usuário {}: {}", userId, e.getMessage(), e);
        }

        return new GraphDataDTO(nodes, edges);
    }

    private Map<Long, List<UserBookItemDTO>> getBooksForThemes(Long userId) {
        Map<Long, List<UserBookItemDTO>> map = new HashMap<>();
        String sql = "SELECT bt.theme_id, ub.id AS user_book_id, ub.book_id, b.title, b.cover_path, ub.status, ub.current_page " +
                     "FROM book_themes bt " +
                     "JOIN user_books ub ON bt.user_book_id = ub.id " +
                     "JOIN books b ON ub.book_id = b.id " +
                     "WHERE ub.user_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    long themeId = rs.getLong("theme_id");
                    UserBookItemDTO bookItem = new UserBookItemDTO(
                        rs.getLong("user_book_id"),
                        rs.getLong("book_id"),
                        rs.getString("title"),
                        rs.getString("cover_path"),
                        rs.getString("status"),
                        rs.getInt("current_page")
                    );
                    map.computeIfAbsent(themeId, k -> new ArrayList<>()).add(bookItem);
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao mapear livros por tema para usuário {}: {}", userId, e.getMessage(), e);
        }
        return map;
    }

    @Override
    public Theme createTheme(Theme theme) {
        String sql = "INSERT INTO themes (user_id, name, color, description) VALUES (?, ?, ?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setLong(1, theme.userId());
            stmt.setString(2, theme.name());
            stmt.setString(3, theme.color() != null ? theme.color() : "#E57B55");
            stmt.setString(4, theme.description());
            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    return findThemeById(id, theme.userId()).orElseThrow();
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao criar tema: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao criar nó de tema", e);
        }
        throw new IllegalStateException("Falha ao gerar ID do tema");
    }

    @Override
    public Optional<Theme> findThemeById(Long themeId, Long userId) {
        String sql = "SELECT id, user_id, name, color, description, created_at FROM themes WHERE id = ? AND user_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, themeId);
            stmt.setLong(2, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(new Theme(
                        rs.getLong("id"),
                        rs.getLong("user_id"),
                        rs.getString("name"),
                        rs.getString("color"),
                        rs.getString("description"),
                        rs.getString("created_at")
                    ));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar tema por ID {}: {}", themeId, e.getMessage(), e);
        }
        return Optional.empty();
    }

    @Override
    public boolean updateTheme(Long themeId, Long userId, String name, String color, String description) {
        String sql = "UPDATE themes SET name = ?, color = ?, description = ? WHERE id = ? AND user_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, name);
            stmt.setString(2, color);
            stmt.setString(3, description);
            stmt.setLong(4, themeId);
            stmt.setLong(5, userId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            logger.error("Erro ao atualizar tema {}: {}", themeId, e.getMessage(), e);
            throw new RuntimeException("Falha ao atualizar nó de tema", e);
        }
    }

    @Override
    public boolean deleteTheme(Long themeId, Long userId) {
        String sql = "DELETE FROM themes WHERE id = ? AND user_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, themeId);
            stmt.setLong(2, userId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            logger.error("Erro ao deletar tema {}: {}", themeId, e.getMessage(), e);
            throw new RuntimeException("Falha ao deletar nó de tema", e);
        }
    }

    @Override
    public ThemeConnection createConnection(Long userId, Long sourceThemeId, Long targetThemeId) {
        String sql = "INSERT INTO theme_connections (user_id, source_theme_id, target_theme_id) VALUES (?, ?, ?) " +
                     "ON CONFLICT(user_id, source_theme_id, target_theme_id) DO NOTHING";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setLong(1, userId);
            stmt.setLong(2, sourceThemeId);
            stmt.setLong(3, targetThemeId);
            stmt.executeUpdate();

            try (ResultSet rs = stmt.getGeneratedKeys()) {
                if (rs.next()) {
                    long id = rs.getLong(1);
                    return new ThemeConnection(id, userId, sourceThemeId, targetThemeId, null);
                }
            }
            return new ThemeConnection(null, userId, sourceThemeId, targetThemeId, null);
        } catch (SQLException e) {
            logger.error("Erro ao conectar temas {} e {}: {}", sourceThemeId, targetThemeId, e.getMessage(), e);
            throw new RuntimeException("Falha ao criar conexão entre temas", e);
        }
    }

    @Override
    public boolean deleteConnection(Long connectionId, Long userId) {
        String sql = "DELETE FROM theme_connections WHERE id = ? AND user_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, connectionId);
            stmt.setLong(2, userId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            logger.error("Erro ao deletar conexão {}: {}", connectionId, e.getMessage(), e);
            throw new RuntimeException("Falha ao deletar conexão", e);
        }
    }

    @Override
    public boolean deleteConnectionBetweenThemes(Long userId, Long sourceThemeId, Long targetThemeId) {
        String sql = "DELETE FROM theme_connections WHERE user_id = ? AND "
                   + "((source_theme_id = ? AND target_theme_id = ?) OR (source_theme_id = ? AND target_theme_id = ?))";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setLong(2, sourceThemeId);
            stmt.setLong(3, targetThemeId);
            stmt.setLong(4, targetThemeId);
            stmt.setLong(5, sourceThemeId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            logger.error("Erro ao desvincular temas {} e {}: {}", sourceThemeId, targetThemeId, e.getMessage(), e);
            throw new RuntimeException("Falha ao remover conexão entre temas", e);
        }
    }

    @Override
    public boolean linkBookToTheme(Long userBookId, Long themeId) {
        String sql = "INSERT INTO book_themes (user_book_id, theme_id) VALUES (?, ?) ON CONFLICT DO NOTHING";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userBookId);
            stmt.setLong(2, themeId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            logger.error("Erro ao vincular livro {} ao tema {}: {}", userBookId, themeId, e.getMessage(), e);
            throw new RuntimeException("Falha ao vincular livro ao tema", e);
        }
    }

    @Override
    public boolean unlinkBookFromTheme(Long userBookId, Long themeId) {
        String sql = "DELETE FROM book_themes WHERE user_book_id = ? AND theme_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userBookId);
            stmt.setLong(2, themeId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            logger.error("Erro ao desvincular livro {} do tema {}: {}", userBookId, themeId, e.getMessage(), e);
            throw new RuntimeException("Falha ao desvincular livro do tema", e);
        }
    }
}
