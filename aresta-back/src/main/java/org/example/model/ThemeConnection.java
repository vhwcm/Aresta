package org.example.model;

public record ThemeConnection(
    Long id,
    Long userId,
    Long sourceThemeId,
    Long targetThemeId,
    String createdAt
) {
    public ThemeConnection(Long userId, Long sourceThemeId, Long targetThemeId) {
        this(null, userId, sourceThemeId, targetThemeId, null);
    }
}
