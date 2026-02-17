/**
 * CITYCARE - Community Reports Module
 * Restructured & Fully Functional
 */

// Global State Management
const State = {
  allReports: [],
  map: null,
  marker: null,
  selectedAddress: null,
  API_URL: "https://nonendurable-russel-cachectical.ngrok-free.dev/complaint",
  FALLBACK_IMG:
    "https://placehold.jp/24/3498db/ffffff/320x200.png?text=No+Image+Available",
  AUTH_HEADER:
    "Basic " +
    btoa(
      `${localStorage.getItem("email")}:${localStorage.getItem("password")}`,
    ),
};

// --- 1. DATA SERVICES ---
const ReportService = {
  async fetchReports() {
    const response = await fetch(
      `${State.API_URL}/getComplaints/${localStorage.getItem("email")}`,
      {
        method: "GET",
        headers: {
          "ngrok-skip-browser-warning": true,
          Authorization: State.AUTH_HEADER,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) throw new Error("Fetch failed");
    return await response.json();
  },

  async submitReport(formData) {
    const response = await fetch(`${State.API_URL}/register`, {
      method: "POST",
      headers: {
        Authorization: State.AUTH_HEADER,
      },
      body: formData,
    });
    if (!response.ok) throw new Error("Submission failed");
    return response;
  },
};

// --- 2. UI RENDERERS ---
const UIRenderer = {
  getCategoryIcon(cat) {
    const c = cat?.toLowerCase() || "";
    if (c.includes("garbage")) return '<i class="fas fa-trash"></i>';
    if (c.includes("light") || c.includes("electricity"))
      return '<i class="fas fa-lightbulb"></i>';
    if (c.includes("road") || c.includes("pothole"))
      return '<i class="fas fa-road"></i>';
    if (c.includes("water") || c.includes("leakage"))
      return '<i class="fa-solid fa-droplet"></i>';
    return '<i class="fas fa-info-circle"></i>';
  },

  renderReports(reports) {
    console.log(reports);
    const grid = document.getElementById("reportsGrid");
    grid.innerHTML = "";

    if (reports.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column: 1/-1; text-align:center; padding: 2rem;">
                <i class="fas fa-folder-open" style="font-size: 3rem; color: #ccc;"></i>
                <p>No reports found.</p>
            </div>`;
      return;
    }

    reports.forEach((report) => {
      const imageSrc = this.processImageData(report);
      const card = document.createElement("div");
      card.className = "report-card";
      card.innerHTML = `
                <div class="report-image">
                    <img src="${imageSrc}" alt="${report.title}" onerror="this.src='${State.FALLBACK_IMG}';">
                </div>
                <div class="report-details">
                    <h3>${report.title || "Untitled"}</h3>
                    <div class="status-row" style="margin-bottom: 10px;">
                        <span class="status-badge ${(report.status || "pending").toLowerCase()}">
                            Status: ${report.status || "Pending"}
                        </span>
                    </div>
                    <span class="category">${this.getCategoryIcon(report.category)} ${report.category || "General"}</span>
                    <p><i class="fas fa-map-marker-alt"></i> ${report.locationDetails || report.location || "Location missing"}</p>
                    <div class="report-meta">
                        <span><i class="fas fa-calendar"></i> ${report.complaintDate}</span>
                        <button class="view-btn" onclick="UIEvents.openViewModal('${report.id}')">View Details</button>
                    </div>
                </div>`;
      grid.appendChild(card);
    });
  },

  processImageData(report) {
    if (report.imageData) {
      return report.imageData.startsWith("data:image")
        ? report.imageData
        : "data:image/png;base64," + report.imageData;
    }
    return report.img || State.FALLBACK_IMG;
  },
};

// --- 3. EVENT HANDLERS ---
const UIEvents = {
  init() {
    this.bindGlobalTriggers();
    this.bindFilters();
    this.bindForm();
    this.bindSearch();
    this.bindImagePreview();
    this.loadData();
  },

  bindGlobalTriggers() {
    // Open main report form
    const openBtn = document.getElementById("openFormBtn");
    if (openBtn) {
      openBtn.onclick = () => {
        document.getElementById("formModal").style.display = "block";
      };
    }

    // Open map from the form
    const gpsBtn = document.querySelector(".gps-btn");
    if (gpsBtn) {
      gpsBtn.onclick = () => {
        document.getElementById("mapModal").style.display = "block";
        MapModule.init();
        MapModule.detectLocation();
        setTimeout(() => State.map.invalidateSize(), 200);
      };
    }

    // Confirm map location
    const confirmLocBtn = document.getElementById("confirmLocationBtn");
    if (confirmLocBtn) {
      confirmLocBtn.onclick = () => {
        if (State.selectedAddress) {
          document.getElementById("formLocation").value = State.selectedAddress;
          document.getElementById("mapModal").style.display = "none";
        }
      };
    }

    // Close map specific button
    const closeMapBtn = document.getElementById("closeMapBtn");
    if (closeMapBtn) {
      closeMapBtn.onclick = () => {
        document.getElementById("mapModal").style.display = "none";
      };
    }
  },

  async loadData() {
    console.log("hello");
    try {
      State.allReports = await ReportService.fetchReports();
      UIRenderer.renderReports(State.allReports);
      console.log(State.allReports);
    } catch (err) {
      document.getElementById("reportsGrid").innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align:center;">
                    <i class="fas fa-plug" style="font-size: 3rem; color: #e74c3c;"></i>
                    <p>Unable to connect to server.</p>
                    <button class="retry-btn" onclick="location.reload()" style="padding: 10px 20px; cursor:pointer;">Retry</button>
                </div>`;
    }
  },

  bindSearch() {
    const searchInput = document.querySelector(".search-box input");
    if (!searchInput) return;
    searchInput.addEventListener("input", (e) => {
      const term = e.target.value.toLowerCase();
      const filtered = State.allReports.filter(
        (r) =>
          r.title?.toLowerCase().includes(term) ||
          r.location?.toLowerCase().includes(term),
      );
      UIRenderer.renderReports(filtered);
    });
  },

  bindFilters() {
    document.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        document
          .querySelector(".filter-btn.active")
          ?.classList.remove("active");
        this.classList.add("active");
        const status = this.textContent.toLowerCase();
        const filtered =
          status === "all"
            ? State.allReports
            : State.allReports.filter(
                (r) => (r.status || "pending").toLowerCase() === status,
              );
        UIRenderer.renderReports(filtered);
      });
    });
  },

  bindImagePreview() {
    const fileUpload = document.getElementById("file-upload");
    if (fileUpload) {
      fileUpload.addEventListener("change", function (e) {
        const file = e.target.files[0];
        const preview = document.getElementById("imagePreview");
        const info = document.getElementById("file-info");
        const wrapper = document.getElementById("preview-wrapper");

        if (file) {
          info.innerHTML = `Selected: ${file.name}`;
          const reader = new FileReader();
          reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = "block";
            if (wrapper) wrapper.style.display = "block";
          };
          reader.readAsDataURL(file);
        }
      });
    }
  },

  openViewModal(id) {
    const item = State.allReports.find((r) => r.id == id);
    if (!item) return;

    const modalBody = document.getElementById("modalBody");
    const imageSrc = UIRenderer.processImageData(item);

    modalBody.innerHTML = `
            <img src="${imageSrc}" style="width:100%; border-radius:12px; height:250px; object-fit:cover; margin-bottom:1.5rem;" onerror="this.src='${State.FALLBACK_IMG}'">
            <h2>${item.title}</h2>
            <div class="status-row" style="margin-bottom: 15px;">
                <span class="status-badge ${(item.status || "pending").toLowerCase()}">
                    Status: ${item.status || "Pending"}
                </span>
            </div>
            <p style="color:#3498db; font-weight:bold;">${UIRenderer.getCategoryIcon(item.category)} ${item.category}</p>
            <p><i class="fas fa-map-marker-alt"></i> ${item.locationDetails || item.location}</p>
            <hr style="margin:1rem 0; opacity:0.1;">
            <p><strong>Description:</strong><br>${item.description || "No details provided."}</p>`;

    document.getElementById("viewModal").style.display = "block";
  },

  async bindForm() {
    const form = document.getElementById("newReportForm");
    if (!form) return;
    form.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = document.getElementById("submit-btn");
      const originalText = submitBtn.innerText;
      const latitude = document.querySelector("#lat").value;
      const longitude = document.getElementById("lng").value;
      if (!latitude && !longitude) {
        alert("Please confirm the Location..... ");
      }
      submitBtn.disabled = true;
      submitBtn.innerText = "Posting...";

      const complaintData = {
        title: document.getElementById("formTitle").value,
        category: document.getElementById("formCategory").value,
        location: document.getElementById("formLocation").value,
        description: document.getElementById("formDesc").value,
        latitude: latitude, // Added
        longitude: longitude, // Added
        userName: localStorage.getItem("email"),
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
        await ReportService.submitReport(formData);
        alert("Complaint registered successfully!");
        location.reload();
      } catch (error) {
        alert("Error submitting report. Please try again.");
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
      }
    };
  },
};

// --- 4. MAP LOGIC ---
const MapModule = {
  categoryStyles: {
    "Garbage Management": { color: "#e74c3c", icon: "fa-trash" },
    "Streetlight / Electricity": { color: "#f1c40f", icon: "fa-lightbulb" },
    "Roads & Potholes": { color: "#34495e", icon: "fa-road" },
    "Water Leakage": { color: "#3498db", icon: "fa-droplet" },
    other: { color: "#2ecc71", icon: "fa-circle-info" },
  },
  init() {
    if (State.map) return;
    State.map = L.map("map").setView([19.18, 73.19], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      State.map,
    );

    // Add Geocoder
    if (typeof L.Control.Geocoder !== "undefined") {
      const geocoder = L.Control.geocoder({
        defaultMarkGeocode: false,
        placeholder: "Search for address...",
        collapsed: true, // This makes it look like your reference image (icon only)
        showResultIcons: true,
      })
        .on("markgeocode", (e) => {
          const latlng = e.geocode.center;
          State.map.setView(latlng, 16);
          this.updateMarker(latlng.lat, latlng.lng, e.geocode.name);
        })
        .addTo(State.map);
    }

    State.map.on("click", (e) => this.updateMarker(e.latlng.lat, e.latlng.lng));
  },
  detectLocation() {
    const locField = document.getElementById("formLocation");

    if (navigator.geolocation) {
      // Provide immediate visual feedback in the input
      locField.placeholder = "Detecting your location...";

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          this.init(); // Ensure map is ready
          State.map.setView([latitude, longitude], 16);
          this.updateMarker(latitude, longitude);
        },
        (error) => {
          console.warn("Geolocation error:", error.message);
          locField.placeholder =
            "Location access denied. Please pinpoint manually.";
        },
        { enableHighAccuracy: true, timeout: 10000 },
      );
    } else {
      locField.placeholder = "Geolocation not supported by browser.";
    }
  },
  async updateMarker(lat, lng, addressString = null) {
    const categorySelect = document.getElementById("formCategory");
    const selectedCat = categorySelect ? categorySelect.value : "other";
    const style = this.categoryStyles[selectedCat] || {
      color: "#2c3e50",
      icon: "fa-location-dot",
    };
    document.getElementById("lat").value = lat;
    document.getElementById("lng").value = lng;
    const customIcon = L.divIcon({
      className: "custom-pin",
      html: `
                <div style="background-color: ${style.color}; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.4);">
                    <i class="fas ${style.icon}" style="color: white; transform: rotate(45deg); font-size: 14px;"></i>
                </div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 34],
    });
    if (!State.marker) {
      State.marker = L.marker([lat, lng], { draggable: true }).addTo(State.map);
      State.marker.on("dragend", () => {
        const pos = State.marker.getLatLng();
        this.updateMarker(pos.lat, pos.lng);
      });
    } else {
      State.marker.setLatLng([lat, lng]);
      State.marker.setIcon(customIcon);
    }

    State.selectedAddress =
      addressString || (await this.reverseGeocode(lat, lng));
    State.marker
      .bindPopup(`<b>Location:</b><br>${State.selectedAddress}`)
      .openPopup();
  },

  async reverseGeocode(lat, lng) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=en`,
      );
      const data = await res.json();
      return data.display_name || "Unknown Location";
    } catch {
      return "Selected Location";
    }
  },
};

// Initialize App
document.addEventListener("DOMContentLoaded", () => UIEvents.init());

// Global Close Modal function
window.closeModals = () => {
  document.getElementById("viewModal").style.display = "none";
  document.getElementById("formModal").style.display = "none";
};

// Close on outside click
window.onclick = (event) => {
  if (event.target.classList.contains("modal")) closeModals();
};
