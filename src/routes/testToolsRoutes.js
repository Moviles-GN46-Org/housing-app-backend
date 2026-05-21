const express = require("express");
const notificationService = require("../services/notificationService");
const prisma = require("../prisma");
const { ForbiddenError, ValidationError } = require("../utils/errors");

const router = express.Router();

const ALLOWED_NOTIFICATION_TYPES = new Set([
  "NEW_MESSAGE",
  "VISIT_REMINDER",
  "VISIT_CONFIRMED",
  "VISIT_CANCELLED",
  "ROOMMATE_MATCH",
  "REVIEW_RECEIVED",
  "LISTING_EXPIRING",
  "REPORT_RESOLVED",
  "VERIFICATION_APPROVED",
  "VERIFICATION_REJECTED",
  "PROPERTY_MATCH",
]);

const PROPERTY_TYPES = ["APARTMENT", "ROOM", "STUDIO", "HOUSE", "SHARED_ROOM"];
const MOCK_TITLES = [
  "Bright Studio Near University",
  "Cozy Room with Private Bathroom",
  "Modern Apartment with Balcony",
  "Shared Flat in Quiet Street",
  "Furnished Student Loft",
  "Comfortable House Room with Desk",
];
const MOCK_DESCRIPTIONS = [
  "Walking distance to campus, supermarkets, and public transport.",
  "Ideal for students. Safe area, natural light, and quiet neighbors.",
  "Recently renovated with practical spaces for study and rest.",
  "Good connectivity and nearby cafes, parks, and stores.",
  "Includes basic appliances and a friendly environment.",
];
const MOCK_NEIGHBORHOODS = [
  "Chapinero",
  "Teusaquillo",
  "La Candelaria",
  "Usaquen",
  "Cedritos",
];
const CITY_CENTERS = {
  bogota: { lat: 4.6482837, lng: -74.2478941 },
  medellin: { lat: 6.2476376, lng: -75.5658153 },
  cali: { lat: 3.43722, lng: -76.5225 },
  barranquilla: { lat: 10.96854, lng: -74.78132 },
};

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomCoordinateOffset() {
  return (Math.random() - 0.5) * 0.02;
}

function parseOptionalNumber(value, fieldName) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new ValidationError(`${fieldName} must be a valid number`);
  }
  return parsed;
}

function parseOptionalInteger(value, fieldName) {
  if (value === undefined || value === null || value === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    throw new ValidationError(`${fieldName} must be an integer`);
  }
  return parsed;
}

function parseOptionalBoolean(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  throw new ValidationError("Boolean fields must be true or false");
}

function pickCityCenter(cityName) {
  const key = String(cityName || "Bogota")
    .trim()
    .toLowerCase();
  return CITY_CENTERS[key] || CITY_CENTERS.bogota;
}

async function resolveLandlordId(customLandlordId) {
  if (customLandlordId) {
    const landlord = await prisma.user.findFirst({
      where: { id: customLandlordId, role: "LANDLORD" },
      select: { id: true },
    });

    if (!landlord) {
      throw new ValidationError(
        "Provided landlordId does not belong to a LANDLORD user",
      );
    }

    return landlord.id;
  }

  const landlords = await prisma.user.findMany({
    where: {
      role: "LANDLORD",
      isActive: true,
      landlordVerification: { is: { status: "VERIFIED" } },
    },
    select: { id: true },
    take: 30,
  });

  if (landlords.length > 0) {
    return pickRandom(landlords).id;
  }

  const fallbackLandlord = await prisma.user.findFirst({
    where: { role: "LANDLORD", isActive: true },
    select: { id: true },
  });

  if (!fallbackLandlord) {
    throw new ValidationError("No LANDLORD users available. Create one first.");
  }

  return fallbackLandlord.id;
}

function buildRandomPropertyData(overrides, landlordId) {
  const city = overrides.city || "Bogota";
  const center = pickCityCenter(city);

  const latitudeOverride = parseOptionalNumber(overrides.latitude, "latitude");
  const longitudeOverride = parseOptionalNumber(
    overrides.longitude,
    "longitude",
  );
  const latitude = latitudeOverride ?? center.lat + randomCoordinateOffset();
  const longitude = longitudeOverride ?? center.lng + randomCoordinateOffset();

  if (latitude < -90 || latitude > 90) {
    throw new ValidationError("latitude must be between -90 and 90");
  }

  if (longitude < -180 || longitude > 180) {
    throw new ValidationError("longitude must be between -180 and 180");
  }

  const propertyType = overrides.propertyType || pickRandom(PROPERTY_TYPES);
  if (!PROPERTY_TYPES.includes(propertyType)) {
    throw new ValidationError(
      `propertyType must be one of: ${PROPERTY_TYPES.join(", ")}`,
    );
  }

  const bedrooms =
    parseOptionalInteger(overrides.bedrooms, "bedrooms") ?? randomInt(1, 4);
  const bathrooms =
    parseOptionalInteger(overrides.bathrooms, "bathrooms") ?? randomInt(1, 3);
  const monthlyRent =
    parseOptionalNumber(overrides.monthlyRent, "monthlyRent") ??
    randomInt(900000, 2600000);
  const depositAmount = parseOptionalNumber(
    overrides.depositAmount,
    "depositAmount",
  );
  const sizeM2 = parseOptionalNumber(overrides.sizeM2, "sizeM2");

  if (bedrooms < 1) throw new ValidationError("bedrooms must be at least 1");
  if (bathrooms < 1) throw new ValidationError("bathrooms must be at least 1");
  if (monthlyRent <= 0)
    throw new ValidationError("monthlyRent must be greater than 0");

  const imageUrls = Array.isArray(overrides.imageUrls)
    ? overrides.imageUrls
    : [
        "https://www.blenheimlettings.co.uk/wp-content/uploads/2022/09/no-image.png",
      ];

  return {
    landlordId,
    title:
      overrides.title || `${pickRandom(MOCK_TITLES)} #${randomInt(101, 999)}`,
    description: overrides.description || pickRandom(MOCK_DESCRIPTIONS),
    propertyType,
    monthlyRent,
    depositAmount,
    includesUtilities:
      parseOptionalBoolean(overrides.includesUtilities) ?? Math.random() > 0.35,
    address:
      overrides.address ||
      `Calle ${randomInt(45, 84)} # ${randomInt(5, 42)}-${randomInt(10, 99)}`,
    neighborhood: overrides.neighborhood || pickRandom(MOCK_NEIGHBORHOODS),
    city,
    latitude,
    longitude,
    sizeM2,
    bedrooms,
    bathrooms,
    furnished: parseOptionalBoolean(overrides.furnished) ?? Math.random() > 0.5,
    petFriendly:
      parseOptionalBoolean(overrides.petFriendly) ?? Math.random() > 0.6,
    hasParking:
      parseOptionalBoolean(overrides.hasParking) ?? Math.random() > 0.7,
    hasLaundry:
      parseOptionalBoolean(overrides.hasLaundry) ?? Math.random() > 0.4,
    hasWifi: parseOptionalBoolean(overrides.hasWifi) ?? true,
    imageUrls,
    status: "ACTIVE",
  };
}

function ensureTestToolsEnabled(req, res, next) {
  const isEnabled =
    process.env.ENABLE_TEST_TOOLS === "true" ||
    process.env.NODE_ENV !== "production";
  if (!isEnabled) {
    return next(
      new ForbiddenError(
        "Test tools are disabled. Set ENABLE_TEST_TOOLS=true to enable them.",
      ),
    );
  }
  return next();
}

router.use(ensureTestToolsEnabled);

router.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Backend Test Tools</title>
  <style>
    :root {
      --bg: #f4f6fb;
      --card: #ffffff;
      --text: #1f2937;
      --muted: #6b7280;
      --accent: #0f766e;
      --border: #d1d5db;
      --danger: #991b1b;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Segoe UI, Tahoma, sans-serif;
      background: radial-gradient(circle at top right, #dbeafe, #f4f6fb 45%);
      color: var(--text);
    }
    .wrap { max-width: 1000px; margin: 28px auto; padding: 0 16px; }
    h1 { margin: 0 0 12px; }
    p { color: var(--muted); }
    .grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
    @media (min-width: 900px) { .grid { grid-template-columns: 1fr 1fr; } }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
    }
    .stack { display: grid; gap: 10px; }
    label { font-size: 14px; font-weight: 600; }
    input, select, textarea, button {
      width: 100%;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 14px;
    }
    textarea { min-height: 92px; resize: vertical; font-family: Consolas, monospace; }
    .inline { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .checks { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .checks label { font-weight: 500; color: var(--muted); }
    button {
      cursor: pointer;
      color: #fff;
      background: var(--accent);
      border: none;
      font-weight: 700;
    }
    .out {
      margin-top: 12px;
      white-space: pre-wrap;
      font-family: Consolas, monospace;
      font-size: 12px;
      background: #0b1020;
      color: #d1fae5;
      padding: 10px;
      border-radius: 8px;
      max-height: 220px;
      overflow: auto;
    }
    .warn { color: var(--danger); font-size: 13px; font-weight: 600; }
    code { background: #eef2ff; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <main class="wrap">
    <h1>Backend Test Tools</h1>
    <p>Use real API flows for property creation (observers run), create random properties without auth, and trigger manual notifications.</p>
    <p class="warn">Use only in controlled environments. This page is disabled in production unless <code>ENABLE_TEST_TOOLS=true</code>.</p>

    <div class="grid">
      <section class="card">
        <h2>Create Property (Real Endpoint)</h2>
        <p>Calls <code>/api/properties</code> with your landlord bearer token.</p>
        <form id="propertyForm" class="stack">
          <label>Landlord Bearer Token<input name="token" required /></label>
          <label>Title<input name="title" required value="Cozy room near campus" /></label>
          <label>Description<textarea name="description" required>Private room, utilities included.</textarea></label>
          <div class="inline">
            <label>Property Type
              <select name="propertyType">
                <option>ROOM</option><option>APARTMENT</option><option>STUDIO</option><option>HOUSE</option><option>SHARED_ROOM</option>
              </select>
            </label>
            <label>Monthly Rent<input name="monthlyRent" type="number" step="0.01" required value="1200000" /></label>
          </div>
          <label>Address<input name="address" required value="Cra 10 # 45-20" /></label>
          <div class="inline">
            <label>Neighborhood<input name="neighborhood" required value="Chapinero" /></label>
            <label>City<input name="city" value="Bogota" /></label>
          </div>
          <div class="inline">
            <label>Latitude<input name="latitude" type="number" step="0.000001" required value="4.648625" /></label>
            <label>Longitude<input name="longitude" type="number" step="0.000001" required value="-74.065041" /></label>
          </div>
          <div class="inline">
            <label>Bedrooms<input name="bedrooms" type="number" required value="1" /></label>
            <label>Bathrooms<input name="bathrooms" type="number" required value="1" /></label>
          </div>
          <div class="checks">
            <label><input type="checkbox" name="furnished" /> Furnished</label>
            <label><input type="checkbox" name="petFriendly" /> Pet Friendly</label>
            <label><input type="checkbox" name="hasParking" /> Has Parking</label>
            <label><input type="checkbox" name="hasLaundry" /> Has Laundry</label>
            <label><input type="checkbox" name="hasWifi" checked /> Has Wifi</label>
            <label><input type="checkbox" name="includesUtilities" checked /> Includes Utilities</label>
          </div>
          <button type="submit">Create Property</button>
        </form>
        <div class="out" id="propertyOut">Waiting for action...</div>
      </section>

      <section class="card">
        <h2>Create Notification (Test Endpoint)</h2>
        <p>Calls <code>/api/test-tools/notifications</code>.</p>
        <form id="notificationForm" class="stack">
          <label>User ID<input name="userId" required /></label>
          <label>Type
            <select name="type">
              <option>PROPERTY_MATCH</option>
              <option>NEW_MESSAGE</option>
              <option>ROOMMATE_MATCH</option>
              <option>VISIT_CONFIRMED</option>
              <option>REVIEW_RECEIVED</option>
            </select>
          </label>
          <label>Title<input name="title" required value="New Property Match" /></label>
          <label>Body<input name="body" required value="A new property matches your preferences." /></label>
          <label>data (JSON)
            <textarea name="data">{
  "propertyId": "replace-with-property-id",
  "landlordId": null,
  "neighborhood": "Chapinero",
  "monthlyRent": 1200000,
  "source": "manual_test_tool"
}</textarea>
          </label>
          <button type="submit">Create Notification</button>
        </form>
        <div class="out" id="notificationOut">Waiting for action...</div>
      </section>

      <section class="card">
        <h2>Create Random Property (No Auth)</h2>
        <p>Calls <code>/api/test-tools/properties/random</code>. Fill only the fields you want to override.</p>
        <form id="randomPropertyForm" class="stack">
          <div class="inline">
            <label>Count (1-25)<input name="count" type="number" min="1" max="25" value="1" /></label>
            <label>Landlord ID (optional)<input name="landlordId" placeholder="random landlord if empty" /></label>
          </div>
          <label>Title (optional)<input name="title" placeholder="random realistic title" /></label>
          <div class="inline">
            <label>City (optional)<input name="city" placeholder="Bogota" /></label>
            <label>Neighborhood (optional)<input name="neighborhood" placeholder="Chapinero" /></label>
          </div>
          <div class="inline">
            <label>Monthly Rent (optional)<input name="monthlyRent" type="number" step="1" /></label>
            <label>Property Type (optional)
              <select name="propertyType">
                <option value="">Random</option>
                <option>ROOM</option><option>APARTMENT</option><option>STUDIO</option><option>HOUSE</option><option>SHARED_ROOM</option>
              </select>
            </label>
          </div>
          <div class="inline">
            <label>Latitude (optional)<input name="latitude" type="number" step="0.000001" /></label>
            <label>Longitude (optional)<input name="longitude" type="number" step="0.000001" /></label>
          </div>
          <button type="submit">Create Random Property</button>
        </form>
        <div class="out" id="randomPropertyOut">Waiting for action...</div>
      </section>
    </div>
  </main>

  <script>
    const propertyForm = document.getElementById('propertyForm');
    const notificationForm = document.getElementById('notificationForm');
    const randomPropertyForm = document.getElementById('randomPropertyForm');
    const propertyOut = document.getElementById('propertyOut');
    const notificationOut = document.getElementById('notificationOut');
    const randomPropertyOut = document.getElementById('randomPropertyOut');

    function render(outEl, label, data) {
      outEl.textContent = label + '\n' + JSON.stringify(data, null, 2);
    }

    propertyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(propertyForm);
      const token = String(fd.get('token') || '').trim();

      const payload = {
        title: fd.get('title'),
        description: fd.get('description'),
        propertyType: fd.get('propertyType'),
        monthlyRent: Number(fd.get('monthlyRent')),
        address: fd.get('address'),
        neighborhood: fd.get('neighborhood'),
        city: fd.get('city') || 'Bogota',
        latitude: Number(fd.get('latitude')),
        longitude: Number(fd.get('longitude')),
        bedrooms: Number(fd.get('bedrooms')),
        bathrooms: Number(fd.get('bathrooms')),
        furnished: fd.get('furnished') === 'on',
        petFriendly: fd.get('petFriendly') === 'on',
        hasParking: fd.get('hasParking') === 'on',
        hasLaundry: fd.get('hasLaundry') === 'on',
        hasWifi: fd.get('hasWifi') === 'on',
        includesUtilities: fd.get('includesUtilities') === 'on'
      };

      try {
        const resp = await fetch('/api/properties', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify(payload),
        });
        const json = await resp.json();
        render(propertyOut, 'HTTP ' + resp.status, json);
      } catch (err) {
        render(propertyOut, 'Request error', { message: err.message });
      }
    });

    notificationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(notificationForm);
      const rawData = String(fd.get('data') || '').trim();

      let parsedData = null;
      try {
        parsedData = rawData ? JSON.parse(rawData) : null;
      } catch (err) {
        render(notificationOut, 'Invalid data JSON', { message: err.message });
        return;
      }

      const payload = {
        userId: fd.get('userId'),
        type: fd.get('type'),
        title: fd.get('title'),
        body: fd.get('body'),
        data: parsedData,
      };

      try {
        const resp = await fetch('/api/test-tools/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await resp.json();
        render(notificationOut, 'HTTP ' + resp.status, json);
      } catch (err) {
        render(notificationOut, 'Request error', { message: err.message });
      }
    });

    randomPropertyForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(randomPropertyForm);

      const optionalField = (name) => {
        const value = String(fd.get(name) || '').trim();
        return value === '' ? undefined : value;
      };

      const payload = {
        count: Number(optionalField('count') || 1),
        landlordId: optionalField('landlordId'),
        title: optionalField('title'),
        city: optionalField('city'),
        neighborhood: optionalField('neighborhood'),
        monthlyRent: optionalField('monthlyRent') ? Number(optionalField('monthlyRent')) : undefined,
        propertyType: optionalField('propertyType'),
        latitude: optionalField('latitude') ? Number(optionalField('latitude')) : undefined,
        longitude: optionalField('longitude') ? Number(optionalField('longitude')) : undefined,
      };

      try {
        const resp = await fetch('/api/test-tools/properties/random', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const json = await resp.json();
        render(randomPropertyOut, 'HTTP ' + resp.status, json);
      } catch (err) {
        render(randomPropertyOut, 'Request error', { message: err.message });
      }
    });
  </script>
</body>
</html>`);
});

router.post("/properties/random", async (req, res, next) => {
  try {
    const countRaw = req.body?.count;
    const count =
      countRaw === undefined || countRaw === null || countRaw === ""
        ? 1
        : Number(countRaw);

    if (!Number.isInteger(count) || count < 1 || count > 25) {
      throw new ValidationError("count must be an integer between 1 and 25");
    }

    const landlordId = await resolveLandlordId(req.body?.landlordId);
    const createdProperties = [];

    for (let i = 0; i < count; i += 1) {
      const data = buildRandomPropertyData(req.body || {}, landlordId);
      const created = await prisma.property.create({ data });
      createdProperties.push(created);
    }

    res.status(201).json({
      success: true,
      data: {
        count: createdProperties.length,
        properties: createdProperties,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/notifications", async (req, res, next) => {
  try {
    const { userId, type, title, body, data } = req.body;

    if (!userId || !type || !title || !body) {
      throw new ValidationError("userId, type, title, and body are required");
    }

    if (!ALLOWED_NOTIFICATION_TYPES.has(type)) {
      throw new ValidationError(`Unsupported notification type: ${type}`);
    }

    const notification = await notificationService.create({
      userId,
      type,
      title,
      body,
      data,
    });
    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
