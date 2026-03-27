/**
 * Seed script to populate the database with fictitious CRASH analytics events.
 *
 * Usage:
 *   node scripts/seed-crash-events.js
 *
 * Requires the backend to be running (uses POST /api/analytics/events).
 * Authenticates with a Bearer token passed via ACCESS_TOKEN env var,
 * or falls back to the hardcoded token below.
 */

const ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMGI1NmQ3YS04YzU2LTQ4NTQtYWIwNC1iZjI0YjM1NWE3MTAiLCJyb2xlIjoiU1RVREVOVCIsImlzVmVyaWZpZWQiOnRydWUsImlhdCI6MTc3NDYyMTI2MSwiZXhwIjoxNzc0NjIyMTYxfQ.eG4e8mHTtczel5Bx64O5jdWKj6driVRZrRte538Ykso";

const API_BASE = process.env.API_BASE || "http://localhost:3000";
const BATCH_ENDPOINT = `${API_BASE}/api/analytics/events/batch`;

const USER_IDS = [
  "f44cf41a-40cb-4662-a6d1-d4de51afe887",
  "00b56d7a-8c56-4854-ab04-bf24b355a710",
];

const SCREENS = [
  { name: "Map Search", weight: 48 },
  { name: "Listing Detail", weight: 31 },
  { name: "Photo Gallery", weight: 27 },
  { name: "Login / Auth", weight: 19 },
  { name: "Chat Screen", weight: 12 },
  { name: "Profile Edit", weight: 8 },
];

const ERROR_MESSAGES = {
  "Map Search": [
    "Null pointer in MapView.onMarkerClick",
    "Google Maps SDK timeout",
    "OutOfMemoryError rendering tiles",
  ],
  "Listing Detail": [
    "Image URL returned 404",
    "NumberFormatException parsing rent",
    "Null landlord reference",
  ],
  "Photo Gallery": [
    "Index out of bounds in gallery swipe",
    "Bitmap too large for canvas",
    "Permission denied: camera",
  ],
  "Login / Auth": [
    "Token refresh failed with 401",
    "Google Sign-In cancelled unexpectedly",
    "Network timeout on /auth/login",
  ],
  "Chat Screen": [
    "WebSocket disconnected mid-send",
    "Failed to parse message metadata",
  ],
  "Profile Edit": [
    "Form state lost on orientation change",
    "Upload failed: file too large",
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack = 30) {
  const now = Date.now();
  const offset = Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(now - offset).toISOString();
}

function generateEvents(count) {
  // Build a weighted pool so screen distribution matches the weights
  const pool = [];
  for (const screen of SCREENS) {
    for (let i = 0; i < screen.weight; i++) {
      pool.push(screen.name);
    }
  }

  const events = [];
  for (let i = 0; i < count; i++) {
    const screenName = pool[Math.floor(Math.random() * pool.length)];
    const errorMessage = pickRandom(ERROR_MESSAGES[screenName]);
    events.push({
      sessionId: `seed-session-${Math.random().toString(36).slice(2, 10)}`,
      eventType: "CRASH",
      screenName,
      payload: {
        screen: screenName,
        errorMessage,
        stackTrace: `${errorMessage}\n    at ${screenName.replace(/ /g, "")}Screen.render (${screenName.replace(/ /g, "")}.kt:${Math.floor(Math.random() * 300) + 10})`,
      },
    });
  }
  return events;
}

async function main() {
  if (!ACCESS_TOKEN) {
    console.error("ERROR: Set ACCESS_TOKEN env var with a valid Bearer token.");
    console.error(
      "Example: ACCESS_TOKEN=eyJ... node scripts/seed-crash-events.js",
    );
    process.exit(1);
  }

  const TOTAL_EVENTS = 145;
  const events = generateEvents(TOTAL_EVENTS);

  console.log(`Seeding ${events.length} CRASH events to ${BATCH_ENDPOINT}...`);

  const res = await fetch(BATCH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ events }),
  });

  const body = await res.json();

  if (!res.ok) {
    console.error(`Failed (${res.status}):`, body);
    process.exit(1);
  }

  console.log(`Success! Created ${body.data.count} crash events.`);

  // Print distribution summary
  const dist = {};
  for (const e of events) {
    dist[e.screenName] = (dist[e.screenName] || 0) + 1;
  }
  console.log("\nDistribution:");
  Object.entries(dist)
    .sort((a, b) => b[1] - a[1])
    .forEach(([screen, count]) => console.log(`  ${screen}: ${count}`));
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
