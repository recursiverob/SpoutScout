let map;
let heatmapLayer;
let currentTileLayer;
let markers;
let zipCodeLayer;
let nycZipCodes = new Set();

window.onload = function() {
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('map').style.visibility = 'visible';
    }, 2000); // Simulate loading time
};


document.addEventListener("DOMContentLoaded", () => {
    map = L.map('map').setView([39.8283, -98.5795], 5); // Centered on US

    // Add OpenStreetMap tiles
    currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Create a marker cluster group
    markers = L.markerClusterGroup();

    // Array of fountain JSON files
    const fountainFiles = ['./NY-fountains.json', 'Pittsburgh Drinking Foutains.json', 'Geocoded_Addresses_Updated_Single_Line.json'];

    // Fetch the fountains data from multiple files
    fountainFiles.forEach(file => {
        fetch(file)
            .then(response => {
                if (!response.ok) throw new Error(`Failed to load ${file}`);
                return response.json();
            })
            .then(fountains => {
                const heatmapData = [];
                fountains.forEach(fountain => {
                    const latLng = [fountain.lat, fountain.lng];

                    const marker = L.marker(latLng);
                    marker.bindPopup(`
                        <b>${fountain.name}</b><br>
                        <button class="get-directions-btn" data-lat="${fountain.lat}" data-lng="${fountain.lng}">
                            Get Directions
                        </button>
                    `);
                    markers.addLayer(marker);

                    // Add data to heatmap
                    heatmapData.push(latLng);
                });
                map.addLayer(markers);

                // Initialize heatmap layer
                if (!heatmapLayer) {
                    heatmapLayer = L.heatLayer(heatmapData, {
                        radius: 25,
                        blur: 15,
                        maxZoom: 17,
                    });
                } else {
                    heatmapLayer.addLatLng(heatmapData);
                }
            })
            .catch(error => {
                showMessage(`Error loading ${file}`, true);
            });
    });

    // Fetch the NYC ZIP codes JSON
    fetch('./nyc-zip-codes.json')
        .then(response => response.json())
        .then(data => {
            data.nyc_zip_codes.forEach(zip => nycZipCodes.add(zip));
            console.log("NYC ZIP codes loaded.");
        })
        .catch(error => {
            console.error("Error loading NYC ZIP codes JSON:", error);
        });
});

function toggleMapStyle() {
    if (currentTileLayer._url.includes('openstreetmap.org')) {
        // Switch to Esri Satellite tiles
        map.removeLayer(currentTileLayer);
        currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
            maxZoom: 19,
        });
        currentTileLayer.addTo(map);
        showMessage("Switched to satellite view");
    } else {
        // Switch back to OpenStreetMap tiles
        map.removeLayer(currentTileLayer);
        currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        });
        currentTileLayer.addTo(map);
        showMessage("Switched to default map style");
    }
}

function toggleHeatmap() {
    if (map.hasLayer(heatmapLayer)) {
        map.removeLayer(heatmapLayer);
        showMessage("Heatmap disabled");
    } else {
        map.addLayer(heatmapLayer);
        showMessage("Heatmap enabled");
    }
}

function searchLocation() {
    const query = document.getElementById('search').value.trim();

    if (!query) {
        showMessage("Please enter a ZIP code or location", true);
        return;
    }

    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&countrycodes=us`)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                const { lat, lon } = data[0];
                map.setView([lat, lon], 12);
                showMessage("Location found");
            } else {
                showMessage("Location not found", true);
            }
        })
        .catch(error => {
            console.error("Error searching location:", error);
            showMessage("Failed to search location", true);
        });
}

function highlightZipCode() {
    const query = document.getElementById('search').value.trim();

    if (!query) {
        showMessage("Please enter a ZIP code to highlight", true);
        return;
    }

    if (!nycZipCodes.has(query)) {
        showMessage("This ZIP code is not in New York City", true);
        return;
    }

    // Fetch ZIP code boundary data
    fetch(`https://geo.fcc.gov/api/census/area?format=geojson&zip=${query}`)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to fetch ZIP code boundary data");
            }
            return response.json();
        })
        .then(data => {
            if (data.features && data.features.length > 0) {
                const zipFeature = data.features[0];

                // Ensure the ZIP code is in the United States
                if (zipFeature.properties && zipFeature.properties.COUNTRY && zipFeature.properties.COUNTRY !== 'US') {
                    showMessage("ZIP code is not within the United States", true);
                    return;
                }

                // Remove existing ZIP code layer
                if (zipCodeLayer) {
                    map.removeLayer(zipCodeLayer);
                }

                // Add ZIP code boundary to map
                zipCodeLayer = L.geoJSON(zipFeature.geometry, {
                    style: {
                        color: "blue",
                        weight: 3,
                        dashArray: "5, 5",
                        opacity: 0.8,
                        fillColor: "lightblue",
                        fillOpacity: 0.4,
                    },
                    onEachFeature: function (feature, layer) {
                        layer.bindPopup(`ZIP Code: ${query}`);
                    },
                }).addTo(map);

                // Fit map to boundary
                map.fitBounds(zipCodeLayer.getBounds());
                showMessage("ZIP code highlighted successfully");
            } else {
                showMessage("ZIP code boundary data unavailable", true);
            }
        })
        .catch(error => {
            console.error("Error fetching ZIP code boundary data:", error);
            showMessage("Failed to highlight ZIP code", true);
        });
}

document.addEventListener('click', event => {
    if (event.target.classList.contains('get-directions-btn')) {
        const lat = parseFloat(event.target.getAttribute('data-lat'));
        const lng = parseFloat(event.target.getAttribute('data-lng'));
        openGoogleMapsDirections(lat, lng);
    }
});

function openGoogleMapsDirections(lat, lng) {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(directionsUrl, '_blank');
}

function showMessage(message, isError = false) {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = message;
    messageBox.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    messageBox.style.color = isError ? '#721c24' : '#155724';
    messageBox.classList.add('active');
    setTimeout(() => {
        messageBox.classList.remove('active');
    }, 3000);
}
