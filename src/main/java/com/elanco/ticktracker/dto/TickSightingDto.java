
package com.elanco.ticktracker.dto;

import java.time.LocalDateTime;

public record TickSightingDto(
        String id,
        LocalDateTime date,
        String location,
        String species,
        String latinName
)
{}

