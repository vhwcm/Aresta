CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO books (title, file_path) VALUES
('Contos Fluminenses', 'storage/books/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.pdf'),
('Curso de Pré-Cálculo', 'storage/books/5ca0e9_accda79d9c314d2bbbfdbc75ac9df45e.pdf'),
('A Cartomante', 'storage/books/a-cartomante.pdf'),
('Como Tocar Piano', 'storage/books/Como-tocar-piano.pdf'),
('Curso de Desenho - Carlos Damasceno', 'storage/books/curso-de-desenho-carlos-damasceno.pdf'),
('Aprenda a Desenhar do Zero', 'storage/books/ebook_aprendaadesenhardozero.pdf'),
('Inglês Aplicado a Eventos', 'storage/books/ingles-aplicado-a-eventos.pdf'),
('Informática Avançada', 'storage/books/livro_informatica_avancada_compressed.pdf'),
('Microeconomia', 'storage/books/microeconomia-compress.pdf'),
('O Alienista', 'storage/books/O-Alienista.pdf');
