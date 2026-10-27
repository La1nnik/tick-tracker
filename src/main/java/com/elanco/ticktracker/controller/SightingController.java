package com.elanco.ticktracker.controller;


import com.elanco.ticktracker.model.Sighting;
import com.elanco.ticktracker.service.SightingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


import java.util.List;


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
    public List<Sighting> getAllSightings() {
        return sightingService.getAllSightings();
    }





}
