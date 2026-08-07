package org.example.dto;

public record UpdateUserRequestDto(
    String name,
    String email,
    String password,
    String role,
    Boolean isActive
) {}
