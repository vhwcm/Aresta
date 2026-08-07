CREATE TABLE user_books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    book_id INTEGER NOT NULL REFERENCES books(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'QUERO_LER',
    current_page INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, book_id)
);

CREATE TABLE themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#E57B55',
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE theme_connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    target_theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, source_theme_id, target_theme_id)
);

CREATE TABLE book_themes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_book_id INTEGER NOT NULL REFERENCES user_books(id) ON DELETE CASCADE,
    theme_id INTEGER NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_book_id, theme_id)
);

-- Seed de Livros do Usuário Admin (id=1 e id=100)
INSERT INTO user_books (user_id, book_id, status, current_page) VALUES
(1, 1, 'LIDO', 180),       -- Contos Fluminenses
(1, 2, 'LENDO', 45),       -- Pré-Cálculo
(1, 3, 'LIDO', 32),        -- A Cartomante
(1, 4, 'QUERO_LER', 0),    -- Como Tocar Piano
(1, 5, 'LENDO', 90),       -- Curso de Desenho
(1, 6, 'QUERO_LER', 0),    -- Aprenda a Desenhar do Zero
(1, 7, 'LIDO', 120),       -- Inglês Aplicado a Eventos
(1, 8, 'LENDO', 210),      -- Informática Avançada
(1, 9, 'QUERO_LER', 0),    -- Microeconomia
(1, 10, 'LIDO', 85),       -- O Alienista
(100, 1, 'LIDO', 180),
(100, 2, 'LENDO', 45),
(100, 3, 'LIDO', 32),
(100, 4, 'QUERO_LER', 0),
(100, 5, 'LENDO', 90),
(100, 6, 'QUERO_LER', 0),
(100, 7, 'LIDO', 120),
(100, 8, 'LENDO', 210),
(100, 9, 'QUERO_LER', 0),
(100, 10, 'LIDO', 85);

-- Seed de Temas (Nós do Grafo) para o usuário 1 e 100
INSERT INTO themes (id, user_id, name, color, description) VALUES
(1, 1, 'Literatura Brasileira', '#E57B55', 'Obras clássicas da literatura e prosa nacional'),
(2, 1, 'Machado de Assis', '#F59E0B', 'Foco na obra e realismo machadiano'),
(3, 1, 'Exatas & Matemática', '#3B82F6', 'Cálculo, lógica e exatas'),
(4, 1, 'Artes & Criatividade', '#EC4899', 'Técnicas de desenho e expressão visual'),
(5, 1, 'Música & Teoria', '#8B5CF6', 'Prática instrumental e piano'),
(6, 1, 'Línguas & Idiomas', '#10B981', 'Comunicação e inglês aplicado'),
(7, 1, 'Tecnologia & Computação', '#06B6D4', 'Informática e desenvolvimento'),
(8, 1, 'Ciências Sociais & Economia', '#6366F1', 'Princípios de micro e macroeconomia'),
(9, 100, 'Literatura Brasileira', '#E57B55', 'Obras clássicas da literatura e prosa nacional'),
(10, 100, 'Machado de Assis', '#F59E0B', 'Foco na obra e realismo machadiano'),
(11, 100, 'Exatas & Matemática', '#3B82F6', 'Cálculo, lógica e exatas'),
(12, 100, 'Artes & Criatividade', '#EC4899', 'Técnicas de desenho e expressão visual'),
(13, 100, 'Música & Teoria', '#8B5CF6', 'Prática instrumental e piano'),
(14, 100, 'Línguas & Idiomas', '#10B981', 'Comunicação e inglês aplicado'),
(15, 100, 'Tecnologia & Computação', '#06B6D4', 'Informática e desenvolvimento'),
(16, 100, 'Ciências Sociais & Economia', '#6366F1', 'Princípios de micro e macroeconomia');

-- Conexões entre Temas (Mapa Mental)
INSERT INTO theme_connections (user_id, source_theme_id, target_theme_id) VALUES
(1, 1, 2), -- Literatura Brasileira -> Machado de Assis
(1, 3, 7), -- Exatas -> Tecnologia
(1, 4, 5), -- Artes -> Música
(1, 7, 8), -- Tecnologia -> Economia
(1, 6, 8), -- Idiomas -> Economia
(100, 9, 10),
(100, 11, 15),
(100, 12, 13),
(100, 15, 16),
(100, 14, 16);

-- Associação de Livros aos Temas (book_themes)
INSERT INTO book_themes (user_book_id, theme_id) VALUES
(1, 1), (1, 2), -- Contos Fluminenses -> Literatura & Machado
(2, 3),         -- Pré-Cálculo -> Exatas
(3, 1), (3, 2), -- A Cartomante -> Literatura & Machado
(4, 5),         -- Como Tocar Piano -> Música
(5, 4),         -- Curso de Desenho -> Artes
(6, 4),         -- Aprenda a Desenhar -> Artes
(7, 6),         -- Inglês -> Idiomas
(8, 7),         -- Informática -> Tecnologia
(9, 8),         -- Microeconomia -> Economia
(10, 1), (10, 2), -- O Alienista -> Literatura & Machado
(11, 9), (11, 10),
(12, 11),
(13, 9), (13, 10),
(14, 13),
(15, 12),
(16, 12),
(17, 14),
(18, 15),
(19, 16),
(20, 9), (20, 10);
