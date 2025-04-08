// Coordinates storage for location and target
let location1 = { lat: null, lon: null, elevation: null };
let target1 = { lat: null, lon: null, elevation: null };
let selecting = null; // To track which location (location1 or target1) is being selected

// Initialize map
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://api.maptiler.com/maps/01960b17-0177-7404-adf3-88f83f33b5ea/style.json?key=HD1YMAgSOmDQKrxiNsoa',
  center: [37.90367, 48.01854],
  zoom: 10.8,
  pitch: 60,
  bearing: -10
});

map.addControl(new maplibregl.NavigationControl());

// Handle map load
map.on('load', () => {
  // Add DEM source for terrain
  map.addSource('terrain', {
    type: 'raster-dem',
    url: 'https://api.maptiler.com/tiles/terrain-rgb/tiles.json?key=HD1YMAgSOmDQKrxiNsoa',
    tileSize: 256,
    maxzoom: 14
  });

  // Enable terrain
  map.setTerrain({ source: 'terrain', exaggeration: 1.5 });

  // Sky atmosphere
  map.addLayer({
    id: 'sky',
    type: 'sky',
    paint: {
      'sky-type': 'atmosphere',
      'sky-atmosphere-sun': [0.0, 0.0],
      'sky-atmosphere-sun-intensity': 15
    }
  });
});

// Function to get elevation for a given location
function getElevation(lat, lon, callback) {
  const url = `https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`;
  console.log(`Requesting elevation for coordinates: ${lat}, ${lon}`); // DEBUG log

  fetch(url)
    .then(response => response.json())
    .then(data => {
      console.log("Elevation data received:", data); // DEBUG log
      const elevation = data.results[0]?.elevation;
      console.log(`Elevation: ${elevation}`); // DEBUG log

      if (elevation !== undefined) {
        callback(elevation);
      } else {
        console.error("No elevation data returned for the coordinates.");
        callback(null);
      }
    })
    .catch(error => {
      console.error("Error fetching elevation:", error);
      callback(null);
    });
}

// Function to update the location or target on the map
function updateCoordinatesAndElevation(locationKey) {
  const selectedLocation = locationKey === 'location1' ? location1 : target1;
  if (selectedLocation.lat && selectedLocation.lon) {
    map.flyTo({
      center: [selectedLocation.lon, selectedLocation.lat],
      essential: true
    });

    // Display height for selected location (location or target)
    document.getElementById('elevation').textContent = `Висота: ${selectedLocation.elevation ?? '--'} м`;
    document.getElementById(locationKey).textContent = `Координати: ${selectedLocation.lat}, ${selectedLocation.lon}<br>Висота: ${selectedLocation.elevation ?? '--'} м`;
  } else {
    console.log("No coordinates set for " + locationKey);
  }
}

// Function to handle map click and select location or target
map.on('click', (e) => {
  const lat = e.lngLat.lat;
  const lon = e.lngLat.lng;

  // Display coordinates on click
  document.getElementById('click-coords').innerHTML = `Клік: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;

  if (selecting) {
    // Get the elevation for the selected location
    getElevation(lat, lon, (elevation) => {
      document.getElementById('elevation').textContent = `Висота: ${elevation ?? '--'} м`;

      if (selecting === 'location1') {
        location1 = { lat, lon, elevation };
        document.getElementById('loc1').innerHTML = `Координати: ${lat.toFixed(5)}, ${lon.toFixed(5)}<br>Висота: ${elevation ?? '--'} м`;
      } else if (selecting === 'target1') {
        target1 = { lat, lon, elevation };
        document.getElementById('target').innerHTML = `Ціль: ${lat.toFixed(5)}, ${lon.toFixed(5)}<br>Висота: ${elevation ?? '--'} м`;
      }

      selecting = null;
      document.getElementById('manual-entry-panel').style.display = 'none'; // Close panel after selection
    });
  }
});

// Function to start selecting a location or target
function startSelecting(locationKey) {
  selecting = locationKey;
  updateCoordinatesAndElevation(locationKey);
}

// Add event listener to location icon (кружечок)
document.querySelectorAll('.location-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    const loc = icon.getAttribute('data-location');
    selectLocation(loc);
  });
});

// Close the panel
document.querySelectorAll('.close-x').forEach(btn => {
  btn.addEventListener('click', () => {
    document.getElementById('manual-entry-panel').style.display = 'none';
  });
});

// Function to open a specific panel
function openPanel(panelId) {
  closePanel(); // Close all panels first
  if (panelId === 'location') {
    document.getElementById('location-panel').style.display = 'block';
  } else if (panelId === 'target') {
    document.getElementById('target-panel').style.display = 'block';
  }
}

// Function to close all panels
function closePanel() {
  document.getElementById('location-panel').style.display = 'none';
  document.getElementById('target-panel').style.display = 'none';
}

// Manual input for location coordinates
function setLocation() {
  const latitude = parseFloat(document.getElementById('latitude').value);
  const longitude = parseFloat(document.getElementById('longitude').value);
  if (!isNaN(latitude) && !isNaN(longitude)) {
    location1 = { lat: latitude, lon: longitude, elevation: null };
    getElevation(latitude, longitude, (elevation) => {
      location1.elevation = elevation;
      updateCoordinatesAndElevation('location1');
    });
    closePanel();
  } else {
    alert("Будь ласка, введіть правильні координати!");
  }
}

// Manual input for target coordinates
function setTarget() {
  const latitude = parseFloat(document.getElementById('target-latitude').value);
  const longitude = parseFloat(document.getElementById('target-longitude').value);
  if (!isNaN(latitude) && !isNaN(longitude)) {
    target1 = { lat: latitude, lon: longitude, elevation: null };
    getElevation(latitude, longitude, (elevation) => {
      target1.elevation = elevation;
      updateCoordinatesAndElevation('target1');
    });
    closePanel();
  } else {
    alert("Будь ласка, введіть правильні координати!");
  }
}

function openPanel(panelId) {
  // Закриваємо всі панелі
  const panels = document.querySelectorAll('.side-panel');
  panels.forEach(panel => panel.classList.remove('active'));

  // Відкриваємо обрану панель
  document.getElementById(`${panelId}-panel`).classList.add('active');
}

function closePanel() {
  // Закриваємо всі панелі
  const panels = document.querySelectorAll('.side-panel');
  panels.forEach(panel => panel.classList.remove('active'));
}

function setWeapon() {
  const weaponType = document.getElementById('weapon-type').value;
  console.log('Вибрана зброя: ' + weaponType);
  // Додай тут функціонал для роботи з вибраною зброєю
}
