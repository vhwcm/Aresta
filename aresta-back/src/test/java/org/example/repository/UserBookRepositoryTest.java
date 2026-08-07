package org.example.repository;

import org.example.config.DatabaseConfig;
import org.example.db.DatabaseManager;
import org.example.model.UserBook;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class UserBookRepositoryTest {
    private DatabaseManager dbManager;
    private UserBookRepository userBookRepository;

    @BeforeEach
    void setUp(@TempDir Path tempDir) {
        String dbPath = tempDir.resolve("test_user_books.db").toString();
        DatabaseConfig config = new DatabaseConfig(true, dbPath, 2);
        dbManager = new DatabaseManager(config);
        dbManager.initDatabase();

        userBookRepository = new JdbcUserBookRepository(dbManager.getDataSource());
    }

    @AfterEach
    void tearDown() {
        if (dbManager != null) {
            dbManager.close();
        }
    }

    @Test
    void testSaveAndFindByUserId() {
        UserBook ub = new UserBook(1L, 1L, "LENDO", 50);
        UserBook saved = userBookRepository.save(ub);

        assertNotNull(saved.id());
        assertEquals("LENDO", saved.status());
        assertEquals(50, saved.currentPage());

        List<UserBook> books = userBookRepository.findByUserId(1L);
        assertFalse(books.isEmpty());
    }

    @Test
    void testUpdateStatusAndPage() {
        UserBook saved = userBookRepository.save(new UserBook(1L, 2L, "QUERO_LER", 0));
        boolean updated = userBookRepository.updateStatusAndPage(saved.id(), "LIDO", 300);

        assertTrue(updated);
        Optional<UserBook> found = userBookRepository.findById(saved.id());
        assertTrue(found.isPresent());
        assertEquals("LIDO", found.get().status());
        assertEquals(300, found.get().currentPage());
    }

    @Test
    void testDeleteById() {
        UserBook saved = userBookRepository.save(new UserBook(1L, 3L, "LENDO", 10));
        boolean deleted = userBookRepository.deleteById(saved.id(), 1L);

        assertTrue(deleted);
        assertTrue(userBookRepository.findById(saved.id()).isEmpty());
    }
}
