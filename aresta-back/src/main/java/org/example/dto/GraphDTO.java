package org.example.dto;

import java.util.List;

public class GraphDTO {

    public record UserBookItemDTO(
        Long userBookId,
        Long bookId,
        String title,
        String coverPath,
        String status,
        int currentPage
    ) {}

    public record GraphNodeDTO(
        Long id,
        String name,
        String color,
        String description,
        List<UserBookItemDTO> books
    ) {}

    public record GraphEdgeDTO(
        Long id,
        Long source,
        Long target
    ) {}

    public record GraphDataDTO(
        List<GraphNodeDTO> nodes,
        List<GraphEdgeDTO> edges
    ) {}
}
