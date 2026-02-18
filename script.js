

// 1. Configuration & Global State
const CONFIG = {
  API_URL: "https://nonendurable-russel-cachectical.ngrok-free.dev/complaint",
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
  currentLat: null,
  currentLng: null,
  cameraBlob: null,
  stream: null, // Keep track of the camera stream to stop it
};

// 2. Map Module Logic
const MapModule = {
  init() {
    if (State.map) return;
    State.map = L.map("map").setView([19.18, 73.19], 10);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(State.map);
    // 1. ADD SEARCH CONTROL (Geocoder)
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: false, // Don't add a default marker, we handle it
      placeholder: "Search for address...",
      errorMessage: "Address not found.",
    })
      .on("markgeocode", function (e) {
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
      document.getElementById("location-text").value = State.selectedAddress;
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
  stopCamera();
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
  if (State.selectedAddress && State.currentLat) {
    document.getElementById("location-text").value = State.selectedAddress;
    document.getElementById("lat").value = State.currentLat;
    document.getElementById("lng").value = State.currentLng;
    document.getElementById("mapModal").style.display = "none";
  } else {
    alert("Please wait for location detection or click the map.");
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
  } else if (State.cameraBlob) {
    formData.append("image", State.cameraBlob, "capture.jpg");
  }

  try {
    const response = await fetch(`${CONFIG.API_URL}/register`, {
      method: "POST",
      headers: {
        Authorization: CONFIG.AUTH,
        "ngrok-skip-browser-warning": "true", // Required for ngrok URLs
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

function toggleChat() {
  const cburl =
    "https://rithik2006-creator.github.io/CityCareWebsite/chatbot.html";
  window.open(cburl, "_blank");
  const badge = document.querySelector(".chat-badge");
  if (badge) {
    badge.style.display = "none";
  }
}
function toggle() {
  // Use a relative path (assuming Anouncement.html is in the same folder)
  const cburl = "Anouncement.html";
  window.open(cburl, "_blank");

  const badge = document.querySelector(".announcement-badge");
  if (badge) {
    badge.style.display = "none";
  }
}
// --- User Profile Logic ---

const profileTrigger = document.getElementById("profile-btn");
const profileDropdown = document.getElementById("profileDropdown");

// Toggle Dropdown on click
// Toggle Dropdown on click
profileTrigger.addEventListener("click", (e) => {
  e.stopPropagation();

  const savedName = localStorage.getItem("userName");
  const savedEmail = localStorage.getItem("email");

  document.getElementById("displayUserName").innerText = savedName || "User";
  document.getElementById("displayUserEmail").innerText =
    savedEmail || "Not Logged In";

  profileDropdown.classList.toggle("active");
});

profileDropdown.addEventListener("click", (e) => {
  e.stopPropagation();
});

window.addEventListener("click", () => {
  profileDropdown.classList.remove("active");
});

getCount();
function logout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.clear();

    window.location.href =
      "https://rithik2006-creator.github.io/CityCareWebsite";
  }
}
function getCount() {
  const stat_div = document.getElementById("countStat");

  fetch(
    "https://nonendurable-russel-cachectical.ngrok-free.dev/complaint/getCount",
    {
      headers: {
        "ngrok-skip-browser-warning": true,
      },
    },
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch count data");
      }
      return response.json();
    })
    .then((stats) => {
      stat_div.innerHTML = `
                <div class="stat-card">
                    <h3 id="fixed-count">${stats.issueFixed}</h3>
                    <p>Issues Fixed</p>
                </div>

                <div class="stat-card">
                    <h3 id="active-count">${stats.issueInprogress}</h3>
                    <p>Active Reports</p>
                </div>

                <div class="stat-card">
                    <h3 id="active-count">${stats.issuePending}</h3>
                    <p>Issues Pending</p>
                </div>

                <div class="stat-card">
                    <h3 id="response-time">${stats.totalComplaints}</h3>
                    <p>Total complaints filed</p>
                </div>
            `;
    })
    .catch((err) => {
      console.error(err);
      stat_div.innerHTML = `<p style="color:red">Failed to load statistics</p>`;
    });
}

const fileInput = document.getElementById("file-upload");
const cameraBtn = document.getElementById("start-camera");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const clickBtn = document.getElementById("click-photo");
const previewImg = document.getElementById("imagePreview");
const previewWrapper = document.getElementById("preview-wrapper");
const fileInfo = document.getElementById("file-info");

function stopCamera() {
  if (State.stream) {
    State.stream.getTracks().forEach((track) => track.stop());
    State.stream = null;
  }
  video.srcObject = null;
  video.style.display = "none";
  clickBtn.style.display = "none";
  cameraBtn.style.display = "block";
  cameraBtn.innerText = "Use Live Camera";
  const submitBtn = document.querySelector(".submit-btn");
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerText = "Submit Report";
  }
}
// Helper to show preview
function displayPreview(source, text) {
  // 1. Clean up old memory to prevent leaks
  if (previewImg.src.startsWith("blob:")) {
    URL.revokeObjectURL(previewImg.src);
  }

  // 2. Create a fast temporary URL
  const url =
    source instanceof Blob || source instanceof File
      ? URL.createObjectURL(source)
      : source;

  previewImg.src = url;
  previewWrapper.style.display = "block";
  fileInfo.innerText = text;
}

// 1. Handle Gallery Upload
fileInput.onchange = function (e) {
  const file = e.target.files[0];
  if (file) {
    State.cameraBlob = null; // Clear previous camera capture
    stopCamera(); // Shut down camera if it was open
    displayPreview(file, "Selected: " + file.name);
  }
};
cameraBtn.addEventListener("click", async function () {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" },
      audio: false,
    });
    State.stream = stream;
    video.srcObject = stream;

    video.style.display = "block";
    clickBtn.style.display = "block";
    cameraBtn.style.display = "none";
    previewWrapper.style.display = "none";
  } catch (err) {
    console.error("Camera Error:", err);
    alert(
      "Camera access denied. Please ensure you are using HTTPS or localhost.",
    );
  }
});

clickBtn.onclick = function () {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext("2d").drawImage(video, 0, 0);

  canvas.toBlob(
    (blob) => {
      State.cameraBlob = blob; // Store camera image
      fileInput.value = ""; // Clear file upload input
      displayPreview(blob, "Captured from Camera");
    },
    "image/jpeg",
    0.8,
  );

  stopCamera(); // Shutdown camera after snapping
};
window.onclick = function (event) {
  const submitContainer = document.querySelector(".submit-container");
  const mapModal = document.getElementById("mapModal");

  // If user clicks the dark overlay of the form or map
  if (event.target === submitContainer || event.target === mapModal) {
    closeAll();
  }
};
closeAll();