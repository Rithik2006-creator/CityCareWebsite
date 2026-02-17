// const reportbtn=document.querySelector(".report-btn")
// reportbtn.addEventListener("click",()=> {
//     window.location.href = "complaint.html";
// })

const contactbtn = document.querySelector(".btn-secondary");
contactbtn.addEventListener("click", () => {
  window.location.href = "contact.html";
});
closeAll();

// 1. Configuration & Global State
const CONFIG = {
  API_URL: "http://localhost:8080/complaint",
  EMAIL: localStorage.getItem("email"),
  AUTH:
    "Basic " +
    btoa(
      `${localStorage.getItem("email")}:${localStorage.getItem("password")}`,
    ),
};

const State = {
  map: null,
  marker: null,
  selectedAddress: "",
};

// 2. Map Module Logic
const MapModule = {
  init() {
    if (State.map) return;
    State.map = L.map("map").setView([19.18, 73.19], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(State.map);
    // 1. ADD SEARCH CONTROL (Geocoder)
                const geocoder = L.Control.geocoder({
                    defaultMarkGeocode: false, // Don't add a default marker, we handle it
                    placeholder: "Search for address...",
                    errorMessage: "Address not found."
                })
                    .on('markgeocode', function (e) {
                        const latlng = e.geocode.center;
                        State.map.setView(latlng, 16); // Zoom to found location
                        MapModule.updateMarker(latlng.lat, latlng.lng); // Place our custom marker
                    })
                    .addTo(State.map);


    State.map.on("click", (e) => this.updateMarker(e.latlng.lat, e.latlng.lng));
    this.detectLocation();
  },
  detectLocation() {
    const locInput = document.getElementById("location-text");
    locInput.value = "Locating you..."; // Visual feedback

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          State.map.setView([latitude, longitude], 16);
          this.updateMarker(latitude, longitude);
        },
        (error) => {
          console.warn("Location error:", error.message);
          locInput.value = ""; // Clear the "Locating..." text
          alert(
            "Could not determine location automatically. Please click on the map.",
          );
          State.map.setView([19.18, 73.19], 13);
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    }
  },
  async updateMarker(lat, lng) {
    State.currentLat = lat;
    State.currentLng = lng;
    document.getElementById("lat").value = lat;
    document.getElementById("lng").value = lng;

    if (!State.marker) {
      State.marker = L.marker([lat, lng], { draggable: true }).addTo(State.map);
      State.marker.on("dragend", () => {
        const pos = State.marker.getLatLng();
        this.updateMarker(pos.lat, pos.lng);
      });
    } else {
      State.marker.setLatLng([lat, lng]);
    }

    // Reverse Geocoding
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      );
      const data = await res.json();
      State.selectedAddress = data.display_name || "Selected Location";
      State.marker
        .bindPopup(`<b>Location:</b><br>${State.selectedAddress}`)
        .openPopup();
    } catch (err) {
      State.selectedAddress =
        "Coordinates: " + lat.toFixed(4) + ", " + lng.toFixed(4);
    }
  },
};

// 3. UI Handlers
function closeAll() {
  document.querySelector(".submit-container").style.display = "none";
  document.getElementById("mapModal").style.display = "none";
  document.body.style.overflow = "auto";
}
document.getElementById("closeForm").onclick = closeAll;
document.querySelector(".close-modal").onclick = closeAll;
document.querySelector(".report-btn").onclick = () => {
  document.querySelector(".submit-container").style.display = "flex";
  document.body.style.overflow = "hidden";
};

document.querySelector(".gps-btn").onclick = () => {
  document.getElementById("mapModal").style.display = "block";
  MapModule.init();
  if (State.map) MapModule.detectLocation();
  setTimeout(() => State.map.invalidateSize(), 300);
};

document.getElementById("confirmLocation").onclick = () => {
  if (State.selectedAddress) {
    document.getElementById("location-text").value = State.selectedAddress;
    document.getElementById("mapModal").style.display = "none";
  } else {
    alert("Please click on the map to select a location.");
  }
};

// Image Preview Handler
document.getElementById('file-upload').onchange = function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    // Update the preview image
                    document.getElementById('imagePreview').src = event.target.result;

                    // Show the preview card and set the text
                    document.getElementById('preview-wrapper').style.display = 'block';
                    document.getElementById('file-info').innerText = "Selected: " + file.name;

                    // Optional: Hide the upload box to save space like some apps do
                    // document.getElementById('dropzone').style.display = 'none'; 
                };
                reader.readAsDataURL(file);
            }
        };

// 4. Form Submission Logic
document.getElementById("complaintForm").onsubmit = async (e) => {
  e.preventDefault();

  const btn = e.target.querySelector(".submit-btn");
  const originalText = btn.innerText;

  // Check for Location
  if (!document.getElementById("lat").value) {
    alert("Please use the GPS tool to select a location.");
    return;
  }

  btn.innerText = "Processing...";
  btn.disabled = true;

  const form = e.target;
  const complaintData = {
    title: form.elements["title"].value,
    category: form.elements["category"].value,
    location: document.getElementById("location-text").value,
    description: form.elements["description"].value,
    latitude: document.getElementById("lat").value,
    longitude: document.getElementById("lng").value,
    userName: CONFIG.EMAIL,
  };

  const formData = new FormData();
  formData.append(
    "accept",
    new Blob([JSON.stringify(complaintData)], { type: "application/json" }),
  );

  const fileInput = document.getElementById("file-upload");
  if (fileInput.files[0]) {
    formData.append("image", fileInput.files[0]);
  }

  try {
    const response = await fetch(`${CONFIG.API_URL}/register`, {
      method: "POST",
      headers: {
       
      },
      body: formData,
    });

    if (response.ok) {
      alert("Complaint registered successfully!");
      location.reload(); // Refresh to clear state
    } else {
      const errorMsg = await response.text();
      alert("Submission failed: " + errorMsg);
    }
  } catch (err) {
    alert("Network error. Please ensure the backend is running.");
  } finally {
    btn.innerText = originalText;
    btn.disabled = false;
  }
};
