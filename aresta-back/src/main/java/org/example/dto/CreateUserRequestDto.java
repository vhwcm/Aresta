package org.example.dto;

public record CreateUserRequestDto(
    String name,
    String email,
    String password,
    String role,
    Boolean isActive
) {}
