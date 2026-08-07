package org.example.repository;

import java.util.Optional;

public interface AppConfigRepository {
    Optional<String> getValue(String key);
    void save(String key, String value);
}
