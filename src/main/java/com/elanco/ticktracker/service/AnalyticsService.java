
package com.elanco.ticktracker.service;

import com.elanco.ticktracker.dto.CityCountDto;
import com.elanco.ticktracker.dto.TrendPointDto;
import com.elanco.ticktracker.model.Sighting;
import com.elanco.ticktracker.repository.SightingRepository;

import org.springframework.stereotype.Service;

import java.time.YearMonth;

import java.time.temporal.WeekFields;


import java.util.List;
import java.util.Locale;

import java.util.Map;
import java.util.TreeMap;

/** Builds city and time-period summaries from the stored sightings. */
@Service
public class AnalyticsService
{

    private final SightingRepository sightingRepository;

    public AnalyticsService(SightingRepository sightingRepository)
    {
        this.sightingRepository = sightingRepository;
    }

    /** Merges city names that differ only by letter case and ignores blank names. */
    public List<CityCountDto> getSightingsByCity() {

        List<Object[]> cityCounts =
                sightingRepository.countSightingsByCity();

        //ignore differences in capitalisation when grouping cities
        Map<String, Long> counts =
                new TreeMap<>(String.CASE_INSENSITIVE_ORDER);

        for (Object[] row : cityCounts) {

            String city = ((String) row[0]).trim();

            long count = ((Number) row[1]).longValue();

            if (city.isBlank()) {
                continue;
            }

            counts.merge(city, count, Long::sum);
        }

        return counts.entrySet()
                .stream()
                .map(entry -> new CityCountDto(
                        entry.getKey(),
                        entry.getValue()
                ))
                .toList();
    }

    /** Groups records into ISO weeks or calendar months, optionally for one city. */
    public List<TrendPointDto> getSightingsTrends(
            String period,
            String location) {

        String normalizedPeriod = period == null ? "weekly" : period.trim().toLowerCase(Locale.ROOT);

        // Reject unsupported buckets so clients get a clear 400 response.
        if (!normalizedPeriod.equals("weekly") && !normalizedPeriod.equals("monthly"))
        {

            throw new IllegalArgumentException
            (
                    "Period must be either weekly or monthly."
            );
        }

        // Apply the location restriction in the repository when one is supplied.
        List<Sighting> sightings;

        if (location == null || location.isBlank())
        {

            sightings = sightingRepository.findAllByOrderByDateAsc();

        }
        else
        {

            sightings = sightingRepository.findByLocationIgnoreCaseOrderByDateAsc(location.trim());
        }

        Map<String, Long> trendCounts = new TreeMap<>();

        // ISO week-year handles dates near New Year that belong to a neighboring week-year.
        WeekFields weekFields = WeekFields.ISO;

        for (Sighting sighting : sightings)
        {

            var date = sighting.getDate();

            String periodLabel;

            if (normalizedPeriod.equals("weekly"))
            {

                int weekYear = date.get(weekFields.weekBasedYear());

                int weekNumber = date.get(weekFields.weekOfWeekBasedYear());

                periodLabel = String.format(Locale.ROOT, "%04d-W%02d", weekYear, weekNumber);

            }
            else
            {

                periodLabel = YearMonth.from(date).toString();
            }

            trendCounts.merge(periodLabel, 1L, Long::sum);
        }

        return trendCounts.entrySet()
                .stream()
                .map(entry -> new TrendPointDto(
                        entry.getKey(),
                        entry.getValue()
                ))
                .toList();
    }
}
