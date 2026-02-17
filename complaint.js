// 1. Configuration
const API_URL = "http://localhost:8080/complaint";
const authHeader = {
    "Authorization": "Basic " + btoa(`${localStorage.getItem("email")}:${localStorage.getItem("password")}`)
};

let map, marker, currentLat, currentLng, selectedAddress;
let issues = [];

// 2. Map Initialization
function initAppMap() {
    if (map) return;
    map = L.map('map').setView([19.1866, 73.2386], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
}

// 3. Fetch Data from API
async function loadIssues() {
    try {
        const response = await fetch(`${API_URL}/getMapData`, { headers: authHeader });
        if (!response.ok) throw new Error("Fetch failed");
        issues = await response.json();
        renderMarkers(issues);
    } catch (err) {
        console.error("Error loading map data:", err);
    }
}

// 4. Render Markers on Map
function renderMarkers(data) {
    const activityList = document.querySelector('.recent-activity');
    if (!activityList) return;
    activityList.innerHTML = "";

    data.forEach(issue => {
        // Create Marker
        const m = L.marker([issue.latitude, issue.longitude]).addTo(map);
        m.bindPopup(`<b>${issue.title}</b><br>${issue.location}`);

        // Add to Sidebar
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.innerHTML = `
            <i class="fas fa-map-marker-alt" style="color: ${issue.color || '#333'}"></i>
            <div>
                <p><strong>${issue.title}</strong></p>
                <small>${issue.location}</small>
            </div>
        `;
        item.onclick = () => map.flyTo([issue.latitude, issue.longitude], 17);
        activityList.appendChild(item);
    });
}

// 5. Submit Form Logic
const form = document.getElementById("complaintForm");
form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    const payload = {
        title: form.title.value,
        category: form.category.value,
        location: form.location.value,
        description: form.description.value,
        latitude: document.getElementById('lat').value,
        longitude: document.getElementById('lng').value
    };

    formData.append("accept", new Blob([JSON.stringify(payload)], { type: "application/json" }));
    
    const imageInput = document.getElementById("file-upload");
    if (imageInput.files[0]) formData.append("image", imageInput.files[0]);

    try {
        const res = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: authHeader,
            body: formData
        });
        if (res.ok) {
            alert("Report submitted!");
            form.reset();
        }
    } catch (err) {
        alert("Submission error.");
    }
});

// Start the process
document.addEventListener('DOMContentLoaded', () => {
    initAppMap();
    loadIssues();
});