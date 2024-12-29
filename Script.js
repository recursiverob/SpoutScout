let map;
let heatmapLayer;
let currentTileLayer;
let markers;
let zipCodeLayer;
let nycZipCodes = new Set();
let userMarker;

window.onload = function() {
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('map').style.visibility = 'visible';
    }, 2000); //  Loading Screen
};

document.addEventListener("DOMContentLoaded", () => {
    const usBounds = [
        [24.396308, -125.0], // Southwest corner of US
        [49.384358, -66.93457] // Northeast corner of US
    ];

    map = L.map('map', {
        maxBounds: usBounds,
        maxBoundsViscosity: 1.0 // Fully restricts panning beyond bounds
    }).setView([39.8283, -98.5795], 5); // Centered on US

    // Add OpenStreetMap tiles
    currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Create a marker cluster group
    markers = L.markerClusterGroup();

    //The Geocoded_Addresses_Updated_Single_Line.json file contains the data for fountains in South Dakota .
    // Array of fountain JSON files
    const fountainFiles = [
        'JSON Locations/NYC_Fountains.json',
        'JSON Locations/Pittsburgh_PA_Foutains.json',
        'JSON Locations/Geocoded_Addresses_Updated_Single_Line(SouthDakota).json',
        'JSON Locations/Pasadena_CA_Fountains.json',
        'JSON Locations/Denver_CO_Fountains.json',
        'JSON Locations/Random_Fountains.json',
        'JSON Locations/Plano_TX_Fountains.json',
        'JSON Locations/Dallas_TX_Fountains.json'
    ];
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('get-directions-btn')) {
            const lat = parseFloat(event.target.getAttribute('data-lat'));
            const lng = parseFloat(event.target.getAttribute('data-lng'));
    
            if (!isNaN(lat) && !isNaN(lng)) {
                openGoogleMapsDirections(lat, lng);
            } else {
                showMessage("Invalid coordinates for navigation", true);
            }
        }
    });
    
    function openGoogleMapsDirections(lat, lng) {
        const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
        window.open(directionsUrl, '_blank'); // Opens Google Maps directions in a new tab
    }
    
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
                        <!-- <b>City:</b> ${fountain.city || 'Unknown'}<br>
                        <b>Latitude:</b> ${fountain.lat}<br>
                        <b>Longitude:</b> ${fountain.lng}<br> -->
                        <button class="get-directions-btn" data-lat="${fountain.lat}" data-lng="${fountain.lng}">
                            Get Me Here
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
            /*.catch(error => {
                showMessage(`Error loading ${file}`, true);
            });
            */
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

    
    locateButton.textContent = "Locate Nearest Drinking Fountain";
    locateButton.id = "locate-nearest";
    locateButton.style.position = "absolute";
    locateButton.style.top = "80px";
    locateButton.style.left = "10px";
    locateButton.style.zIndex = "1000";
    locateButton.onclick = locateNearestFountain;
    document.body.appendChild(locateButton);

    
    myLocationButton.textContent = "Show My Location";
    myLocationButton.id = "show-my-location";
    myLocationButton.style.position = "absolute";
    myLocationButton.style.top = "120px";
    myLocationButton.style.left = "10px";
    myLocationButton.style.zIndex = "1000";
    myLocationButton.onclick = showMyLocation;
    document.body.appendChild(myLocationButton);

    
    document.addEventListener('click', event => {
        if (event.target.classList.contains('get-directions-btn')) {
            const lat = parseFloat(event.target.getAttribute('data-lat'));
            const lng = parseFloat(event.target.getAttribute('data-lng'));
            openGoogleMapsDirections(lat, lng);
        }
    });

    
    const searchButton = document.getElementById("search-button");
    if (searchButton) {
        searchButton.addEventListener("click", searchLocation);
    }
});

function locateNearestFountain() {
    if (!navigator.geolocation) {
        showMessage("Geolocation is not supported by your browser", true);
        return;
    }

    navigator.geolocation.getCurrentPosition(position => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        let nearestFountain = null;
        let shortestDistance = Infinity;

        // Iterate through the markers to find the nearest fountain
        markers.eachLayer(marker => {
            const fountainLat = marker.getLatLng().lat;
            const fountainLng = marker.getLatLng().lng;

            const distanceInfo = haversineDistance(userLat, userLng, fountainLat, fountainLng);
            if (distanceInfo.km < shortestDistance) {
                shortestDistance = distanceInfo.km;
                nearestFountain = marker;
            }
        });

        if (nearestFountain) {
            const { lat, lng } = nearestFountain.getLatLng();
            const popupContent = nearestFountain.getPopup().getContent();
            const nameMatch = /<b>(.*?)<\/b>/.exec(popupContent);
            const locationName = nameMatch ? nameMatch[1] : "Unknown Location";

            // Uncluster the nearest fountain if it is part of a cluster
            markers.zoomToShowLayer(nearestFountain, () => {
                // Centers the map, opens the popup, and displays the message
                map.setView([lat, lng], 15); // Zoom to the nearest fountain
                nearestFountain.bindPopup(popupContent).openPopup(); // Open the popup
                showMessage(`Nearest fountain located at ${locationName} (${shortestDistance.toFixed(2)} km / ${(shortestDistance * 0.621371).toFixed(2)} mi away)`);
            });
        } else {
            showMessage("No fountains found nearby", true);
        }
    }, error => {
        console.error("Error retrieving location:", error);
        showMessage("Unable to retrieve your location", true);
    });
}



function showMyLocation() {
    if (!navigator.geolocation) {
        showMessage("Geolocation is not supported by your browser", true);
        return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;

        // Calls the reverse geocoding API
        const reverseGeocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}`;

        try {
            const response = await fetch(reverseGeocodeUrl);
            if (!response.ok) throw new Error("Failed to fetch address");

            const data = await response.json();
            const address = data.display_name || "Address not available";
            // Create a custom icon for the user so that they stand out amongst location markers
        const customIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png', // URL for a red marker
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png', // Optional shadow
            iconSize: [40, 60], 
            iconAnchor: [20, 60], 
            popupAnchor: [0, -50] 
        });
            // Add marker to the map with address
            const userMarker = L.marker([userLat, userLng], {icon: customIcon})
                .addTo(map)
                .bindPopup(`<b>You are here</b><br>${address}`)
                .openPopup();

            map.setView([userLat, userLng], 15); // Zoom into user's location
        } catch (error) {
            console.error("Error fetching address:", error);
            showMessage("Unable to retrieve address", true);
        }
    }, (error) => {
        console.error("Error retrieving location:", error);
        showMessage("Unable to retrieve your location", true);
    });
}


function searchLocation() {
    const query = document.getElementById('search').value.trim();

    if (!query) {
        showMessage("Please enter a ZIP code or location", true);
        return;
    }

    const requestUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us`;
    console.log("Requesting:", requestUrl); // Debug log to catch any errors during call

    fetch(requestUrl)
        .then(response => {
            if (!response.ok) throw new Error(`Error fetching location: ${response.statusText}`);
            return response.json();
        })
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



function openGoogleMapsDirections(lat, lng) {
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(directionsUrl, '_blank');
}

// Haversine formula to calculate distance between two points
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const km = R * c; // Distance in km
    const mi = km * 0.621371; // Distance in mi
    return { km, mi }; // Return both distances
}

function toggleMapStyle() {
    const toggleButton = document.getElementById('toggle-map-style');
    if (currentTileLayer._url.includes('openstreetmap.org')) {
        // Switch to Satellite View
        map.removeLayer(currentTileLayer);
        currentTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
            maxZoom: 19,
        });
        currentTileLayer.addTo(map);
        toggleButton.textContent = "Default Map View"; // Update button text
        showMessage("Switched to Satellite View");
    } else {
        // Switch to Default Map View
        map.removeLayer(currentTileLayer);
        currentTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19,
        });
        currentTileLayer.addTo(map);
        toggleButton.textContent = "Satellite View"; 
        showMessage("Switched to Default Map View");
    }
}


function showMessage(message, isError = false) {
    const messageBox = document.getElementById('message-box');
    messageBox.textContent = message;
    messageBox.style.backgroundColor = isError ? '#f8d7da' : '#d4edda';
    messageBox.style.color = isError ? '#721c24' : '#155724';
    messageBox.style.opacity = '1'; 
    messageBox.classList.add('active');

    // Starts fading out after 4 seconds
    setTimeout(() => {
        messageBox.style.opacity = '0'; // Fade out
    }, 4000);

    // Remove the active class and reset styles after fade-out (5 seconds)
    setTimeout(() => {
        messageBox.classList.remove('active');
        messageBox.style.opacity = ''; 
    }, 5000);
}
-------------------------------------------
function toggleMobileMenu() {
    const mapControls = document.getElementById('map-controls');
    mapControls.classList.toggle('show-controls');
  }
  
