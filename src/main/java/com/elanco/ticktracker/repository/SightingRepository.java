package com.elanco.ticktracker.repository;

import com.elanco.ticktracker.model.Sighting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SightingRepository
        extends JpaRepository<Sighting, String> {

    @Query("""
        SELECT s FROM Sighting s
        WHERE (:fromDate IS NULL OR s.date >= :fromDate)
          AND (:toDate IS NULL OR s.date <= :toDate)
          AND (:location IS NULL OR LOWER(s.location) = LOWER(:location))
          AND (:species IS NULL OR LOWER(s.species) = LOWER(:species))
        ORDER BY s.date DESC
        """)
    List<Sighting> searchSightings(
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            @Param("location") String location,
            @Param("species") String species
    );
}