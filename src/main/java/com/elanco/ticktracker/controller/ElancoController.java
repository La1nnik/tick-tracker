package com.elanco.ticktracker.controller;

import com.elanco.ticktracker.client.ElancoApiClient;
import com.elanco.ticktracker.dto.TickSightingDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/elanco")
public class ElancoController
{
    private final ElancoApiClient elancoApiClient;

    public ElancoController(ElancoApiClient elancoApiClient)
    {
        this.elancoApiClient = elancoApiClient;
    }

    @GetMapping("/sightings")
    public List<TickSightingDto> getSightings() {
        return elancoApiClient.getAllSightings();
    }
}
