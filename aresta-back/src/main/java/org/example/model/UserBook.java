package org.example.model;

public record UserBook(
    Long id,
    Long userId,
    Long bookId,
    String title,
    String coverPath,
    String filePath,
    String status,
    int currentPage,
    String createdAt,
    String updatedAt
) {
    public UserBook(Long userId, Long bookId, String status, int currentPage) {
        this(null, userId, bookId, null, null, null, status, currentPage, null, null);
    }
}
