package org.example.model;

public record BookTheme(
    Long id,
    Long userBookId,
    Long themeId,
    String createdAt
) {
    public BookTheme(Long userBookId, Long themeId) {
        this(null, userBookId, themeId, null);
    }
}
