package com.elanco.ticktracker.exception;


import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.stream.Collectors;


@RestControllerAdvice
public class GlobalExceptionHandler
{
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request)

    {


        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error ->
                        error.getField() + ":  " +
                                error.getDefaultMessage())
                .distinct()
                .collect(Collectors.joining(";  "));

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Validation failed",
                message,
                request.getRequestURI()

        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidBody(
            HttpMessageNotReadableException ex,
            HttpServletRequest request)
    {
        log.warn(
                "Could not parse request body for {}: {}",
                request.getRequestURI(),
                ex.getMessage()
        );

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid request body",
                "Check that the JSON is valid and the date uses the format yyyy-MM-dd'T'HH:mm:ss.",


                request.getRequestURI()
        );

    }

    @ExceptionHandler(ElancoApiException.class)
    public ResponseEntity<ApiErrorResponse> handleElancoFailure(
            ElancoApiException ex,
            HttpServletRequest request)
    {

        log.error("Elanco API request failed", ex);

        return buildResponse(
                HttpStatus.SERVICE_UNAVAILABLE,
                "External service unavailable",
                ex.getMessage(),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleDataConflict(
            DataIntegrityViolationException ex,
            HttpServletRequest request)
    {

        return buildResponse(
                HttpStatus.CONFLICT,
                "Data conflict",
                "The record could not be saved because it conflicts with existing data.",
                request.getRequestURI()
        );
    }


    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex,
            HttpServletRequest request) {

        return buildResponse(
                HttpStatus.BAD_REQUEST,
                "Invalid request",
                ex.getMessage(),
                request.getRequestURI()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpectedError(
            Exception ex,
            HttpServletRequest request) {

        log.error(
                "Unexpected error processing {} {}",
                request.getMethod(),
                request.getRequestURI(),
                ex
        );

        return buildResponse(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Internal server error",
                "An unexpected error occurred. Please try again later.",
                request.getRequestURI()
        );
    }

    private ResponseEntity<ApiErrorResponse> buildResponse(
            HttpStatus status,
            String error,
            String message,
            String path) {

        ApiErrorResponse response = new ApiErrorResponse(
                LocalDateTime.now(),
                status.value(),
                error,
                message,
                path
        );

        return ResponseEntity.status(status).body(response);
    }
}
