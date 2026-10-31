package com.elanco.ticktracker.dto;

/** City-level count returned to the dashboard. */
public record CityCountDto(String city, long sightings)
{

}
