package org.example.controller;

import io.javalin.http.Context;
import io.javalin.http.HttpStatus;
import io.javalin.http.NotFoundResponse;
import org.example.model.Book;
import org.example.repository.BookRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.util.List;

public class BookController {
    private static final Logger logger = LoggerFactory.getLogger(BookController.class);
    private final BookRepository bookRepository;

    public BookController(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public void getAll(Context ctx) {
        List<Book> books = bookRepository.findAll();
        ctx.json(books);
    }

    public void getById(Context ctx) {
        long id = ctx.pathParamAsClass("id", Long.class).get();
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new NotFoundResponse("Livro não encontrado com ID: " + id));
        ctx.json(book);
    }

    public void getCover(Context ctx) {
        long id = ctx.pathParamAsClass("id", Long.class).get();
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new NotFoundResponse("Livro não encontrado com ID: " + id));

        if (book.coverPath() == null || book.coverPath().isBlank()) {
            throw new NotFoundResponse("Capa não cadastrada para este livro");
        }

        File file = new File(book.coverPath());
        if (!file.exists()) {
            throw new NotFoundResponse("Arquivo de capa não encontrado no servidor: " + book.coverPath());
        }

        try {
            ctx.result(new FileInputStream(file));
            ctx.contentType("image/png");
        } catch (FileNotFoundException e) {
            throw new NotFoundResponse("Erro ao ler o arquivo de capa");
        }
    }

    public void getFile(Context ctx) {
        long id = ctx.pathParamAsClass("id", Long.class).get();
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new NotFoundResponse("Livro não encontrado com ID: " + id));

        if (book.filePath() == null || book.filePath().isBlank()) {
            throw new NotFoundResponse("Caminho do arquivo não cadastrado para este livro");
        }

        File file = new File(book.filePath());
        if (!file.exists()) {
            throw new NotFoundResponse("Arquivo do livro não encontrado no servidor: " + book.filePath());
        }

        try {
            ctx.result(new FileInputStream(file));
            ctx.contentType("application/pdf");
        } catch (FileNotFoundException e) {
            throw new NotFoundResponse("Erro ao ler o arquivo do livro");
        }
    }

    public void create(Context ctx) {
        Book body = ctx.bodyAsClass(Book.class);
        if (body.title() == null || body.title().isBlank() || body.filePath() == null || body.filePath().isBlank()) {
            ctx.status(HttpStatus.BAD_REQUEST).json("Título e Endereço do Livro (filePath) são obrigatórios");
            return;
        }

        Book savedBook = bookRepository.save(new Book(body.title(), body.filePath(), body.coverPath()));
        logger.info("Novo livro registrado: {} -> {}", savedBook.title(), savedBook.filePath());
        ctx.status(HttpStatus.CREATED).json(savedBook);
    }

    public void delete(Context ctx) {
        long id = ctx.pathParamAsClass("id", Long.class).get();
        boolean deleted = bookRepository.deleteById(id);
        if (!deleted) {
            throw new NotFoundResponse("Livro não encontrado para remoção com ID: " + id);
        }
        logger.info("Livro ID {} removido", id);
        ctx.status(HttpStatus.NO_CONTENT);
    }
}
