/*
  GeoQuest gameplay script
  - Street viewer is Google Street View embed.
  - Guess map is Leaflet + OpenStreetMap tiles.
  - Add Google API key in API_CONFIG.googleMapsApiKey to use strict
    "official + recent" Street View filtering with metadata checks.
  - You can also pass the key as:
    1) window.LOGISCHOOL_GOOGLE_MAPS_API_KEY
    2) ?gkey=YOUR_KEY in the page URL
*/

const API_CONFIG = {
  // Used for interactive Street View embed API (optional).
  googleMapsApiKey: "",
  // Used for Street View metadata verification.
  streetViewMetadataApiKey: "",
  // Public key used by Google's own no-key embed bootstrap.
  // If this key rotates, set your own key in streetViewMetadataApiKey.
  fallbackMetadataApiKey: "AIzaSyCmL18misQw9KdwqGaw3zHkitj8vG6QF2Y",
};

const runtimeApiKey =
  (typeof window !== "undefined" && window.LOGISCHOOL_GOOGLE_MAPS_API_KEY) ||
  new URLSearchParams(window.location.search).get("gkey") ||
  "";

if (!API_CONFIG.googleMapsApiKey && runtimeApiKey) {
  API_CONFIG.googleMapsApiKey = String(runtimeApiKey).trim();
}

const runtimeMetadataKey =
  (typeof window !== "undefined" && window.LOGISCHOOL_METADATA_API_KEY) ||
  new URLSearchParams(window.location.search).get("mkey") ||
  "";

if (!API_CONFIG.streetViewMetadataApiKey && runtimeMetadataKey) {
  API_CONFIG.streetViewMetadataApiKey = String(runtimeMetadataKey).trim();
}

const IMAGERY_RULES = {
  requireOfficialGoogleImagery: true,
  // Blocks very old captures (for example 2009-era imagery).
  minCaptureYear: 2019,
  // Secondary fallback pass if strict filtering cannot find enough rounds.
  relaxedMinCaptureYear: 2015,
  requireKnownCaptureDate: true,
  metadataProbeRadiusMeters: 140,
};

const GAME_CONFIG = {
  rounds: 5,
  roundTimeSeconds: 100,
  highScoreStorageKey: "geoquestHighScore",
  mapStartCenter: [20, 0],
  mapStartZoom: 2,
  maxRoundLocationAttempts: 30,
};

const metadataCache = new Map();

const EASY_LOCATIONS = [
  { name: "Monument Valley Road", country: "United States", lat: 36.9981, lng: -110.0987, heading: 114 },
  { name: "Blue Ridge Parkway", country: "United States", lat: 35.6074, lng: -82.2086, heading: 14 },
  { name: "Pacific Coast Highway", country: "United States", lat: 36.5552, lng: -121.9233, heading: 305 },
  { name: "Icefields Parkway", country: "Canada", lat: 52.2104, lng: -117.2237, heading: 334 },
  { name: "Cabot Trail", country: "Canada", lat: 46.8712, lng: -60.4569, heading: 122 },
  { name: "Ring Road South", country: "Iceland", lat: 63.5308, lng: -19.5112, heading: 96 },
  { name: "Scottish Highlands", country: "United Kingdom", lat: 57.2397, lng: -5.5113, heading: 82 },
  { name: "Atlantic Ocean Road", country: "Norway", lat: 63.0154, lng: 7.3544, heading: 130 },
  { name: "Furka Pass", country: "Switzerland", lat: 46.5733, lng: 8.4157, heading: 86 },
  { name: "Grossglockner Road", country: "Austria", lat: 47.0701, lng: 12.8436, heading: 15 },
  { name: "Douro Valley Road", country: "Portugal", lat: 41.1756, lng: -7.7928, heading: 268 },
  { name: "Wild Atlantic Way", country: "Ireland", lat: 53.4692, lng: -9.7425, heading: 62 },
  { name: "Sierra Nevada Road", country: "Spain", lat: 37.0954, lng: -3.3975, heading: 215 },
  { name: "Great Ocean Road", country: "Australia", lat: -38.6792, lng: 143.3912, heading: 43 },
  { name: "Milford Road", country: "New Zealand", lat: -44.7608, lng: 167.9072, heading: 350 },
  { name: "Garden Route", country: "South Africa", lat: -34.0505, lng: 22.1476, heading: 112 },
  { name: "R81 Limpopo", country: "South Africa", lat: -23.93, lng: 29.8461, heading: 80 },
  { name: "Atacama Road", country: "Chile", lat: -22.4622, lng: -70.211, heading: 165 },
  { name: "Ruta 40 Patagonia", country: "Argentina", lat: -50.3375, lng: -72.2641, heading: 190 },
  { name: "Hokkaido Rural Route", country: "Japan", lat: 43.3906, lng: 142.4832, heading: 260 },
  { name: "Utah Desert Route", country: "United States", lat: 38.5733, lng: -109.5498, heading: 92 },
  { name: "Nevada Highway", country: "United States", lat: 37.7938, lng: -116.7648, heading: 16 },
  { name: "Slovenian Alps Road", country: "Slovenia", lat: 46.4299, lng: 13.7594, heading: 203 },
  { name: "Dolomites Road", country: "Italy", lat: 46.5083, lng: 12.0404, heading: 44 },
  { name: "Finnish Lakes Road", country: "Finland", lat: 61.8075, lng: 25.8041, heading: 152 },
];

const HARD_LOCATIONS = [
  ...EASY_LOCATIONS,
  { name: "Alaska Scenic Byway", country: "United States", lat: 61.1306, lng: -149.8593, heading: 224 },
  { name: "Yellowstone Valley Road", country: "United States", lat: 44.4605, lng: -110.8281, heading: 40 },
  { name: "Oregon Cascade Route", country: "United States", lat: 44.0582, lng: -121.3153, heading: 178 },
  { name: "Arizona Canyon Road", country: "United States", lat: 36.0566, lng: -112.1251, heading: 265 },
  { name: "Colorado Foothills Route", country: "United States", lat: 39.7392, lng: -105.2211, heading: 120 },
  { name: "Washington Rainforest Road", country: "United States", lat: 47.9133, lng: -123.6918, heading: 88 },
  { name: "Montana Big Sky Route", country: "United States", lat: 45.2571, lng: -111.3082, heading: 33 },
  { name: "Ontario Shield Highway", country: "Canada", lat: 45.1188, lng: -79.5909, heading: 76 },
  { name: "Quebec Laurentides Route", country: "Canada", lat: 46.2672, lng: -74.1006, heading: 205 },
  { name: "British Columbia Canyon Road", country: "Canada", lat: 49.6728, lng: -121.9356, heading: 290 },
  { name: "Alberta Mountain Route", country: "Canada", lat: 51.1784, lng: -115.5708, heading: 48 },
  { name: "Baja Desert Road", country: "Mexico", lat: 30.8476, lng: -115.2838, heading: 140 },
  { name: "Yucatan Coastal Road", country: "Mexico", lat: 21.1778, lng: -89.667, heading: 332 },
  { name: "Oaxaca Mountain Route", country: "Mexico", lat: 17.0722, lng: -96.7266, heading: 214 },
  { name: "Andes Valley Road", country: "Peru", lat: -13.3151, lng: -72.1174, heading: 96 },
  { name: "Colombian Highlands Road", country: "Colombia", lat: 4.7171, lng: -74.0308, heading: 18 },
  { name: "Uruguay Coastal Road", country: "Uruguay", lat: -34.7561, lng: -55.9134, heading: 155 },
  { name: "Southern Brazil Coastal Route", country: "Brazil", lat: -27.6038, lng: -48.5459, heading: 130 },
  { name: "Chilean Lake District Road", country: "Chile", lat: -41.4693, lng: -72.9424, heading: 77 },
  { name: "Patagonia Steppe Road", country: "Argentina", lat: -46.5884, lng: -71.6999, heading: 220 },
  { name: "Drakensberg Pass", country: "South Africa", lat: -29.2523, lng: 29.8976, heading: 312 },
  { name: "Karoo Route", country: "South Africa", lat: -31.3563, lng: 23.0558, heading: 104 },
  { name: "Cape Winelands Road", country: "South Africa", lat: -33.934, lng: 18.8668, heading: 55 },
  { name: "Iceland North Ring", country: "Iceland", lat: 65.6835, lng: -18.0919, heading: 273 },
  { name: "Iceland West Fjord Approach", country: "Iceland", lat: 65.9903, lng: -22.5632, heading: 145 },
  { name: "Norway Trollstigen Approach", country: "Norway", lat: 62.4547, lng: 7.6673, heading: 359 },
  { name: "Lofoten Coastal Road", country: "Norway", lat: 68.1885, lng: 13.8014, heading: 66 },
  { name: "Sweden Inland Route", country: "Sweden", lat: 63.8258, lng: 20.263, heading: 184 },
  { name: "Denmark Jutland Road", country: "Denmark", lat: 56.1824, lng: 10.1119, heading: 244 },
  { name: "Scottish Cairngorm Road", country: "United Kingdom", lat: 57.0987, lng: -3.6308, heading: 119 },
  { name: "Welsh Mountain Road", country: "United Kingdom", lat: 52.9442, lng: -3.8193, heading: 41 },
  { name: "Irish West Coast Route", country: "Ireland", lat: 53.2244, lng: -9.4054, heading: 285 },
  { name: "French Alps Route", country: "France", lat: 45.2306, lng: 6.9023, heading: 12 },
  { name: "French Pyrenees Road", country: "France", lat: 42.9367, lng: 0.1431, heading: 198 },
  { name: "Spanish Pyrenees Route", country: "Spain", lat: 42.5839, lng: 0.5421, heading: 31 },
  { name: "Spanish Meseta Road", country: "Spain", lat: 40.2982, lng: -4.3842, heading: 257 },
  { name: "Portuguese Interior Road", country: "Portugal", lat: 39.5384, lng: -8.0436, heading: 132 },
  { name: "German Alpine Road", country: "Germany", lat: 47.6954, lng: 10.6405, heading: 78 },
  { name: "German Forest Route", country: "Germany", lat: 48.3076, lng: 8.2082, heading: 208 },
  { name: "Austrian Tirol Route", country: "Austria", lat: 47.3416, lng: 11.1891, heading: 352 },
  { name: "Swiss Pass Route", country: "Switzerland", lat: 46.6131, lng: 8.004, heading: 161 },
  { name: "Slovenian Karst Road", country: "Slovenia", lat: 45.7594, lng: 13.8695, heading: 248 },
  { name: "Croatian Adriatic Road", country: "Croatia", lat: 44.8867, lng: 15.6167, heading: 97 },
  { name: "Greek Peloponnese Road", country: "Greece", lat: 37.5635, lng: 22.7939, heading: 338 },
  { name: "Turkish Cappadocia Route", country: "Turkey", lat: 38.6431, lng: 34.8275, heading: 125 },
  { name: "Polish Carpathian Road", country: "Poland", lat: 49.5616, lng: 20.6341, heading: 69 },
  { name: "Czech Highland Route", country: "Czechia", lat: 50.2285, lng: 15.832, heading: 230 },
  { name: "Finnish North Forest Road", country: "Finland", lat: 66.563, lng: 25.8304, heading: 300 },
  { name: "Australian Outback Road", country: "Australia", lat: -23.6992, lng: 133.8807, heading: 75 },
  { name: "Tasmania Highland Road", country: "Australia", lat: -42.154, lng: 146.315, heading: 186 },
  { name: "New Zealand Alpine Route", country: "New Zealand", lat: -43.4979, lng: 170.0088, heading: 295 },
  { name: "New Zealand Volcanic Plateau", country: "New Zealand", lat: -39.2084, lng: 175.54, heading: 58 },
  { name: "Japan Tohoku Rural Road", country: "Japan", lat: 39.701, lng: 141.1543, heading: 142 },
  { name: "Japan Kyushu Coastal Route", country: "Japan", lat: 32.7503, lng: 130.7417, heading: 315 },
  { name: "South Korea Taebaek Road", country: "South Korea", lat: 37.4563, lng: 128.6816, heading: 104 },
  { name: "Taiwan Mountain Route", country: "Taiwan", lat: 24.1899, lng: 121.4933, heading: 333 },
  { name: "Taiwan South Ridge Road", country: "Taiwan", lat: 23.7997, lng: 120.9707, heading: 147 },
];

const dom = {
  difficultySelect: document.getElementById("difficultySelect"),
  newGameBtn: document.getElementById("newGameBtn"),
  submitGuessBtn: document.getElementById("submitGuessBtn"),
  returnStartBtn: document.getElementById("returnStartBtn"),
  roundLabel: document.getElementById("roundLabel"),
  timerLabel: document.getElementById("timerLabel"),
  totalScoreLabel: document.getElementById("totalScoreLabel"),
  highScoreLabel: document.getElementById("highScoreLabel"),
  statusText: document.getElementById("statusText"),
  lastDistanceLabel: document.getElementById("lastDistanceLabel"),
  lastRoundScoreLabel: document.getElementById("lastRoundScoreLabel"),
  streetViewFrame: document.getElementById("streetViewFrame"),
  roundModal: document.getElementById("roundModal"),
  roundResultTitle: document.getElementById("roundResultTitle"),
  distanceValue: document.getElementById("distanceValue"),
  roundScoreValue: document.getElementById("roundScoreValue"),
  runningTotalValue: document.getElementById("runningTotalValue"),
  nextRoundBtn: document.getElementById("nextRoundBtn"),
  finalScreen: document.getElementById("finalScreen"),
  finalDifficulty: document.getElementById("finalDifficulty"),
  finalScoreValue: document.getElementById("finalScoreValue"),
  bestScoreValue: document.getElementById("bestScoreValue"),
  roundBreakdown: document.getElementById("roundBreakdown"),
  restartBtn: document.getElementById("restartBtn"),
  roundTransition: document.getElementById("roundTransition"),
  transitionText: document.getElementById("transitionText"),
};

const state = {
  difficulty: dom.difficultySelect.value,
  roundIndex: 0,
  totalScore: 0,
  highScore: Number(localStorage.getItem(GAME_CONFIG.highScoreStorageKey) || 0),
  activeLocations: [],
  currentLocation: null,
  currentStreetUrl: "",
  guessLatLng: null,
  roundHistory: [],
  map: null,
  guessMarker: null,
  actualMarker: null,
  connectorLine: null,
  timerId: null,
  secondsLeft: GAME_CONFIG.roundTimeSeconds,
  isRoundActive: false,
  usedBaseLocationIds: new Set(),
};

// Initialize the world map used for player guesses.
function initializeMap() {
  state.map = L.map("map", {
    worldCopyJump: true,
    zoomSnap: 0.25,
    minZoom: 1.5,
  }).setView(GAME_CONFIG.mapStartCenter, GAME_CONFIG.mapStartZoom);

  // No-label tiles reduce location text hints on the side minimap.
  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
    maxZoom: 20,
    subdomains: "abcd",
    attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
  }).addTo(state.map);

  state.map.on("click", (event) => {
    if (!state.isRoundActive) {
      return;
    }

    state.guessLatLng = event.latlng;

    if (!state.guessMarker) {
      state.guessMarker = L.circleMarker(event.latlng, {
        radius: 8,
        color: "#ffffff",
        weight: 2,
        fillColor: "#2b78ff",
        fillOpacity: 1,
      }).addTo(state.map);
    } else {
      state.guessMarker.setLatLng(event.latlng);
    }

    dom.submitGuessBtn.disabled = false;
    dom.statusText.textContent = "Guess placed. Press Make Guess.";
  });
}

function withNoCache(url) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}nocache=${Date.now()}`;
}

// Build Google Street View URL. Uses API key endpoint when key exists.
function getStreetViewUrl(location) {
  const fov = Number(location.fov || 80);
  const embedApiKey = getEmbedApiKey();

  if (embedApiKey) {
    const params = new URLSearchParams({
      key: embedApiKey,
      source: "outdoor",
      pitch: "0",
      fov: String(fov),
    });

    if (location.pano) {
      params.set("pano", location.pano);
      // Fallback if pano id expires.
      params.set("location", `${location.lat},${location.lng}`);
    } else {
      params.set("location", `${location.lat},${location.lng}`);
    }

    if (Number.isFinite(location.heading)) {
      params.set("heading", String(location.heading));
    }

    return `https://www.google.com/maps/embed/v1/streetview?${params.toString()}`;
  }

  // No-key fallback: lock to panoid if available.
  const heading = Number.isFinite(location.heading) ? location.heading : 0;
  if (location.pano) {
    return `https://maps.google.com/maps?q=&layer=c&panoid=${encodeURIComponent(location.pano)}&cbp=11,${heading},0,0,0&output=svembed`;
  }

  // Final fallback for legacy coords without pano id.
  return `https://maps.google.com/maps?q=&layer=c&cbll=${location.lat},${location.lng}&cbp=11,${heading},0,0,0&output=svembed`;
}

function loadStreetView(location) {
  state.currentStreetUrl = getStreetViewUrl(location);
  dom.streetViewFrame.src = withNoCache(state.currentStreetUrl);
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickRoundLocations(difficulty) {
  const pool = difficulty === "easy" ? EASY_LOCATIONS : HARD_LOCATIONS;
  return shuffleArray(pool);
}

function randomHeading() {
  return Math.floor(Math.random() * 360);
}

function locationId(location) {
  return `${Number(location.lat).toFixed(6)},${Number(location.lng).toFixed(6)}`;
}

function getEmbedApiKey() {
  return API_CONFIG.googleMapsApiKey.trim();
}

function getMetadataApiKey() {
  return (
    API_CONFIG.streetViewMetadataApiKey.trim() ||
    getEmbedApiKey() ||
    API_CONFIG.fallbackMetadataApiKey.trim()
  );
}

function hasMetadataApiKey() {
  return Boolean(getMetadataApiKey());
}

// Hard mode randomizes heading and FOV, but keeps exact coordinates to avoid invalid panos.
function buildRoundLocation(baseLocation, difficulty) {
  const location = { ...baseLocation };

  if (difficulty === "hard") {
    location.fov = 72 + Math.floor(Math.random() * 13);
    location.heading = randomHeading();
  } else {
    location.fov = 82;
    location.heading = Number.isFinite(baseLocation.heading) ? baseLocation.heading : randomHeading();
  }

  location.lat = Number(location.lat.toFixed(6));
  location.lng = Number(location.lng.toFixed(6));
  return location;
}

function parseCaptureDate(imageDate) {
  if (!imageDate || typeof imageDate !== "string") {
    return null;
  }

  const match = imageDate.match(/^(\d{4})(?:-(\d{2}))?$/);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = match[2] ? Number.parseInt(match[2], 10) : 12;
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return null;
  }

  return {
    year,
    month,
    rank: year * 12 + month,
  };
}

function buildMetadataProbePoints(location) {
  const radius = IMAGERY_RULES.metadataProbeRadiusMeters;
  const latStep = radius / 111320;
  const lngStep =
    radius /
    (111320 * Math.max(0.25, Math.cos((Number(location.lat) * Math.PI) / 180)));

  const points = [
    { lat: location.lat, lng: location.lng },
    { lat: location.lat + latStep, lng: location.lng },
    { lat: location.lat - latStep, lng: location.lng },
    { lat: location.lat, lng: location.lng + lngStep },
    { lat: location.lat, lng: location.lng - lngStep },
    { lat: location.lat + latStep, lng: location.lng + lngStep },
    { lat: location.lat + latStep, lng: location.lng - lngStep },
    { lat: location.lat - latStep, lng: location.lng + lngStep },
    { lat: location.lat - latStep, lng: location.lng - lngStep },
  ];

  return shuffleArray(
    points.map((point) => ({
      lat: Number(point.lat.toFixed(6)),
      lng: Number(point.lng.toFixed(6)),
    }))
  );
}

async function fetchStreetViewMetadata(lat, lng) {
  const key = getMetadataApiKey();
  if (!key) {
    return null;
  }

  const cacheKey = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  if (metadataCache.has(cacheKey)) {
    return metadataCache.get(cacheKey);
  }

  const params = new URLSearchParams({
    key,
    location: `${lat},${lng}`,
    source: "outdoor",
    radius: "80",
  });

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/streetview/metadata?${params.toString()}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return null;
  }

  const metadata = await response.json();
  metadataCache.set(cacheKey, metadata);
  return metadata;
}

function metadataToCandidate(metadata, fallbackLocation, rules) {
  if (!metadata || metadata.status !== "OK") {
    return null;
  }

  if (
    IMAGERY_RULES.requireOfficialGoogleImagery &&
    (typeof metadata.copyright !== "string" ||
      !metadata.copyright.toLowerCase().includes("google"))
  ) {
    return null;
  }

  const parsedDate = parseCaptureDate(metadata.date);
  if (rules.requireKnownCaptureDate && !parsedDate) {
    return null;
  }

  if (parsedDate && parsedDate.year < rules.minCaptureYear) {
    return null;
  }

  const lat = Number((metadata.location?.lat ?? fallbackLocation.lat).toFixed(6));
  const lng = Number((metadata.location?.lng ?? fallbackLocation.lng).toFixed(6));
  const offsetPenalty = Math.abs(lat - fallbackLocation.lat) + Math.abs(lng - fallbackLocation.lng);

  return {
    lat,
    lng,
    pano: metadata.pano_id || fallbackLocation.pano,
    imageDate: metadata.date || "",
    rank: (parsedDate ? parsedDate.rank : rules.minCaptureYear * 12 - 1) * 10000 - offsetPenalty,
  };
}

async function resolveStreetViewMetadata(location, rules) {
  const key = getMetadataApiKey();
  if (!key) {
    return { ok: true, location };
  }

  const probePoints = buildMetadataProbePoints(location);
  const seenPanos = new Set();
  let bestCandidate = null;

  for (const probe of probePoints) {
    try {
      const metadata = await fetchStreetViewMetadata(probe.lat, probe.lng);
      const candidate = metadataToCandidate(metadata, location, rules);
      if (!candidate) {
        continue;
      }

      if (candidate.pano && seenPanos.has(candidate.pano)) {
        continue;
      }

      if (candidate.pano) {
        seenPanos.add(candidate.pano);
      }

      if (!bestCandidate || candidate.rank > bestCandidate.rank) {
        bestCandidate = candidate;
      }
    } catch (_error) {
      // Ignore single probe errors and continue scanning nearby road panos.
    }
  }

  if (!bestCandidate) {
    return { ok: false };
  }

  return {
    ok: true,
    location: {
      ...location,
      lat: bestCandidate.lat,
      lng: bestCandidate.lng,
      pano: bestCandidate.pano,
      imageDate: bestCandidate.imageDate,
    },
  };
}

async function pickValidatedLocation(remainingLocations, validationRules) {
  const attempts = Math.min(GAME_CONFIG.maxRoundLocationAttempts, remainingLocations.length);
  const candidates = shuffleArray(remainingLocations).slice(0, attempts);

  for (const baseLocation of candidates) {
    const roundLocation = buildRoundLocation(baseLocation, state.difficulty);
    const metadataResult = await resolveStreetViewMetadata(roundLocation, validationRules);
    if (metadataResult.ok) {
      state.usedBaseLocationIds.add(locationId(baseLocation));
      return metadataResult.location;
    }
  }

  return null;
}

async function choosePlayableLocation() {
  const pool = state.activeLocations;
  if (!pool.length) {
    return null;
  }

  const remaining = pool.filter((loc) => !state.usedBaseLocationIds.has(locationId(loc)));
  if (!remaining.length) {
    return null;
  }

  if (hasMetadataApiKey()) {
    const strictLocation = await pickValidatedLocation(remaining, {
      minCaptureYear: IMAGERY_RULES.minCaptureYear,
      requireKnownCaptureDate: IMAGERY_RULES.requireKnownCaptureDate,
    });
    if (strictLocation) {
      return strictLocation;
    }

    const relaxedLocation = await pickValidatedLocation(remaining, {
      minCaptureYear: IMAGERY_RULES.relaxedMinCaptureYear,
      requireKnownCaptureDate: false,
    });
    if (relaxedLocation) {
      return relaxedLocation;
    }
  }

  // Last-resort fallback: keep game playable if metadata checks fail.
  const fallbackBase = remaining[Math.floor(Math.random() * remaining.length)];
  state.usedBaseLocationIds.add(locationId(fallbackBase));
  return buildRoundLocation(fallbackBase, state.difficulty);
}

function startNewGame() {
  clearRoundVisuals();
  clearTimer();

  state.difficulty = dom.difficultySelect.value;
  state.roundIndex = 0;
  state.totalScore = 0;
  state.roundHistory = [];
  state.activeLocations = pickRoundLocations(state.difficulty);
  state.currentLocation = null;
  state.currentStreetUrl = "";
  state.guessLatLng = null;
  state.isRoundActive = false;
  state.usedBaseLocationIds = new Set();

  dom.totalScoreLabel.textContent = "0";
  dom.lastRoundScoreLabel.textContent = "0";
  dom.lastDistanceLabel.textContent = "-";
  dom.roundLabel.textContent = `1 / ${GAME_CONFIG.rounds}`;
  dom.finalScreen.classList.remove("active");
  dom.finalScreen.style.pointerEvents = "none";
  dom.roundModal.classList.remove("active");
  dom.roundModal.style.pointerEvents = "none";
  dom.submitGuessBtn.disabled = true;
  dom.statusText.textContent = "Get ready...";

  state.map.setView(GAME_CONFIG.mapStartCenter, GAME_CONFIG.mapStartZoom, {
    animate: false,
  });
  state.map.invalidateSize();

  showRoundTransition("Round 1", () => {
    beginRound();
  });
}

async function beginRound() {
  clearRoundVisuals();
  state.isRoundActive = false;
  state.guessLatLng = null;

  dom.submitGuessBtn.disabled = true;
  dom.roundLabel.textContent = `${state.roundIndex + 1} / ${GAME_CONFIG.rounds}`;
  dom.statusText.textContent = "Loading Street View location...";

  const location = await choosePlayableLocation();
  if (!location) {
    dom.statusText.textContent = hasMetadataApiKey()
      ? "No verified Street View road found. Press New Game to retry."
      : "No road location found. Add a Google API key for stricter Street View checks.";
    return;
  }

  state.currentLocation = location;
  state.isRoundActive = true;

  if (location.imageDate) {
    dom.statusText.textContent = `Street View loaded (${location.imageDate}). Place your marker.`;
  } else {
    dom.statusText.textContent =
      state.difficulty === "hard"
        ? "Hard mode: random worldwide road spot. Place your marker."
        : "Place your marker on the mini map.";
  }

  loadStreetView(state.currentLocation);

  state.map.setView(GAME_CONFIG.mapStartCenter, GAME_CONFIG.mapStartZoom);
  setTimeout(() => state.map.invalidateSize(), 30);
  startTimer();
}

function clearRoundVisuals() {
  if (state.guessMarker) {
    state.map.removeLayer(state.guessMarker);
    state.guessMarker = null;
  }

  if (state.actualMarker) {
    state.map.removeLayer(state.actualMarker);
    state.actualMarker = null;
  }

  if (state.connectorLine) {
    state.map.removeLayer(state.connectorLine);
    state.connectorLine = null;
  }
}

function startTimer() {
  clearTimer();
  state.secondsLeft = GAME_CONFIG.roundTimeSeconds;
  updateTimerDisplay();

  state.timerId = setInterval(() => {
    state.secondsLeft -= 1;
    updateTimerDisplay();

    if (state.secondsLeft <= 0) {
      clearTimer();
      autoSubmitWhenTimeEnds();
    }
  }, 1000);
}

function clearTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function updateTimerDisplay() {
  dom.timerLabel.textContent = `${Math.max(state.secondsLeft, 0)}s`;
  dom.timerLabel.classList.toggle("timer-warning", state.secondsLeft <= 5);
}

function autoSubmitWhenTimeEnds() {
  if (!state.isRoundActive) {
    return;
  }

  if (!state.guessLatLng) {
    const center = state.map.getCenter();
    state.guessLatLng = L.latLng(center.lat, center.lng);

    state.guessMarker = L.circleMarker(state.guessLatLng, {
      radius: 8,
      color: "#ffffff",
      weight: 2,
      fillColor: "#2b78ff",
      fillOpacity: 1,
    }).addTo(state.map);
  }

  dom.statusText.textContent = "Time expired. Guess auto-submitted.";
  submitGuess({ timedOut: true });
}

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sa = Math.sin(dLat / 2) ** 2;
  const sb = Math.sin(dLng / 2) ** 2 * Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat));
  const h = sa + sb;

  return 2 * R * Math.asin(Math.sqrt(h));
}

function calculateScore(distanceKm, difficulty) {
  if (!Number.isFinite(distanceKm)) {
    return 0;
  }

  const decay = difficulty === "easy" ? 2800 : 1300;
  const score = Math.round(5000 * Math.exp(-distanceKm / decay));

  if (distanceKm < 0.03) {
    return 5000;
  }

  return Math.max(0, Math.min(5000, score));
}

function revealActualLocation() {
  const actualLatLng = L.latLng(state.currentLocation.lat, state.currentLocation.lng);

  state.actualMarker = L.circleMarker(actualLatLng, {
    radius: 8,
    color: "#ffffff",
    weight: 2,
    fillColor: "#cf4545",
    fillOpacity: 1,
  }).addTo(state.map);

  state.connectorLine = L.polyline([state.guessLatLng, actualLatLng], {
    color: "#1a3f6e",
    weight: 3,
    dashArray: "8 6",
    lineJoin: "round",
  }).addTo(state.map);

  const bounds = L.latLngBounds([state.guessLatLng, actualLatLng]).pad(0.4);
  state.map.fitBounds(bounds, { maxZoom: 4, animate: true, duration: 0.8 });

  return actualLatLng;
}

function submitGuess({ timedOut = false } = {}) {
  if (!state.isRoundActive) {
    return;
  }

  state.isRoundActive = false;
  clearTimer();
  dom.submitGuessBtn.disabled = true;

  const guess = state.guessLatLng;
  const actual = { lat: state.currentLocation.lat, lng: state.currentLocation.lng };
  const distanceKm = haversineKm(guess, actual);
  const roundScore = calculateScore(distanceKm, state.difficulty);

  revealActualLocation();

  state.totalScore += roundScore;
  dom.totalScoreLabel.textContent = String(state.totalScore);
  dom.lastRoundScoreLabel.textContent = String(roundScore);
  dom.lastDistanceLabel.textContent = formatDistance(distanceKm);

  if (roundScore >= 3500) {
    playSuccessSound(roundScore);
  }

  const roundSummary = {
    roundNumber: state.roundIndex + 1,
    distanceKm,
    score: roundScore,
  };

  state.roundHistory.push(roundSummary);
  showRoundModal(roundSummary, timedOut);
}

function formatDistance(distanceKm) {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }

  return `${distanceKm.toFixed(1)} km`;
}

function showRoundModal(roundSummary, timedOut) {
  dom.roundResultTitle.textContent = `Round ${roundSummary.roundNumber} Results`;
  dom.distanceValue.textContent = formatDistance(roundSummary.distanceKm);
  dom.roundScoreValue.textContent = String(roundSummary.score);
  dom.runningTotalValue.textContent = String(state.totalScore);

  const isLastRound = state.roundIndex === GAME_CONFIG.rounds - 1;
  dom.nextRoundBtn.textContent = isLastRound ? "See Final Score" : "Next Round";

  if (timedOut) {
    dom.statusText.textContent = "Round over. Timer reached zero.";
  } else {
    dom.statusText.textContent = "Round scored. Continue when ready.";
  }

  dom.roundModal.classList.add("active");
  dom.roundModal.style.pointerEvents = "auto";
}

function closeRoundModal() {
  dom.roundModal.classList.remove("active");
  dom.roundModal.style.pointerEvents = "none";
}

function proceedAfterRound() {
  closeRoundModal();

  if (state.roundIndex >= GAME_CONFIG.rounds - 1) {
    finishGame();
    return;
  }

  state.roundIndex += 1;
  showRoundTransition(`Round ${state.roundIndex + 1}`, () => {
    beginRound();
  });
}

function finishGame() {
  if (state.totalScore > state.highScore) {
    state.highScore = state.totalScore;
    localStorage.setItem(GAME_CONFIG.highScoreStorageKey, String(state.highScore));
  }

  dom.highScoreLabel.textContent = String(state.highScore);
  dom.finalDifficulty.textContent = state.difficulty === "easy" ? "Easy" : "Hard";
  dom.finalScoreValue.textContent = String(state.totalScore);
  dom.bestScoreValue.textContent = String(state.highScore);
  dom.statusText.textContent = "Game complete. Start a new game anytime.";

  renderRoundBreakdown();

  dom.finalScreen.classList.add("active");
  dom.finalScreen.style.pointerEvents = "auto";
}

function renderRoundBreakdown() {
  dom.roundBreakdown.innerHTML = "";

  state.roundHistory.forEach((entry) => {
    const row = document.createElement("div");
    row.className = "breakdown-row";

    const round = document.createElement("span");
    round.textContent = `Round ${entry.roundNumber}`;

    const distance = document.createElement("span");
    distance.textContent = formatDistance(entry.distanceKm);

    const score = document.createElement("span");
    score.textContent = `${entry.score} pts`;

    row.append(round, distance, score);
    dom.roundBreakdown.appendChild(row);
  });
}

function showRoundTransition(text, onComplete) {
  dom.transitionText.textContent = text;
  dom.roundTransition.classList.add("active");

  setTimeout(() => {
    dom.roundTransition.classList.remove("active");
    if (typeof onComplete === "function") {
      onComplete();
    }
  }, 1020);
}

function playSuccessSound(score) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const baseNotes = score >= 4700 ? [659, 830, 988] : [523, 659, 784];
  const start = context.currentTime;

  baseNotes.forEach((freq, index) => {
    const osc = context.createOscillator();
    const gain = context.createGain();

    osc.type = "triangle";
    osc.frequency.value = freq;

    const t0 = start + index * 0.11;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.13, t0 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.11);

    osc.connect(gain);
    gain.connect(context.destination);

    osc.start(t0);
    osc.stop(t0 + 0.12);
  });

  setTimeout(() => {
    context.close().catch(() => {});
  }, 700);
}

function resetStreetViewPosition() {
  if (!state.currentStreetUrl) {
    return;
  }

  dom.streetViewFrame.src = withNoCache(state.currentStreetUrl);
  dom.statusText.textContent = "Street View reset to round start view.";
}

function bindEvents() {
  dom.newGameBtn.addEventListener("click", startNewGame);
  dom.submitGuessBtn.addEventListener("click", () => submitGuess());
  dom.returnStartBtn.addEventListener("click", resetStreetViewPosition);
  dom.nextRoundBtn.addEventListener("click", proceedAfterRound);
  dom.restartBtn.addEventListener("click", () => {
    dom.finalScreen.classList.remove("active");
    dom.finalScreen.style.pointerEvents = "none";
    startNewGame();
  });

  dom.difficultySelect.addEventListener("change", () => {
    dom.statusText.textContent = "Difficulty changed. Start a new game to apply it.";
  });

  window.addEventListener("resize", () => {
    if (state.map) {
      setTimeout(() => state.map.invalidateSize(), 80);
    }
  });
}

function initialize() {
  dom.highScoreLabel.textContent = String(state.highScore);
  initializeMap();
  bindEvents();
  startNewGame();
}

initialize();
