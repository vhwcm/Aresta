package org.example.repository;

import org.example.model.Book;

import java.util.List;
import java.util.Optional;

public interface BookRepository {
    Book save(Book book);
    boolean deleteById(Long id);
    Optional<Book> findById(Long id);
    List<Book> findAll();
}
