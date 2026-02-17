
    // const reportbtn=document.querySelector(".btn-secondary")
    // reportbtn.addEventListener("click",()=> {
    //     window.location.href = "complaint.html";
    // })
 // 1. Data Structure for Issues
// In a real app, this would come from a database/API
// const issues = [
//     {
//         id: 1,
//         title: "Broken Streetlight",
//         lat: 19.1866,
//         lng: 73.2386,
//         status: "Pending",
//         location: "Oak St.",
//         time: "2 mins ago",
//         icon: "fa-bolt",
//         color: "#f1c40f"
//     },
//     {
//         id: 2,
//         title: "Illegal Dumping",
//         lat: 19.1949,
//         lng: 73.2136,
//         status: "In Progress",
//         location: "5th Ave.",
//         time: "1 hour ago",
//         icon: "fa-trash",
//         color: "#e74c3c"
//     },
//     {
//         id: 3,
//         title: "Pothole Repair",
//         lat: 19.1900,
//         lng: 73.2200,
//         status: "Resolved",
//         location: "Main Road",
//         time: "5 hours ago",
//         icon: "fa-tools",
//         color: "#2ecc71"
//     },
//     {
//         id: 4,
//         title: "Water Leakage",
//         lat: 19.1820,
//         lng: 73.2410,
//         status: "Pending",
//         location: "Shivaji Chowk",
//         time: "15 mins ago",
//         icon: "fa-droplet",
//         color: "#3498db" 
//     },
//     {
//         id: 5,
//         title: "Overgrown Vegetation",
//         lat: 19.1985,
//         lng: 73.2050,
//         status: "In Progress",
//         location: "Forest Naka",
//         time: "3 hours ago",
//         icon: "fa-leaf",
//         color: "#27ae60" 
//     },
//     {
//         id: 6,
//         title: "Graffiti Removal",
//         lat: 19.1750,
//         lng: 73.2300,
//         status: "Resolved",
//         location: "Station Road",
//         time: "1 day ago",
//         icon: "fa-paint-roller",
//         color: "#9b59b6" 
//     },
//     {
//         id: 7,
//         title: "Damaged Sidewalk",
//         lat: 19.1895,
//         lng: 73.2180,
//         status: "Pending",
//         location: "Garden View Lane",
//         time: "45 mins ago",
//         icon: "fa-road",
//         color: "#e67e22" 
//     },
//     {
//         id: 8,
//         title: "Abandoned Vehicle",
//         lat: 19.2010,
//         lng: 73.2250,
//         status: "Pending",
//         location: "B-Cabin Road",
//         time: "6 hours ago",
//         icon: "fa-car-side",
//         color: "#95a5a6" 
//     },
//     {
//         id: 9,
//         title: "Traffic Signal Malfunction",
//         lat: 19.1912,
//         lng: 73.2355,
//         status: "In Progress",
//         location: "Highway Junction",
//         time: "10 mins ago",
//         icon: "fa-traffic-light",
//         color: "#c0392b" 
//     }
// ];
 var map = L.map('map-placeholder').setView([19.1866, 73.2386], 15); 
    
       
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 20,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
// 1. Configuration and Global Variables
const API_URL = "http://localhost:8080/complaint";

let issues = [];



// Define Marker Layers
const markerLayers = {
    "Pending": L.layerGroup().addTo(map),
    "In Progress": L.layerGroup().addTo(map),
    "Resolved": L.layerGroup().addTo(map)
}

// 2. Data Fetching (Ensures JSON is awaited)
async function loadInitialData() {
    try {
        const response = await fetch(`${API_URL}/getMapData`, {
            headers: {
               
                "Authorization": "Basic " + btoa(`${localStorage.getItem("email")}:${localStorage.getItem("password")}`)
            }
        });
        
        if (!response.ok) throw new Error("Fetch failed");
        
        const data = await response.json();
        console.log("Data received:", data);
        return data; 
    } catch (err) {
        console.error("Fetch error:", err);
        return []; 
    }
}

// 3. Map Feature Initialization
function initMapFeatures(data) {
    const activityList = document.querySelector('.recent-activity');
    if (!activityList) return;
    
    activityList.innerHTML = ""; // Clear existing

    data.forEach(issue => {
        const customIcon = L.divIcon({
        className: 'custom-pin',
        html: `<div style="
            background-color: ${issue.color || '#333'};
            width: 30px;
            height: 30px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid white;
            box-shadow: 0 0 5px rgba(0,0,0,0.3);
        ">
            <i class="fas ${issue.icon || 'fa-exclamation'}" style="
                color: white; 
                transform: rotate(45deg); 
                font-size: 12px;
            "></i>
        </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30] 
    });
        const marker = L.marker([issue.latitude, issue.longitude]);
        marker.bindPopup(`
            <div style="text-align: center;">
                <strong style="color: ${issue.color || '#000000'};">${issue.title}</strong><br>
                ${issue.location}<br>
                <small>Status: ${issue.status}</small>
            </div>
        `);
      
        // Add marker to the correct status layer
        if (markerLayers[issue.status]) {
            marker.addTo(markerLayers[issue.status]);
        }

        // Add item to sidebar activity list
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <i class="fas ${issue.icon || 'fa-map-marker-alt'}" style="color: ${issue.color || '#333'};"></i>
            <div>
                <p><strong>${issue.title}</strong></p>
                <small>${issue.time || 'Recently'} - ${issue.location}</small>
            </div>
        `;
  
        item.onclick = () => map.flyTo([issue.latitude, issue.longitude], 17);
        activityList.appendChild(item);
    });
}

// 4. Filters and Event Listeners
function setupControls() {
    const allCheckbox = document.querySelector('#all') || document.querySelectorAll('.filter-group input')[0];
    const statusCheckboxes = Array.from(document.querySelectorAll('.filter-group input')).slice(1);

    if (allCheckbox) {
        allCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            statusCheckboxes.forEach(cb => {
                cb.checked = isChecked; 
                const status = cb.parentElement.textContent.trim();
                if (markerLayers[status]) {
                    isChecked ? map.addLayer(markerLayers[status]) : map.removeLayer(markerLayers[status]);
                }
            });
        });
    }

    statusCheckboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            const status = this.parentElement.textContent.trim();
            if (markerLayers[status]) {
                this.checked ? map.addLayer(markerLayers[status]) : map.removeLayer(markerLayers[status]);
            }
            const allChecked = statusCheckboxes.every(sCb => sCb.checked);
            if (allCheckbox) allCheckbox.checked = allChecked;
        });
    });

    // Search Logic
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.toLowerCase();
                const found = issues.find(i => 
                    i.location.toLowerCase().includes(query) || 
                    i.title.toLowerCase().includes(query)
                );
                
                if (found) {
                    map.flyTo([found.latitude, found.longitude], 17);
                } else {
                    alert("Location not found on map.");
                }
            }
        });
    }
}

// 5. Main Execution Flow
async function startApp() {
    // Await the data first
    issues = await loadInitialData();
    
    // Setup UI components
    setupControls();
    
    // Initialize map features if data exists
    if (issues.length > 0) {
        initMapFeatures(issues);
    }
}

// Kick off the application
startApp();


