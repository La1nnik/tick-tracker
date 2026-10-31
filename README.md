# TickTracker UK

TickTracker UK is a full-stack MVP for exploring tick sightings in the UK and submitting community reports.
It combines data from Elanco's educational tick-sightings API with locally stored reports, and presents the data through a searchable dashboard, map, and activity summaries.

See the [project documentation](output/pdf/tick-tracker-project-documentation.pdf) for an overview of the architecture, data flow, API, setup, and current limitations.

## Features

- Interactive Leaflet map with count-sized markers for supported cities. Marker locations represent approximate city centres, not exact sightings.
- Search by date range, city, and species.
- City sighting counts and weekly or monthly trend summaries.
- City detail panel with a recent sighting timeline, sharing, and directions actions.
- Educational information about tick species and bite prevention.
- Community report form with required field and length validation, plus clear feedback.
- Automatic Elanco import when the application starts with an empty database. Incomplete entries and duplicate IDs are skipped.

## Technology

- Java 17 and Spring Boot 4
- Spring MVC REST controllers and Spring `RestClient` for the Elanco API
- Spring Data JPA with a file-based H2 database
- Jakarta Bean Validation
- HTML, CSS, and JavaScript served by Spring Boot
- Leaflet with OpenStreetMap tiles for the map

The application keeps the backend and frontend in one Spring Boot service.
The backend imports and validates external records, stores them with community reports, and supplies search and analytics endpoints.
The browser uses those endpoints to populate the dashboard. H2 persists data locally in `data/ticktracker`.

## Requirements

- JDK 17
- Internet access when loading the Elanco API, Leaflet CDN assets, and OpenStreetMap tiles

Maven is not required separately, the repository includes the Maven Wrapper.

## Run locally

From the project root, run:

```powershell
./mvnw.cmd spring-boot:run
```

On macOS or Linux, run:

```bash
./mvnw spring-boot:run
```

Open [http://localhost:8080](http://localhost:8080) in a browser.
On first startup, if the database has no sightings, the application requests the Elanco API and imports valid records.
The import totals are written to the application log. If Elanco is unavailable, the application still starts and once the API is reachable, trigger a retry using the import endpoint below.

To create a package with Maven:

```powershell
./mvnw.cmd package
```

Then run the generated JAR (the version may change):

```powershell
java -jar target/tick-tracker-0.0.1-SNAPSHOT.jar
```

## API

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/health` | Backend health status |
| `GET` | `/api/sightings` | List sightings; optional filters: `fromDate`, `toDate`, `location`, `species` |
| `POST` | `/api/sightings` | Create a community sighting report |
| `POST` | `/api/sightings/import` | Import Elanco sightings; existing IDs are skipped |
| `GET` | `/api/elanco/sightings` | Fetch the current Elanco API data without importing it |
| `GET` | `/api/analytics/cities` | Sightings count grouped by city |
| `GET` | `/api/analytics/trends?period=weekly` | Sightings grouped by week; `period` can also be `monthly`, with optional `location` |

Date filters use ISO local date-time values, for example:

```text
/api/sightings?fromDate=2026-01-01T00:00:00&toDate=2026-01-31T23:59:59&location=London
```

Create a report with JSON such as:

```json
{
  "date": "2026-10-31T12:30:00",
  "location": "London",
  "species": "Sheep or deer tick",
  "latinName": "Ixodes ricinus"
}
```

`date`, `location`, and `species` are required. `latinName` is optional. Validation and API errors are returned as structured JSON responses.

## Data and limitations

- Elanco sightings are imported at startup only when the local database is empty. The manual import endpoint can be used to retry or refresh missing records; imports skip IDs already stored.
- The database uses a local H2 file. Removing the H2 database files removes imported and community-submitted records; a subsequent startup attempts a fresh Elanco import.
- Search and analytics currently load records without pagination, which is suitable for the MVP but may need revision for larger datasets.
- The map uses a fixed list of city-centre coordinates. Sightings in locations outside that list remain in search results but have no map marker.
- Reports are stored locally and do not include image uploads.
- The application uses approximate city-level locations and should not be interpreted as showing precise tick locations or medical advice.

## Possible next steps

With more time, the application could add paginated queries and batch imports, configurable geocoding for a wider set of locations, image upload and storage, automated tests for import and validation behavior, and deployment configuration for a managed database.
