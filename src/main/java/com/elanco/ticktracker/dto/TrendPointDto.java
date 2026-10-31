package com.elanco.ticktracker.dto;

/** Count of sightings in one ISO week or calendar month. */
public record TrendPointDto(String period, long sightings)
{


}
