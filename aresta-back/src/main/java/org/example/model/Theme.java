package org.example.model;

public record Theme(
    Long id,
    Long userId,
    String name,
    String color,
    String description,
    String createdAt
) {
    public Theme(Long userId, String name, String color, String description) {
        this(null, userId, name, color, description, null);
    }
}
