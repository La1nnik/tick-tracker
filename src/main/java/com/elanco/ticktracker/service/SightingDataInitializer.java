package com.elanco.ticktracker.service;

import com.elanco.ticktracker.repository.SightingRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class SightingDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SightingDataInitializer.class);

    private final SightingRepository sightingRepository;
    private final SightingService sightingService;

    public SightingDataInitializer(
            SightingRepository sightingRepository,
            SightingService sightingService) {
        this.sightingRepository = sightingRepository;
        this.sightingService = sightingService;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (sightingRepository.count() > 0) {
            return;
        }

        try {
            SightingService.ImportSummary summary = sightingService.importElancoSightings();
            log.info("Initial Elanco import complete: received={}, imported={}, skipped={}",
                    summary.received(), summary.imported(), summary.skipped());
        } catch (RuntimeException ex) {
            // Keep the application available if Elanco is temporarily unreachable.
            log.warn("Initial Elanco import failed; use POST /api/sightings/import to retry.", ex);
        }
    }
}
