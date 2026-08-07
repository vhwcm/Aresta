package org.example.repository;

import org.example.model.UserBook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class JdbcUserBookRepository implements UserBookRepository {
    private static final Logger logger = LoggerFactory.getLogger(JdbcUserBookRepository.class);
    private final DataSource dataSource;

    public JdbcUserBookRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public UserBook save(UserBook userBook) {
        String sql = "INSERT INTO user_books (user_id, book_id, status, current_page) VALUES (?, ?, ?, ?) " +
                     "ON CONFLICT(user_id, book_id) DO UPDATE SET status=excluded.status, current_page=excluded.current_page, updated_at=CURRENT_TIMESTAMP";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setLong(1, userBook.userId());
            stmt.setLong(2, userBook.bookId());
            stmt.setString(3, userBook.status() != null ? userBook.status() : "QUERO_LER");
            stmt.setInt(4, userBook.currentPage());
            stmt.executeUpdate();

            return findByUserIdAndBookId(userBook.userId(), userBook.bookId()).orElseThrow();
        } catch (SQLException e) {
            logger.error("Erro ao salvar UserBook: {}", e.getMessage(), e);
            throw new RuntimeException("Falha ao salvar livro na estante do usuário", e);
        }
    }

    @Override
    public Optional<UserBook> findById(Long id) {
        String sql = "SELECT ub.id, ub.user_id, ub.book_id, b.title, b.cover_path, b.file_path, ub.status, ub.current_page, ub.created_at, ub.updated_at " +
                     "FROM user_books ub JOIN books b ON ub.book_id = b.id WHERE ub.id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUserBook(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar UserBook por ID {}: {}", id, e.getMessage(), e);
        }
        return Optional.empty();
    }

    @Override
    public List<UserBook> findByUserId(Long userId) {
        String sql = "SELECT ub.id, ub.user_id, ub.book_id, b.title, b.cover_path, b.file_path, ub.status, ub.current_page, ub.created_at, ub.updated_at " +
                     "FROM user_books ub JOIN books b ON ub.book_id = b.id WHERE ub.user_id = ? ORDER BY ub.updated_at DESC";
        List<UserBook> list = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    list.add(mapRowToUserBook(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar livros do usuário {}: {}", userId, e.getMessage(), e);
        }
        return list;
    }

    @Override
    public Optional<UserBook> findByUserIdAndBookId(Long userId, Long bookId) {
        String sql = "SELECT ub.id, ub.user_id, ub.book_id, b.title, b.cover_path, b.file_path, ub.status, ub.current_page, ub.created_at, ub.updated_at " +
                     "FROM user_books ub JOIN books b ON ub.book_id = b.id WHERE ub.user_id = ? AND ub.book_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setLong(2, bookId);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToUserBook(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar UserBook por userId {} e bookId {}: {}", userId, bookId, e.getMessage(), e);
        }
        return Optional.empty();
    }

    @Override
    public boolean updateStatusAndPage(Long id, String status, int currentPage) {
        String sql = "UPDATE user_books SET status = ?, current_page = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setString(1, status);
            stmt.setInt(2, currentPage);
            stmt.setLong(3, id);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            logger.error("Erro ao atualizar status/página de UserBook {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Falha ao atualizar livro", e);
        }
    }

    @Override
    public boolean deleteById(Long id, Long userId) {
        String sql = "DELETE FROM user_books WHERE id = ? AND user_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, id);
            stmt.setLong(2, userId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            logger.error("Erro ao deletar UserBook {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Falha ao deletar livro da estante", e);
        }
    }

    @Override
    public boolean deleteByUserIdAndBookId(Long userId, Long bookId) {
        String sql = "DELETE FROM user_books WHERE user_id = ? AND book_id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            stmt.setLong(1, userId);
            stmt.setLong(2, bookId);
            return stmt.executeUpdate() > 0;
        } catch (SQLException e) {
            logger.error("Erro ao deletar UserBook por bookId {} e userId {}: {}", bookId, userId, e.getMessage(), e);
            throw new RuntimeException("Falha ao deletar livro da estante", e);
        }
    }

    private UserBook mapRowToUserBook(ResultSet rs) throws SQLException {
        return new UserBook(
            rs.getLong("id"),
            rs.getLong("user_id"),
            rs.getLong("book_id"),
            rs.getString("title"),
            rs.getString("cover_path"),
            rs.getString("file_path"),
            rs.getString("status"),
            rs.getInt("current_page"),
            rs.getString("created_at"),
            rs.getString("updated_at")
        );
    }
}
