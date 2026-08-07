package org.example.model;

public record Book(
    Long id,
    String title,
    String filePath,
    String coverPath,
    String createdAt
) {
    public Book(String title, String filePath, String coverPath) {
        this(null, title, filePath, coverPath, null);
    }

    public Book(String title, String filePath) {
        this(null, title, filePath, null, null);
    }
}
