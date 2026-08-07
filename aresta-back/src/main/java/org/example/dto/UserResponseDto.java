package org.example.dto;

import org.example.model.User;

public record UserResponseDto(
    Long id,
    String name,
    String email,
    String role,
    boolean isActive,
    String createdAt,
    String updatedAt
) {
    public static UserResponseDto fromDomain(User user) {
        return new UserResponseDto(
            user.id(),
            user.name(),
            user.email(),
            user.role(),
            user.isActive(),
            user.createdAt(),
            user.updatedAt()
        );
    }
}
