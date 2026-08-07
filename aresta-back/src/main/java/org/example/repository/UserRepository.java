package org.example.repository;

import org.example.model.User;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    User save(User user);
    User update(Long id, User user);
    boolean deleteById(Long id);
    Optional<User> findById(Long id);
    Optional<User> findByEmail(String email);
    Optional<User> findByEmailOrName(String identifier);
    List<User> findAll();
}
