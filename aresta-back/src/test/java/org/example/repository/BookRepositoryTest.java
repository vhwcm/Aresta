package org.example.repository;

import org.example.config.DatabaseConfig;
import org.example.db.DatabaseManager;
import org.example.model.Book;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class BookRepositoryTest {

    private DatabaseManager dbManager;
    private BookRepository repository;

    @BeforeEach
    void setUp(@TempDir Path tempDir) {
        String dbPath = tempDir.resolve("test_book_repo.db").toString();
        DatabaseConfig config = new DatabaseConfig(true, dbPath, 2);
        dbManager = new DatabaseManager(config);
        dbManager.initDatabase();

        repository = new JdbcBookRepository(dbManager.getDataSource());
    }

    @AfterEach
    void tearDown() {
        if (dbManager != null) {
            dbManager.close();
        }
    }

    @Test
    @DisplayName("Should include seeded books with cover paths from migration V5")
    void shouldFindInitialSeededBooksWithCovers() {
        List<Book> books = repository.findAll();
        assertFalse(books.isEmpty(), "Deveria conter os livros inseridos na migração");
        assertEquals(10, books.size(), "Deveriam existir 10 livros cadastrados inicialmente");

        Book firstBook = books.get(0);
        assertNotNull(firstBook.coverPath(), "O caminho da capa deve estar preenchido");
        assertTrue(firstBook.coverPath().contains("storage/covers/"), "O caminho da capa deve apontar para storage/covers/");
    }

    @Test
    @DisplayName("Should save and retrieve a new book with cover")
    void shouldSaveAndFindBook() {
        Book book = new Book("Livro Teste", "storage/books/teste.pdf", "storage/covers/teste.png");
        Book savedBook = repository.save(book);

        assertNotNull(savedBook.id());
        assertEquals("Livro Teste", savedBook.title());
        assertEquals("storage/books/teste.pdf", savedBook.filePath());
        assertEquals("storage/covers/teste.png", savedBook.coverPath());

        Optional<Book> found = repository.findById(savedBook.id());
        assertTrue(found.isPresent());
        assertEquals("Livro Teste", found.get().title());
        assertEquals("storage/covers/teste.png", found.get().coverPath());
    }

    @Test
    @DisplayName("Should delete a book by ID")
    void shouldDeleteBook() {
        Book book = repository.save(new Book("Para Deletar", "storage/books/delete.pdf", "storage/covers/delete.png"));
        boolean deleted = repository.deleteById(book.id());

        assertTrue(deleted);
        assertTrue(repository.findById(book.id()).isEmpty());
    }
}
