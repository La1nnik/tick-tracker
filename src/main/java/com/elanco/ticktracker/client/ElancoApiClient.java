package com.elanco.ticktracker.client;

import com.elanco.ticktracker.dto.TickSightingDto;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
public class ElancoApiClient
{
    private final RestClient restClient;

    public ElancoApiClient(RestClient.Builder builder)
    {
        this.restClient = builder.baseUrl("https://dev-task.elancoapps.com").build();
    }

    public List<TickSightingDto> getAllSightings()
    {
        List<TickSightingDto> sightings = restClient.get()
                .uri("/data/tick-sightings").retrieve().body(new ParameterizedTypeReference<List<TickSightingDto>>()
                {});

        return sightings == null ? List.of() : sightings;
    }
}
