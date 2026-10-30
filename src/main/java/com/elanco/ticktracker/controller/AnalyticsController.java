
package com.elanco.ticktracker.controller;

import com.elanco.ticktracker.dto.CityCountDto;
import com.elanco.ticktracker.dto.TrendPointDto;
import com.elanco.ticktracker.service.AnalyticsService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController
{

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService)
    {
        this.analyticsService = analyticsService;
    }

    // Get number of sightings per city
    @GetMapping("/cities")
    public List<CityCountDto> getCityAnalytics()
    {

        return analyticsService.getSightingsByCity();
    }

    // Get weekly or monthly trends
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
