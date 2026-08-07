package org.example.dto;

public record LoginResponseDto(
    String token,
    UserResponseDto user
) {}
