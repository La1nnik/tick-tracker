
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
