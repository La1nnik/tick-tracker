
document.addEventListener("DOMContentLoaded", () => {

    // html elements
    const filterForm = document.getElementById("filterForm");
    const sightingList = document.getElementById("sightingList");
    const reportForm = document.getElementById("reportForm");
    const reportMessage = document.getElementById("reportMessage");
    const submitReportButton =document.getElementById("submitReportButton");

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


    function formatDateTime(dateValue) {

        if (!dateValue) {
            return "Date unavailable";
        }

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return dateValue;
        }

        return date.toLocaleString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
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


    async function shareSighting(sighting, button) {

        const shareText = [
            `Tick sighting in ${sighting.location}`,
            `Species: ${sighting.species}`,
            `Scientific name: ${sighting.latinName || "Not provided"}`,
            `Date: ${formatDateTime(sighting.date)}`
        ].join("\n");

        try {

            // Use native sharing where supported
            if (navigator.share) {

                await navigator.share({
                    title: "Tick sighting",
                    text: shareText
                });

                return;
            }

            // Otherwise copy the information
            if (navigator.clipboard && window.isSecureContext) {

                await navigator.clipboard.writeText(shareText);

                const originalText = button.textContent;

                button.textContent = "Copied!";

                window.setTimeout(() => {
                    button.textContent = originalText;
                }, 2000);

            } else {

                window.prompt(
                    "Copy this sighting information:",
                    shareText
                );

            }

        } catch (error) {

            // Sharing being cancelled is not an application error
            if (error.name !== "AbortError") {

                window.prompt(
                    "Copy this sighting information:",
                    shareText
                );
            }
        }
    }




    function updateMapDetails(city, records) {

        const details = document.getElementById("mapDetails");

        // Clear previous city details
        details.replaceChildren();

        // City heading
        const heading = createElement(
            "h3",
            "",
            city
        );

        const description = createElement(
            "p",
            "",
            `${records.length} recorded sightings in this city.`
        );

        details.append(heading, description);


        // Calculate the number of different species
        const uniqueSpecies = new Set(
            records
                .map(sighting => sighting.species)
                .filter(Boolean)
        );


        // City statistics
        const statistics = createElement(
            "div",
            "map-city-statistics",
            ""
        );

        const totalStat = createElement(
            "div",
            "map-city-stat",
            ""
        );

        totalStat.append(
            createElement("span", "", "Total sightings"),
            createElement("strong", "", records.length)
        );

        const speciesStat = createElement(
            "div",
            "map-city-stat",
            ""
        );

        speciesStat.append(
            createElement("span", "", "Species recorded"),
            createElement("strong", "", uniqueSpecies.size)
        );

        statistics.append(totalStat, speciesStat);

        details.appendChild(statistics);


        // Quick actions
        const actions = createElement(
            "div",
            "map-detail-actions",
            ""
        );

        // Get directions to the approximate city centre
        const directionsLink = document.createElement("a");

        directionsLink.className = "directions-button";

        directionsLink.textContent = "Get directions";

        directionsLink.href =
            `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(city)}`;

        directionsLink.target = "_blank";

        directionsLink.rel = "noopener noreferrer";

        actions.appendChild(directionsLink);

        details.appendChild(actions);


        // Timeline heading
        const timelineHeading = createElement(
            "h4",
            "timeline-heading",
            "Tick activity timeline"
        );

        const timelineDescription = createElement(
            "p",
            "",
            "Showing the latest 10 sightings, from oldest to newest."
        );

        details.append(timelineHeading, timelineDescription);


        // Sort sightings chronologically
        const chronologicalSightings = [...records]
            .sort(
                (a, b) =>
                    new Date(a.date) - new Date(b.date)
            );


        // Show the latest 10 records
        const timelineSightings =
            chronologicalSightings.slice(-10);


        const timeline = createElement(
            "ol",
            "sighting-timeline",
            ""
        );


        //create a timeline entry for each sighting
        timelineSightings.forEach(sighting => {

            const timelineItem = createElement(
                "li",
                "timeline-item",
                ""
            );

            const timelineContent = createElement(
                "div",
                "timeline-content",
                ""
            );


            // Sighting date
            const date = createElement(
                "time",
                "timeline-date",
                formatDateTime(sighting.date)
            );

            if (sighting.date) {
                date.dateTime = sighting.date;
            }


            // Species name
            const species = createElement(
                "strong",
                "",
                sighting.species || "Unknown species"
            );


            // Scientific name
            const latinName = createElement(
                "p",
                "",
                sighting.latinName || "Scientific name unavailable"
            );


            // Record source
            const source = createElement(
                "span",
                "timeline-source",
                sighting.source === "USER_REPORTED"
                    ? "Community report"
                    : "Elanco API"
            );


            // Share individual sighting
            const shareButton = createElement(
                "button",
                "share-button",
                "Share sighting"
            );

            shareButton.type = "button";

            shareButton.addEventListener("click", () => {
                shareSighting(sighting, shareButton);
            });


            timelineContent.append(
                date,
                species,
                latinName,
                source,
                shareButton
            );

            timelineItem.appendChild(timelineContent);

            timeline.appendChild(timelineItem);

        });


        if (timelineSightings.length === 0) {

            timeline.appendChild(
                createElement(
                    "li",
                    "muted",
                    "No sightings available for this city."
                )
            );

        }

        details.appendChild(timeline);

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



// Handle new sighting submissions

    reportForm.addEventListener("submit", async event => {

        event.preventDefault();

        reportMessage.textContent = "";
        reportMessage.className = "form-feedback";

        // Read and clean the form values
        const dateValue =
            document.getElementById("reportDate").value;

        const location =
            document.getElementById("reportLocation").value.trim();

        const species =
            document.getElementById("reportSpecies").value.trim();

        const latinName =
            document.getElementById("reportLatinName").value.trim();


        // Additional client-side validation
        if (!dateValue || !location || !species) {

            reportMessage.textContent =
                "Please complete all required fields.";

            reportMessage.classList.add("error");

            return;
        }


        // datetime-local normally provides YYYY-MM-DDTHH:mm.
        // Add seconds for a consistent LocalDateTime payload.
        const formattedDate = dateValue.length === 16
            ? `${dateValue}:00`
            : dateValue;

        // Warn and stop submission if the date is in the future
        const sightingDate = new Date(dateValue);

        if (sightingDate > new Date()) {
            reportMessage.className = "form-feedback warning";
            reportMessage.textContent =
                "Warning: The sighting date is in the future. Please correct it before submitting.";
            return;
        }


        // Prepare the JSON sent to Spring Boot
        const sightingData = {

            date: formattedDate,

            location: location,

            species: species,

            latinName: latinName || null

        };


        // Prevent duplicate clicks while submitting
        submitReportButton.disabled = true;
        submitReportButton.textContent = "Submitting...";


        try {

            const response = await fetch("/api/sightings", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(sightingData)

            });


            const result = await response.json().catch(() => null);


            // Handle unsuccessful responses
            if (!response.ok) {

                throw new Error(
                    result?.message ||
                    `Submission failed. HTTP ${response.status}`
                );

            }


            // Show a success message
            reportMessage.className = "form-feedback success";

            reportMessage.textContent =
                `Your sighting has been submitted successfully! Reference ID: ${result.id}`;


            // Clear the form
            reportForm.reset();


            // Clear any existing search filters and reload sightings
            filterForm.reset();


            // Refresh analytics
            await loadCityAnalytics();

            await loadTrends();


        } catch (error) {

            // Display an error returned by the backend
            reportMessage.className = "form-feedback error";

            reportMessage.textContent =
                `Unable to submit your sighting: ${error.message}`;


        } finally {

            // Re-enable the submit button
            submitReportButton.disabled = false;

            submitReportButton.textContent = "Submit sighting";

        }

    });



    //load the dashboard when the page opens
    loadSightings();
    loadCityAnalytics();
    loadTrends();

});
