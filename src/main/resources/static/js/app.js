
document.addEventListener("DOMContentLoaded", () => {

    // html elements
    const filterForm = document.getElementById("filterForm");
    const sightingList = document.getElementById("sightingList");
    const cityList = document.getElementById("cityList");
    const trendList = document.getElementById("trendList");

    const errorMessage = document.getElementById("errorMessage");
    const filterMessage = document.getElementById("filterMessage");

    const totalSightings = document.getElementById("totalSightings");
    const totalCities = document.getElementById("totalCities");
    const latestSighting = document.getElementById("latestSighting");


// approximate city centre coordinates
// these aren't precise tick sighting locations

    const cityCoordinates = {

        "london": [51.5074, -0.1278],

        "manchester": [53.4808, -2.2426],

        "birmingham": [52.4862, -1.8904],

        "liverpool": [53.4084, -2.9916],

        "leeds": [53.8008, -1.5491],

        "sheffield": [53.3811, -1.4701],

        "bristol": [51.4545, -2.5879],

        "newcastle": [54.9783, -1.6178],

        "newcastle upon tyne": [54.9783, -1.6178],

        "nottingham": [52.9548, -1.1581],

        "leicester": [52.6369, -1.1398],

        "coventry": [52.4068, -1.5197],

        "oxford": [51.7520, -1.2577],

        "cambridge": [52.2053, 0.1218],

        "norwich": [52.6309, 1.2974],

        "southampton": [50.9097, -1.4044],

        "portsmouth": [50.8198, -1.0880],

        "brighton": [50.8225, -0.1372],

        "exeter": [50.7184, -3.5339],

        "plymouth": [50.3755, -4.1427],

        "cardiff": [51.4816, -3.1791],

        "swansea": [51.6214, -3.9436],

        "edinburgh": [55.9533, -3.1883],

        "glasgow": [55.8642, -4.2518],

        "aberdeen": [57.1497, -2.0943],

        "belfast": [54.5973, -5.9301],

        "york": [53.9590, -1.0815],

        "derby": [52.9225, -1.4746],

        "stoke-on-trent": [53.0027, -2.1794],

        "wolverhampton": [52.5862, -2.1288],

        "reading": [51.4543, -0.9781],

        "bath": [51.3758, -2.3599],

        "sunderland": [54.9069, -1.3838],

        "durham": [54.7761, -1.5733],

        "inverness": [57.4778, -4.2247],

        "perth": [56.3969, -3.4370]

    };



// Initialise the map

    let map = null;
    let markersLayer = null;

    if (typeof L !== "undefined") {

        map = L.map("map");

        // Show the UK
        map.fitBounds([
            [49.8, -8.7],
            [60.9, 2.1]
        ]);

        // openstreetmap tiles
        L.tileLayer(
            "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                maxZoom: 19,
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">' +
                    'OpenStreetMap contributors</a>'
            }
        ).addTo(map);

        //separate layer for sighting markers
        markersLayer = L.layerGroup().addTo(map);

    } else {

        document.getElementById("mapNotice").textContent =
            "The map library could not be loaded. Please check your internet connection.";
    }




    //make requests to our api
    async function fetchData(url) {

        const response = await fetch(url);

        const data = await response.json().catch(() => null);

        if (!response.ok)
        {
            throw new Error(data?.message || `Request failed: ${response.status}`);
        }

        return data;
    }


    // format dates for display
    function formatDate(dateValue) {

        if (!dateValue)
        {
            return "Date unavailable";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime()))
        {
            return dateValue;
        }

        return date.toLocaleDateString("en-GB", {day: "numeric", month: "short", year: "numeric"});
    }


    // creating an element safely using textContent
    function createElement(tag, className, text)
    {

        const element = document.createElement(tag);

        if (className)
        {
            element.className = className;
        }

        element.textContent = text ?? "";

        return element;
    }



    function updateMapDetails(city, records) {

        const details = document.getElementById("mapDetails");

        details.replaceChildren();

        const heading = createElement(
            "h3",
            "",
            `${city} - ${records.length} sightings`
        );

        const description = createElement(
            "p",
            "",
            "Recent sightings recorded in this city:"
        );

        details.append(heading, description);

        // Show the latest five sightings
        const recentSightings = [...records]
            .sort(
                (a, b) =>
                    new Date(b.date) - new Date(a.date)
            )
            .slice(0, 5);

        recentSightings.forEach(sighting => {

            const item = createElement(
                "div",
                "map-detail-item",
                ""
            );

            const species = createElement(
                "strong",
                "",
                sighting.species || "Unknown species"
            );

            const information = createElement(
                "span",
                "",
                `${sighting.latinName || "Scientific name unavailable"} · ${formatDate(sighting.date)}`
            );

            item.append(species, information);

            details.appendChild(item);

        });

    }


    function updateSightingsMap(sightings) {

        if (!map || !markersLayer) {
            return;
        }

        // Remove old markers when applying new filters
        markersLayer.clearLayers();

        // Group sightings by city
        const cityGroups = new Map();

        sightings.forEach(sighting => {

            if (!sighting.location) {
                return;
            }

            const city = sighting.location.trim();

            const key = city.toLowerCase();

            if (!cityGroups.has(key)) {
                cityGroups.set(key, {
                    city: city,
                    records: []
                });
            }

            cityGroups.get(key).records.push(sighting);

        });

        let mappedCities = 0;

        const unmappedCities = [];

        // Create one marker per city
        cityGroups.forEach(group => {

            const city = group.city;

            const records = group.records;

            const coordinates =
                cityCoordinates[city.toLowerCase()];

            // Do not invent coordinates for unknown cities
            if (!coordinates) {

                unmappedCities.push(city);

                return;
            }

            const count = records.length;

            // Make larger markers for cities with more sightings
            const radius = Math.min(
                20,
                7 + Math.sqrt(count)
            );

            const marker = L.circleMarker(
                coordinates,
                {
                    radius: radius,
                    color: "#1b5c43",
                    weight: 2,
                    fillColor: "#3f9569",
                    fillOpacity: 0.8
                }
            );

            // Display the sighting count inside the marker
            marker.bindTooltip(
                String(count),
                {
                    permanent: true,
                    direction: "center",
                    className: "city-marker-label"
                }
            );

            // Create popup safely using DOM elements
            const popup = document.createElement("div");

            const popupHeading = document.createElement("strong");

            popupHeading.textContent = city;

            const popupDescription = document.createElement("p");

            popupDescription.textContent =
                `${count} recorded sightings`;

            popup.append(popupHeading, popupDescription);

            marker.bindPopup(popup);

            // Update the details panel when clicked
            marker.on("click", () => {

                updateMapDetails(city, records);

            });

            marker.addTo(markersLayer);

            mappedCities++;

        });

        // Display information about unsupported cities
        const mapNotice = document.getElementById("mapNotice");

        if (unmappedCities.length > 0) {

            mapNotice.textContent =
                `${mappedCities} cities mapped. Not yet mapped: ` +
                unmappedCities.join(", ");

        } else {

            mapNotice.textContent =
                `${mappedCities} cities displayed. Markers represent approximate city-centre locations, not exact tick sighting locations.`;
        }

        // Reset the details panel when no markers are available
        if (mappedCities === 0) {

            document.getElementById("mapDetails").replaceChildren(
                createElement(
                    "h3",
                    "",
                    "No mapped cities"
                ),
                createElement(
                    "p",
                    "",
                    "No supported city locations were found for the current filters."
                )
            );

        } else {

            document.getElementById("mapDetails").replaceChildren(
                createElement(
                    "h3",
                    "",
                    "Explore a city"
                ),
                createElement(
                    "p",
                    "",
                    "Click a map marker to see recent sightings for that city."
                )
            );

        }

    }



    // update the dashboard summary cards
    function updateStatistics(sightings)
    {

        totalSightings.textContent = sightings.length;

        const cities = new Set(
            sightings
                .map(sighting =>
                    sighting.location?.trim().toLowerCase()
                )
                .filter(Boolean)
        );

        totalCities.textContent = cities.size;

        if (sightings.length > 0)
        {

            const latest = [...sightings].sort(
                (a, b) => new Date(b.date) - new Date(a.date)
            )[0];

            latestSighting.textContent = formatDate(latest.date);

        }
        else
        {

            latestSighting.textContent = "--";
        }
    }


    // Display sightings returned by the backend
    function displaySightings(sightings)
    {

        sightingList.replaceChildren();

        if (sightings.length === 0)
        {

            sightingList.appendChild(
                createElement(
                    "p",
                    "muted",
                    "No sightings found. Try changing your filters."
                )
            );

            return;
        }

        sightings.forEach(sighting => {

            const card = createElement("article", "sighting-card");

            const city = createElement(
                "h3",
                "",
                sighting.location || "Unknown location"
            );

            const species = createElement(
                "p",
                "sighting-species",
                sighting.species || "Unknown species"
            );

            const scientificName = createElement(
                "p",
                "",
                sighting.latinName || "Scientific name unavailable"
            );

            const date = createElement(
                "p",
                "",
                `Reported: ${formatDate(sighting.date)}`
            );

            card.append(city, species, scientificName, date);

            sightingList.appendChild(card);
        });
    }


    // retrieve sightings with optional filters
    async function loadSightings(filters = {}) {

        errorMessage.textContent = "";
        filterMessage.textContent = "Loading sightings...";

        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {

            if (value && value.trim() !== "")
            {
                params.append(key, value);
            }
        });

        const queryString = params.toString();

        const url = queryString
            ? `/api/sightings?${queryString}`
            : "/api/sightings";

        try
        {

            const sightings = await fetchData(url);

            displaySightings(sightings);

            updateStatistics(sightings);

            //update map markers using the filtered results
            updateSightingsMap(sightings);

            document.getElementById("resultsCount").textContent =
                `${sightings.length} results`;

            filterMessage.textContent = "";

        }
        catch (error)
        {

            errorMessage.textContent =
                `Could not load sightings: ${error.message}`;

            filterMessage.textContent = "";

            sightingList.replaceChildren(
                createElement("p", "muted", "Unable to load sightings.")
            );
        }
    }


    //retrieve analytics grouped by city
    async function loadCityAnalytics() {

        try
        {

            const cities = await fetchData("/api/analytics/cities");

            cityList.replaceChildren();

            if (cities.length === 0) {

                cityList.appendChild(
                    createElement("p", "muted", "No city data available.")
                );

                return;
            }

            cities.slice(0, 8).forEach(city => {

                const row = createElement("div", "analytics-row");

                const cityName = createElement("span", "", city.city);

                const count = createElement(
                    "span",
                    "analytics-value",
                    `${city.sightings} sightings`
                );

                row.append(cityName, count);

                cityList.appendChild(row);
            });

        }
        catch (error)
        {

            cityList.replaceChildren(
                createElement(
                    "p",
                    "error-message",
                    `Could not load city analytics: ${error.message}`
                )
            );
        }
    }


    //Retrieve weekly trends
    async function loadTrends() {

        try
        {

            const trends = await fetchData(
                "/api/analytics/trends?period=weekly"
            );

            trendList.replaceChildren();

            if (trends.length === 0) {

                trendList.appendChild(
                    createElement("p", "muted", "No trend data available.")
                );

                return;
            }

            // Display the latest eight weeks.
            trends.slice(-8).forEach(trend => {

                const row = createElement("div", "analytics-row");

                const period = createElement("span", "", trend.period);

                const count = createElement(
                    "span",
                    "analytics-value",
                    `${trend.sightings} sightings`
                );

                row.append(period, count);

                trendList.appendChild(row);
            });

        }
        catch (error)
        {

            trendList.replaceChildren(
                createElement(
                    "p",
                    "error-message",
                    `Could not load trends: ${error.message}`
                )
            );
        }
    }


    // handle filter form submission
    filterForm.addEventListener("submit", async event => {

        event.preventDefault();

        const filters = {

            fromDate: document.getElementById("fromDate").value,

            toDate: document.getElementById("toDate").value,

            location: document.getElementById("location").value,

            species: document.getElementById("species").value
        };

        await loadSightings(filters);
    });


    //clear filters and retrieve all sightings again
    filterForm.addEventListener("reset", () => {

        setTimeout(() => {
            loadSightings();
        }, 0);

    });


    //load the dashboard when the page opens
    loadSightings();
    loadCityAnalytics();
    loadTrends();

});
