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

/** Applies validation and persistence rules for imported and community sightings. */
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

        // User reports get their own ID and a source label distinct from imported data.
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

        // Fetch once, then count every rejected record as skipped for the summary.
        List<TickSightingDto> externalSightings =
                elancoApiClient.getAllSightings();

        int imported = 0;
        int skipped = 0;

        // Track IDs in the response as well as checking IDs already stored in H2.
        Set<String> processedIds = new HashSet<>();

        for (TickSightingDto dto : externalSightings) {

            // Required fields must be present before the record can satisfy the entity constraints.
            if (dto.id() == null || dto.id().isBlank()
                    || dto.date() == null
                    || dto.location() == null
                    || dto.location().isBlank()
                    || dto.species() == null
                    || dto.species().isBlank()) {
                skipped++;
                continue;
            }

            // Ignore repeated records in a single upstream response.
            if (!processedIds.add(dto.id())) {
                skipped++;
                continue;
            }

            // Make repeat imports safe by preserving records that were imported earlier.
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

        // Reject reversed bounds rather than silently returning an empty result.
        if (fromDate != null && toDate != null
                && fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException(
                    "fromDate must be before or equal to toDate."
            );
        }

        // Blank filters mean "no restriction"; trim values before repository matching.
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
