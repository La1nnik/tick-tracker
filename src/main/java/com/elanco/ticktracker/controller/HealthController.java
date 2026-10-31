package com.elanco.ticktracker.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** Lightweight endpoint for checking whether the backend is responding. */
@RestController
public class HealthController
{
    @GetMapping("/api/health")
    public Map<String, String> health()
    {
        return Map.of
        (
                "status", "Tick Tracker backend is running"
        );
    }
}
