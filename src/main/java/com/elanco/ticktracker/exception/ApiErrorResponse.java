package com.elanco.ticktracker.exception;

import java.time.LocalDateTime;

/** Stable error payload returned by the REST API. */
public record ApiErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path
)
{
}
