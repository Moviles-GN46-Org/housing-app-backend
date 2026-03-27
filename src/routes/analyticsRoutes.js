const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const { analyticsSearchRateLimit } = require('../middleware/rateLimit');

router.post('/events', auth, analyticsController.logEvent);
router.post('/events/batch', auth, analyticsController.logBatch);
router.post('/search-events', analyticsSearchRateLimit(), analyticsController.trackSearchEvent);
router.get('/top-searched-zones', analyticsController.getTopSearchedZones);
router.get('/dashboard', auth, roleGuard('ADMIN'), analyticsController.getDashboard);

module.exports = router;
