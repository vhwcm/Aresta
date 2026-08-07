package org.example.repository;

import org.example.config.DatabaseConfig;
import org.example.db.DatabaseManager;
import org.example.dto.GraphDTO.GraphDataDTO;
import org.example.model.Theme;
import org.example.model.ThemeConnection;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class GraphRepositoryTest {
    private DatabaseManager dbManager;
    private GraphRepository graphRepository;

    @BeforeEach
    void setUp(@TempDir Path tempDir) {
        String dbPath = tempDir.resolve("test_graph.db").toString();
        DatabaseConfig config = new DatabaseConfig(true, dbPath, 2);
        dbManager = new DatabaseManager(config);
        dbManager.initDatabase();

        graphRepository = new JdbcGraphRepository(dbManager.getDataSource());
    }

    @AfterEach
    void tearDown() {
        if (dbManager != null) {
            dbManager.close();
        }
    }

    @Test
    void testGetGraphForUser() {
        GraphDataDTO graphData = graphRepository.getGraphForUser(1L);
        assertNotNull(graphData);
        assertNotNull(graphData.nodes());
        assertNotNull(graphData.edges());
        assertFalse(graphData.nodes().isEmpty()); // Nós populados pela migração Flyway V7
    }

    @Test
    void testCreateAndUpdateTheme() {
        Theme created = graphRepository.createTheme(new Theme(1L, "Inteligência Artificial", "#3B82F6", "Redes Neurais"));
        assertNotNull(created.id());
        assertEquals("Inteligência Artificial", created.name());

        boolean updated = graphRepository.updateTheme(created.id(), 1L, "IA & Deep Learning", "#10B981", "Modelos de linguagem");
        assertTrue(updated);

        Theme found = graphRepository.findThemeById(created.id(), 1L).orElseThrow();
        assertEquals("IA & Deep Learning", found.name());
        assertEquals("#10B981", found.color());
    }

    @Test
    void testCreateAndDeleteConnection() {
        Theme t1 = graphRepository.createTheme(new Theme(1L, "Tema A", "#E57B55", ""));
        Theme t2 = graphRepository.createTheme(new Theme(1L, "Tema B", "#F59E0B", ""));

        ThemeConnection conn = graphRepository.createConnection(1L, t1.id(), t2.id());
        assertNotNull(conn);

        boolean deleted = graphRepository.deleteConnectionBetweenThemes(1L, t1.id(), t2.id());
        assertTrue(deleted);
    }
}
