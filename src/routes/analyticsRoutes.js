const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

router.post('/events', auth, analyticsController.logEvent);
router.post('/events/batch', auth, analyticsController.logBatch);
router.get('/dashboard', auth, roleGuard('ADMIN'), analyticsController.getDashboard);

module.exports = router;
