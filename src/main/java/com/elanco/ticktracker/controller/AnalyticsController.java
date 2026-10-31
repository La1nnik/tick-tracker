
package com.elanco.ticktracker.controller;

import com.elanco.ticktracker.dto.CityCountDto;
import com.elanco.ticktracker.dto.TrendPointDto;
import com.elanco.ticktracker.service.AnalyticsService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Exposes aggregated sighting counts and activity trends to the dashboard. */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController
{

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService)
    {
        this.analyticsService = analyticsService;
    }

    /** Returns the number of stored sightings grouped by city. */
    @GetMapping("/cities")
    public List<CityCountDto> getCityAnalytics()
    {

        return analyticsService.getSightingsByCity();
    }

    /** Returns weekly or monthly counts, optionally limited to one location. */
    @GetMapping("/trends")
    public List<TrendPointDto> getTrends(

            @RequestParam(defaultValue = "weekly")
            String period,

            @RequestParam(required = false)
            String location) {

        return analyticsService.getSightingsTrends(
                period,
                location
        );
    }
}
