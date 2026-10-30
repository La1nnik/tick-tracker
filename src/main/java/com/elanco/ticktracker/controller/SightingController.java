package com.elanco.ticktracker.controller;


import com.elanco.ticktracker.model.Sighting;
import com.elanco.ticktracker.service.SightingService;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.elanco.ticktracker.dto.SightingRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;


import java.util.List;


import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/sightings")
public class SightingController
{
    private final SightingService sightingService;

    public SightingController(SightingService sightingService) {
        this.sightingService = sightingService;
    }

    @PostMapping("/import")
    public  SightingService.ImportSummary importSightings()
    {
        return sightingService.importElancoSightings();
    }

    @GetMapping
    public List<Sighting> getSightings(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime fromDate,

            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime toDate,

            @RequestParam(required = false)
            String location,

            @RequestParam(required = false)
            String species) {

        return sightingService.searchSightings(
                fromDate,
                toDate,
                location,
                species
        );
    }


    @PostMapping
    public ResponseEntity<Sighting> createSighting(
            @Valid @RequestBody SightingRequest request) {

        Sighting created =
            sightingService.createUserSighting(request);

        return ResponseEntity
                .status(HttpStatus.CREATED) // 201 created/
                .body(created);
    }





}
