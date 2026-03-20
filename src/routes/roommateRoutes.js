const express = require('express');
const router = express.Router();
const roommateController = require('../controllers/roommateController');
const auth = require('../middleware/auth');
const { roleGuard, verifiedOnly } = require('../middleware/roleGuard');

const studentVerified = [auth, roleGuard('STUDENT'), verifiedOnly];

router.get('/profile', ...studentVerified, roommateController.getProfile);
router.post('/profile', ...studentVerified, roommateController.upsertProfile);
router.get('/candidates', ...studentVerified, roommateController.getCandidates);
router.post('/swipe', ...studentVerified, roommateController.swipe);
router.get('/matches', ...studentVerified, roommateController.getMatches);

module.exports = router;
