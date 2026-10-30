package com.elanco.ticktracker.service;

import com.elanco.ticktracker.client.ElancoApiClient;
import com.elanco.ticktracker.dto.TickSightingDto;
import com.elanco.ticktracker.model.Sighting;
import com.elanco.ticktracker.repository.SightingRepository;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.elanco.ticktracker.dto.SightingRequest;
import java.util.UUID;

import java.time.LocalDateTime;

@Service
public class SightingService
{
    private final ElancoApiClient elancoApiClient;
    private final SightingRepository sightingRepository;

    public Sighting createUserSighting(SightingRequest request) {

        String latinName = request.latinName();

        if (latinName != null) {
            latinName = latinName.trim();

            if (latinName.isBlank()) {
                latinName = null;
            }
        }

        Sighting sighting = new Sighting(
                UUID.randomUUID().toString(),
                request.date(),
                request.location().trim(),
                request.species().trim(),
                latinName,
                "USER_REPORTED"
        );

        return sightingRepository.save(sighting);
    }

    public SightingService(
            ElancoApiClient elancoApiClient,
            SightingRepository sightingRepository) {
        this.elancoApiClient = elancoApiClient;
        this.sightingRepository = sightingRepository;
    }

    public ImportSummary importElancoSightings() {

        // get the data from Elanco
        List<TickSightingDto> externalSightings =
                elancoApiClient.getAllSightings();

        int imported = 0;
        int skipped = 0;

        //also catch duplicate ids within the same api response
        Set<String> processedIds = new HashSet<>();

        for (TickSightingDto dto : externalSightings) {

            // skip incomplete records which have  missing essential fields
            if (dto.id() == null || dto.id().isBlank()
                    || dto.date() == null
                    || dto.location() == null
                    || dto.location().isBlank()
                    || dto.species() == null
                    || dto.species().isBlank()) {
                skipped++;
                continue;
            }

            // skip duplicate records within this response
            if (!processedIds.add(dto.id())) {
                skipped++;
                continue;
            }

            // skip records that are already in the database
            if (sightingRepository.existsById(dto.id())) {
                skipped++;
                continue;
            }

            Sighting sighting = new Sighting(
                    dto.id(),
                    dto.date(),
                    dto.location().trim(),
                    dto.species().trim(),
                    dto.latinName(),
                    "ELANCO_API"
            );

            sightingRepository.save(sighting);
            imported++;
        }

        return new ImportSummary(
                externalSightings.size(),
                imported,
                skipped
        );




    }


    public List<Sighting> searchSightings(
            LocalDateTime fromDate,
            LocalDateTime toDate,
            String location,
            String species) {

        if (fromDate != null && toDate != null
                && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException(
                    "fromDate must be before or equal to toDate."
            );
        }

        String normalizedLocation =
                location == null || location.isBlank()
                        ? null : location.trim();

        String normalizedSpecies =
                species == null || species.isBlank()
                        ? null : species.trim();

        return sightingRepository.searchSightings(
                fromDate,
                toDate,
                normalizedLocation,
                normalizedSpecies
        );
    }

    public List<Sighting> getAllSightings() {
        return sightingRepository.findAll();
    }

    public record ImportSummary(
            int received,
            int imported,
            int skipped
    ) {
    }
}
