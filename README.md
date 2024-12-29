# SpoutScout

SpoutScout is an interactive web app that maps and displays over 4,500+ accessible drinking fountains across the United States. Designed with accessibility and user experience in mind, the app allows users to locate fountains near their location, visualize clusters of fountains, and access real-time directions to any fountain.

## Features

- **Interactive Map**: Displays drinking fountain locations using Leaflet.js, with clustering functionality for optimized visualization.
- **Geolocation Integration**: Locate the user's current position and display the nearest drinking fountain.
- **Reverse Geocoding**: Dynamically fetch and display user addresses using the Nominatim and Google Maps API.
- **Real-Time Directions**: Provide Google Maps navigation to any selected fountain.
- **Responsive Design**: Includes a mobile-friendly layout for different screen sizes.
- **Satellite View Toggle**: Switch between default and satellite map styles.
- **Dynamic Data Loading**: Leverages multiple JSON files to display water fountain data efficiently.
- **Customizable User Marker**: A distinct marker highlights the user’s location on the map.

## Technologies Used

- **Frontend**:
  - HTML5, CSS3
  - JavaScript (Vanilla JS, Leaflet.js)
- **APIs**:
  - Nominatim for geocoding and reverse geocoding
  - OpenStreetMap for map rendering
  - Google Maps for real-time navigation
- **Backend Data Processing**:
  - Python scripts for cleaning, extracting, and converting raw data into JSON format
  - API usage in Python scripts (e.g., Nominatim and Google Geocoding APIs)

## Usage

1. **Search for a Location**:
   - Enter a city or ZIP code in the search bar to find the desired area.
2. **Locate Your Position**:
   - Click the "Locate Me" button to display your current position and location on the map.
3. **Find the Nearest Fountain**:
   - Click "Locate Nearest Fountain" to zoom in on the closest water fountain and view its details.
4. **Toggle Map Style**:
   - Use the "Satellite View" button to switch between map styles.
5. **Mobile Navigation**:
   - On mobile, use the hamburger menu to access all controls.

## Data Sources

- Water fountain data was processed and refined from multiple sources.
- Python scripts were used to extract and convert raw data into structured JSON files, filling them with addresses, park names, and geolocation coordinates(lat, long).

## Future Enhancements

- Add user authentication to save favorite locations and add locations.
- Support additional data layers, such as nearby restrooms or pet-friendly fountains.
- Incorporate real-time data updates using an external API.
- Improve performance for large datasets with advanced clustering techniques.

## License

This project is licensed under the MIT License. Please take a look at the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Leaflet.js** for interactive map rendering.
- **Nominatim API** for geocoding and reverse geocoding services.
- **OpenStreetMap** for providing detailed map data.
- **Google Maps** for real-time navigation support.
