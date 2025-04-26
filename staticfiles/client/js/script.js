// Coordinates storage for location and target (initialized from localStorage if available)
let location1 = JSON.parse(localStorage.getItem('location1')) || { lat: null, lon: null, elevation: null };
let target1 = JSON.parse(localStorage.getItem('target1')) || { lat: null, lon: null, elevation: null };
let selecting = null; // To track which location (location1 or target1) is being selected
let shotMarker = null;
let targetMarker = null;

let selectedWeaponType = null;

// Function to initialize map
const map = new maplibregl.Map({
    container: 'map',
    style: 'https://api.maptiler.com/maps/01960b17-0177-7404-adf3-88f83f33b5ea/style.json?key=HD1YMAgSOmDQKrxiNsoa',
    center: [37.90367, 48.01854], // Default center
    zoom: 10.8,
    pitch: 60,
    bearing: -10
});

// Check if it's the first time the user is loading the map
const isFirstTime = !localStorage.getItem('location1') || !localStorage.getItem('target1');

// Clear markers if it's the first time
if (isFirstTime) {
    console.log("First time loading: No saved coordinates, so clearing map markers");
    // Clear stored data for a fresh start (in case it's already stored)
    localStorage.removeItem('location1');
    localStorage.removeItem('target1');
    // Ensure no markers are displayed
    if (shotMarker) shotMarker.remove();
    if (targetMarker) targetMarker.remove();
} else {
    // Otherwise, load saved coordinates from localStorage
    console.log("Loading saved coordinates...");
    updateCoordinatesAndElevation('location1');
    updateCoordinatesAndElevation('target1');
    addMarker('location1');
    addMarker('target1');
}

// Sample function to get elevation (modify this as per your needs)
async function fetchElevationData(lon, lat) {
    const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lon}`);
    const data = await response.json();
    return data.results[0].elevation;
}

map.addControl(new maplibregl.NavigationControl());

// Create markers storage
let markers = { location1: null, target1: null };

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
            'sky-atmosphere-sun-intensity': 0
        }
    });

    // Update map locations from localStorage on load
    updateCoordinatesAndElevation('location1');
    updateCoordinatesAndElevation('target1');
    addMarker('location1');
    addMarker('target1');
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

let selectedLocation = { lat: null, lon: null, elevation: null };

function handleMapClick(e) {
    const { lat, lng } = e.lngLat;
    selectedLocation = {
        lat: lat,
        lon: lng,
        elevation: null // maybe you add elevation later
    };

    if (currentSelectionType === 'location1') {
        document.getElementById('shot-coords').textContent = `Місце пострілу: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } else if (currentSelectionType === 'target1') {
        document.getElementById('target-coords').textContent = `Ціль: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }

    document.getElementById('elevation').textContent = `Висота: ${selectedLocation.elevation ?? '--'} м`;
    addMarker(currentSelectionType);
}

// Handle map click to update coordinates and elevation
map.on('click', (e) => {
    const lat = e.lngLat.lat;
    const lon = e.lngLat.lng;

    document.getElementById('click-coords').innerHTML = `Вибрані координати: ${lat.toFixed(5)}, ${lon.toFixed(5)}`;

    if (selecting) {
        // getElevation and save logic here (if selecting location or target)
        getElevation(lat, lon, (elevation) => {
            // Update coordinates and elevation
            if (selecting === 'location1') {
                location1 = { lat, lon, elevation };
                localStorage.setItem('location1', JSON.stringify(location1));
                updateCoordinatesAndElevation('location1');
            } else if (selecting === 'target1') {
                target1 = { lat, lon, elevation };
                localStorage.setItem('target1', JSON.stringify(target1));
                updateCoordinatesAndElevation('target1');
            }

            selecting = null;
        });
    }

    if (currentSelectionType) {
        if (selectedMarker) selectedMarker.remove();
        selectedMarker = new maplibregl.Marker({ color: 'crimson' })
            .setLngLat([lon, lat])
            .addTo(map);

        window.selectedLat = lat;
        window.selectedLng = lon;

        if (currentSelectionType === 'location1') {
            document.getElementById('confirm-location-btn').style.display = 'block';
        } else if (currentSelectionType === 'target1') {
            document.getElementById('confirm-target-btn').style.display = 'block';
        }
    }
});

// Function to start selecting a location or target
function startSelecting(locationKey) {
    currentSelectionType = locationKey;

    // Показуємо відповідну панель
    if (locationKey === 'location1') {
        openPanel('location');
        document.getElementById('confirm-location-btn').style.display = 'none';
    } else if (locationKey === 'target1') {
        openPanel('target');
        document.getElementById('confirm-target-btn').style.display = 'none';
    }

    // Скидаємо попередній вибір
    window.selectedLat = null;
    window.selectedLng = null;

    // Видаляємо попередній тимчасовий маркер
    if (selectedMarker) {
        selectedMarker.remove();
        selectedMarker = null;
    }

    // // Пишемо інструкцію
    // document.getElementById('click-coords').textContent = "Клікніть на мапу, щоб вибрати точку.";
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

// Manual input for location coordinates
function setLocation() {
    const latitude = parseFloat(document.getElementById('latitude').value);
    const longitude = parseFloat(document.getElementById('longitude').value);
    if (!isNaN(latitude) && !isNaN(longitude)) {
        location1 = { lat: latitude, lon: longitude, elevation: null };
        getElevation(latitude, longitude, (elevation) => {
            location1.elevation = elevation;
            localStorage.setItem('location1', JSON.stringify(location1));  // Save to localStorage
            updateCoordinatesAndElevation('location1');
            addMarker('location1');  // Add marker after setting location
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
            localStorage.setItem('target1', JSON.stringify(target1));  // Save to localStorage
            updateCoordinatesAndElevation('target1');
            addMarker('target1');  // Add marker after setting target
        });
        closePanel();
    } else {
        alert("Будь ласка, введіть правильні координати!");
    }
}

function confirmSelectedPointFromPanel() {
    if (window.selectedLat == null || window.selectedLng == null) {
        alert("Будь ласка, спочатку виберіть точку на мапі!");
        return;
    }

    getElevation(window.selectedLat, window.selectedLng, (elevation) => {
        if (currentSelectionType === 'location1') {
            location1 = {
                lat: window.selectedLat,
                lon: window.selectedLng,
                elevation
            };
            localStorage.setItem('location1', JSON.stringify(location1));
            updateCoordinatesAndElevation('location1');
            addMarker('location1');
            // Update form fields with coordinates
            document.getElementById('latitude').value = window.selectedLat.toFixed(5);
            document.getElementById('longitude').value = window.selectedLng.toFixed(5);
            document.getElementById('confirm-location-btn').style.display = 'none';
        } else if (currentSelectionType === 'target1') {
            target1 = {
                lat: window.selectedLat,
                lon: window.selectedLng,
                elevation
            };
            localStorage.setItem('target1', JSON.stringify(target1));
            updateCoordinatesAndElevation('target1');
            addMarker('target1');
            // Update form fields with coordinates
            document.getElementById('target-latitude').value = window.selectedLat.toFixed(5);
            document.getElementById('target-longitude').value = window.selectedLng.toFixed(5);
            document.getElementById('confirm-target-btn').style.display = 'none';
        }

        // Clear selection after updating
        window.selectedLat = null;
        window.selectedLng = null;
        if (selectedMarker) {
            selectedMarker.remove();
            selectedMarker = null;
        }
        currentSelectionType = null;
        document.getElementById('click-coords').textContent = '';
    });

}

document.getElementById('confirm-location-btn').style.display = 'none';
document.getElementById('confirm-target-btn').style.display = 'none';
// Track which type of selection is happening
let currentSelectionType = null;
let selectedMarker = null;

// Function to handle location icon click and show manual entry panel
function selectLocation(loc) {
    currentSelectionType = loc;
    document.getElementById('manual-entry-panel').style.display = 'block';

    if (loc === 'location1') {
        openPanel('location');
    } else if (loc === 'target1') {
        openPanel('target');
    }
}

function createCustomMarker(iconUrl) {
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.backgroundImage = `url(${iconUrl})`;
    el.style.width = '28px';  // Make the icon smaller by adjusting width
    el.style.height = '28px';  // Make the icon smaller by adjusting height
    el.style.backgroundSize = 'cover';
    el.style.backgroundRepeat = 'no-repeat';
    el.style.cursor = 'pointer'; // For better UX
    return el;
}

function addMarker(locationKey) {
    const selectedLocation = locationKey === 'location1' ? location1 : target1;
    console.log("Trying to add marker:", selectedLocation); // DEBUG

    if (selectedLocation?.lat == null || selectedLocation?.lon == null) {
        console.warn("No coordinates to place marker for:", locationKey);
        return;
    }

    const coords = [selectedLocation.lon, selectedLocation.lat];

    if (locationKey === 'location1') {
        if (shotMarker) shotMarker.remove();

        // Create shot marker
        shotMarker = new maplibregl.Marker({
            element: createCustomMarker('../static/client/img/pngegg.png'),
            title: 'Постріл'
        })
            .setLngLat(coords)
            .addTo(map);

        // Popup for shot marker with additional info
        const popup = new maplibregl.Popup({ offset: 30 })
            .setHTML(`
      <div style="font-family: 'MyCustomFont', sans-serif; font-size: 10px; color: #333;">
        🚀 Постріл
        <br>Lat: ${selectedLocation.lat}
        <br>Lon: ${selectedLocation.lon}
        <br>Elevation: ${selectedLocation.elevation || 'N/A'}
      </div>
    `);
        shotMarker.setPopup(popup).togglePopup();

    } else if (locationKey === 'target1') {
        if (targetMarker) targetMarker.remove();

        // Create target marker
        targetMarker = new maplibregl.Marker({
            element: createCustomMarker('../static/client/img/pngegg.png'),
            title: 'Ціль'
        })
            .setLngLat(coords)
            .addTo(map);

        // Popup for target marker with additional info
        const popup = new maplibregl.Popup({ offset: 30 })
            .setHTML(`
      <div style="font-family: 'MyCustomFont', sans-serif; font-size: 10px; color: #333;">
        🎯 Ціль
        <br>Lat: ${selectedLocation.lat}
        <br>Lon: ${selectedLocation.lon}
        <br>Elevation: ${selectedLocation.elevation || 'N/A'}
      </div>
    `);
        targetMarker.setPopup(popup).togglePopup();
    }
}

// Update coordinates and fetch elevation dynamically
function updateCoordinatesAndElevation(locationKey) {
    const selectedLocation = locationKey === 'location1' ? location1 : target1;

    if (selectedLocation.lat && selectedLocation.lon) {
        map.flyTo({
            center: [selectedLocation.lon, selectedLocation.lat],
            essential: true
        });

        if (locationKey === 'location1') {
            document.getElementById('shot-coords').textContent = `Місце пострілу: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lon.toFixed(5)}`;
        } else if (locationKey === 'target1') {
            document.getElementById('target-coords').textContent = `⠀Ціль: ${selectedLocation.lat.toFixed(5)}, ${selectedLocation.lon.toFixed(5)}`;
        }

        // Get the elevation dynamically based on the location
        getElevation(selectedLocation.lat, selectedLocation.lon, (elevation) => {
            document.getElementById('elevation').textContent = `Висота: ${elevation ?? '--'} м`;
        });

        addMarker(locationKey);
    } else {
        console.log("No coordinates set for " + locationKey);
    }
}

// Закриває всі панелі, щоб не було одночасних
function closeAllPanels() {
    document.querySelectorAll('.side-panel').forEach(panel => {
        panel.classList.remove('active');
    });
}

// Відкриває панель по назві типу
function openPanel(panelType) {
    closeAllPanels();
    const panel = document.getElementById(`${panelType}-panel`);
    if (panel) {
        panel.classList.add('active');
        if (panelType === 'weapon') {
            updateWeaponsList(); // Оновлення списку зброї при відкритті панелі
        }
    }
}

// Оновлює список зброї залежно від вибраного типу
function updateWeaponsList() {
    const weaponList = document.getElementById('weapon-type');
    weaponList.innerHTML = ''; // Очищаємо список перед оновленням

    // Оновлюємо дані для вибраного типу зброї
    loadWeaponsData().then(weapons => {
        Object.entries(weapons).forEach(([id, name]) => {
            const weaponItem = document.createElement('option');
            weaponItem.value = name;
            weaponItem.textContent = name;
            weaponList.appendChild(weaponItem);
        });
    });
}

// Функція для завантаження зброї з "бази даних" (поки що замінимо на статичний масив)
async function loadWeaponsData() {
    return new Promise((resolve) => {
        setTimeout(() => {
            fetch('/get_howitzer_names/')
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    return response.json();
                })
                .then(data => {
                    // console.log('Data from server:', data);
                    resolve(data);
                })
                .catch(error => {
                    console.error('Error:', error);
                    resolve([]);
                });
        }, 100);
    });
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            cookie = cookie.trim();
            // Check if this cookie string begins with the name we want
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Функція для обрахунку
function calculate() {
    // Перевірка чи є ціль та локація
    const location1 = JSON.parse(localStorage.getItem('location1'));
    const target1 = JSON.parse(localStorage.getItem('target1'));
    const weapon = document.getElementById('weapon-type').value;

    console.log('CSRF Token:', csrfToken);
    if (location1 && target1) {
        fetch('/compute/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
            },
            body: JSON.stringify({
                'location': location1,
                'target': target1,
                'weapon': weapon
            })
        })
        .then(async response => {
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }
            return response.json();
        })
        .then(data => {
            // console.log('Shooting data:', data);
            alert(`Азимут: ${data['brng'].toFixed(5)}, Кут підйому: ${data['angle'].toFixed(5)}, Час польоту: ${data['flight_time'].toFixed(1)} с.`);
        })
        .catch(error => {
            alert(error);
            console.error('Error:', error);
        });
    } else {
        alert("Будь ласка, спочатку оберіть локацію і ціль!");
    }
}

// Для закриття по ✕
function closePanel() {
    closeAllPanels();
}

document.getElementById('click-coords').style.fontFamily = 'MyCustomFont';
document.getElementById('shot-coords').style.fontFamily = 'MyCustomFont';
document.getElementById('target-coords').style.fontFamily = 'MyCustomFont';
document.getElementById('elevation').style.fontFamily = 'MyCustomFont';

