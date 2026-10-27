
package com.elanco.ticktracker.repository;

import com.elanco.ticktracker.model.Sighting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SightingRepository
        extends JpaRepository<Sighting, String>

{

}
