package com.elanco.ticktracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "sightings")
public class Sighting
{
    @Id
    @Column(nullable = false, length = 64)
    private String id;

    @Column(name = "sighting_date", nullable = false)
    private LocalDateTime date;

    @Column(nullable = false)
    private String species;

    @Column(nullable = false)
    private String location;

    private String latinName;

    @Column(nullable = false, length = 20)
    private String source;

    protected Sighting()
    {

    }

    public Sighting(
            String id,
            LocalDateTime date,
            String location,
            String species,
            String latinName,
            String source
    ){
        this.id = id;
        this.date = date;
        this.location = location;
        this.species = species;
        this.latinName = latinName;
        this.source = source;
    }


    public String getId() {
        return id;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public String getLocation() {
        return location;
    }

    public String getSpecies() {
        return species;
    }

    public String getLatinName() {
        return latinName;
    }

    public String getSource() {
        return source;
    }

}
