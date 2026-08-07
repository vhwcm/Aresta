package org.example.model;

public record User(
    Long id,
    String name,
    String email,
    String passwordHash,
    String role,
    boolean isActive,
    String createdAt,
    String updatedAt
) {
    public User(String name, String email) {
        this(null, name, email, "defaultHash", "USER", true, null, null);
    }

    public User(String name, String email, String passwordHash, String role, boolean isActive) {
        this(null, name, email, passwordHash, role, isActive, null, null);
    }
}
