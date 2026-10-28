package com.elanco.ticktracker.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record SightingRequest
(
        @NotNull(message = "Date is required")
        LocalDateTime date,

        @NotBlank(message = "Location is required")
        @Size(max = 120, message = "Location must be at most 120 characters")
        String location,

        @NotBlank(message = "Species is required")
        @Size(max = 120, message = "Species must be at most 120 characters")
        String species,

        @Size(max = 255, message = "Scientific name must be at most 255 characters")
        String latinName

)
{

}
