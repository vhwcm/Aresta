ALTER TABLE books ADD COLUMN cover_path TEXT;

UPDATE books SET cover_path = 'storage/covers/5ca0e9_0c9dc557fbc54bf6baabb862a6457dbd.png' WHERE id = 1;
UPDATE books SET cover_path = 'storage/covers/5ca0e9_accda79d9c314d2bbbfdbc75ac9df45e.png' WHERE id = 2;
UPDATE books SET cover_path = 'storage/covers/a-cartomante.png' WHERE id = 3;
UPDATE books SET cover_path = 'storage/covers/Como-tocar-piano.png' WHERE id = 4;
UPDATE books SET cover_path = 'storage/covers/curso-de-desenho-carlos-damasceno.png' WHERE id = 5;
UPDATE books SET cover_path = 'storage/covers/ebook_aprendaadesenhardozero.png' WHERE id = 6;
UPDATE books SET cover_path = 'storage/covers/ingles-aplicado-a-eventos.png' WHERE id = 7;
UPDATE books SET cover_path = 'storage/covers/livro_informatica_avancada_compressed.png' WHERE id = 8;
UPDATE books SET cover_path = 'storage/covers/microeconomia-compress.png' WHERE id = 9;
UPDATE books SET cover_path = 'storage/covers/O-Alienista.png' WHERE id = 10;
