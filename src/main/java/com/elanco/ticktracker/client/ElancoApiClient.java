package com.elanco.ticktracker.client;

import com.elanco.ticktracker.dto.TickSightingDto;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;


import com.elanco.ticktracker.exception.ElancoApiException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

/** Owns the HTTP integration with Elanco and translates transport errors for the app. */
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
        try
        {
            // A typed response lets RestClient deserialize the JSON array into DTOs.
            List<TickSightingDto> sightings = restClient.get()
                    .uri("/data/tick-sightings").retrieve().body(new ParameterizedTypeReference<List<TickSightingDto>>()
                    {
                    });

            // Treat an empty response body as no records, not as a null service result.
            return sightings == null ? List.of() : sightings;

        } catch (RestClientResponseException ex)
        {
            if (ex.getStatusCode().value() == 429) {
                throw new ElancoApiException(
                        "Elanco's API rate limit has been reached. Please try again in about one minute.",
                        ex
                );
            }

            if (ex.getStatusCode().is5xxServerError()) {
                throw new ElancoApiException(
                        "Elanco's API is temporarily unavailable. Please try again later.",
                        ex
                );
            }

            throw new ElancoApiException(
                    "Elanco's API returned an unsuccessful response (HTTP "
                            + ex.getStatusCode().value() + ").",
                    ex
            );

        } catch (ResourceAccessException ex) {

            throw new ElancoApiException(
                    "Could not connect to Elanco's API. Please try again later.",
                    ex
            );

        } catch (RestClientException ex) {

            throw new ElancoApiException(
                    "Could not process the response from Elanco's API.",
                    ex
            );
        }

    }
}
