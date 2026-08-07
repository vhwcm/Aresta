package org.example.repository;

import org.example.model.Book;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

public class JdbcBookRepository implements BookRepository {
    private static final Logger logger = LoggerFactory.getLogger(JdbcBookRepository.class);
    private final DataSource dataSource;

    public JdbcBookRepository(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public Book save(Book book) {
        String sql = "INSERT INTO books (title, file_path, cover_path) VALUES (?, ?, ?)";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            stmt.setString(1, book.title());
            stmt.setString(2, book.filePath());
            stmt.setString(3, book.coverPath());
            stmt.executeUpdate();

            try (ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                if (generatedKeys.next()) {
                    long id = generatedKeys.getLong(1);
                    logger.debug("Livro salvo com id: {}", id);
                    return findById(id).orElseThrow();
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao salvar livro {}: {}", book.title(), e.getMessage(), e);
            throw new RuntimeException("Falha ao salvar livro no banco de dados", e);
        }
        throw new IllegalStateException("Não foi possível gerar o ID para o livro");
    }

    @Override
    public boolean deleteById(Long id) {
        String sql = "DELETE FROM books WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);
            int rows = stmt.executeUpdate();
            return rows > 0;
        } catch (SQLException e) {
            logger.error("Erro ao deletar livro por ID {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Falha ao deletar livro", e);
        }
    }

    @Override
    public Optional<Book> findById(Long id) {
        String sql = "SELECT id, title, file_path, cover_path, created_at FROM books WHERE id = ?";
        try (Connection conn = dataSource.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setLong(1, id);
            try (ResultSet rs = stmt.executeQuery()) {
                if (rs.next()) {
                    return Optional.of(mapRowToBook(rs));
                }
            }
        } catch (SQLException e) {
            logger.error("Erro ao buscar livro por ID {}: {}", id, e.getMessage(), e);
        }
        return Optional.empty();
    }

    @Override
    public List<Book> findAll() {
        String sql = "SELECT id, title, file_path, cover_path, created_at FROM books ORDER BY id ASC";
        List<Book> books = new ArrayList<>();
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                books.add(mapRowToBook(rs));
            }
        } catch (SQLException e) {
            logger.error("Erro ao listar livros: {}", e.getMessage(), e);
        }
        return books;
    }

    private Book mapRowToBook(ResultSet rs) throws SQLException {
        return new Book(
                rs.getLong("id"),
                rs.getString("title"),
                rs.getString("file_path"),
                rs.getString("cover_path"),
                rs.getString("created_at")
        );
    }
}
