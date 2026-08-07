package org.example.repository;

import org.example.model.UserBook;
import java.util.List;
import java.util.Optional;

public interface UserBookRepository {
    UserBook save(UserBook userBook);
    Optional<UserBook> findById(Long id);
    List<UserBook> findByUserId(Long userId);
    Optional<UserBook> findByUserIdAndBookId(Long userId, Long bookId);
    boolean updateStatusAndPage(Long id, String status, int currentPage);
    boolean deleteById(Long id, Long userId);
    boolean deleteByUserIdAndBookId(Long userId, Long bookId);
}
