
package com.elanco.ticktracker.dto;

import java.time.LocalDateTime;

/** Data shape returned by Elanco's tick-sightings endpoint. */
public record TickSightingDto(
        String id,
        LocalDateTime date,
        String location,
        String species,
        String latinName
)
{}

