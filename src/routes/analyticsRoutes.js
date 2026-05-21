const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const auth = require("../middleware/auth");
const { roleGuard } = require("../middleware/roleGuard");
const { analyticsSearchRateLimit } = require("../middleware/rateLimit");

router.post("/events", auth, analyticsController.logEvent);
router.post("/batch", auth, analyticsController.logBatch);

router.post(
  "/search-events",
  analyticsSearchRateLimit(),
  analyticsController.trackSearchEvent,
);

router.post(
  "/search-filter-usages",
  analyticsSearchRateLimit(),
  analyticsController.trackSearchFilterUsage,
);

router.get("/localidad-stats", analyticsController.getLocalidadStats);

router.get(
  "/popular-apartment-size-near-university",
  auth,
  roleGuard("STUDENT"),
  analyticsController.getPopularApartmentSizeNearUniversity,
);

router.get("/top-searched-zones", analyticsController.getTopSearchedZones);
router.get("/session-stats", analyticsController.getSessionStats);
router.get(
  "/dashboard",
  auth,
  roleGuard("ADMIN"),
  analyticsController.getDashboard,
);

router.get("/crash-stats", analyticsController.getCrashStats);
router.get("/supply-density", analyticsController.getSupplyDensity);
router.get("/feature-load-times", analyticsController.getFeatureLoadTimes);

router.get(
  "/preferred-max-distance-summary",
  auth,
  analyticsController.getPreferredMaxDistanceSummary,
);
router.get(
  "/my-preferred-max-distance",
  auth,
  analyticsController.getMyPreferredMaxDistance,
);

router.get("/top-filters", analyticsController.getTopFilters);

router.get('/landlord/:id/response-time', auth, analyticsController.getLandlordResponseTime);

module.exports = router;
