package org.example.repository;

import org.example.model.UserSettings;

import java.util.Optional;

public interface UserSettingsRepository {
    Optional<UserSettings> findByUserId(Long userId);
    UserSettings saveOrUpdate(UserSettings settings);
}
