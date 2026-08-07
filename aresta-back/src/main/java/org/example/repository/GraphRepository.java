package org.example.repository;

import org.example.dto.GraphDTO.GraphDataDTO;
import org.example.model.Theme;
import org.example.model.ThemeConnection;

import java.util.Optional;

public interface GraphRepository {
    GraphDataDTO getGraphForUser(Long userId);
    Theme createTheme(Theme theme);
    Optional<Theme> findThemeById(Long themeId, Long userId);
    boolean updateTheme(Long themeId, Long userId, String name, String color, String description);
    boolean deleteTheme(Long themeId, Long userId);

    ThemeConnection createConnection(Long userId, Long sourceThemeId, Long targetThemeId);
    boolean deleteConnection(Long connectionId, Long userId);
    boolean deleteConnectionBetweenThemes(Long userId, Long sourceThemeId, Long targetThemeId);

    boolean linkBookToTheme(Long userBookId, Long themeId);
    boolean unlinkBookFromTheme(Long userBookId, Long themeId);
}
