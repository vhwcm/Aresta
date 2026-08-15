package org.example.model;

public record UserSettings(
    Long userId,
    boolean pageAnimationEnabled,
    String language,
    String updatedAt
) {
    public UserSettings(Long userId, boolean pageAnimationEnabled, String language) {
        this(userId, pageAnimationEnabled, language, null);
    }

    public static UserSettings defaultSettings(Long userId) {
        return new UserSettings(userId, true, "pt-BR", null);
    }
}
