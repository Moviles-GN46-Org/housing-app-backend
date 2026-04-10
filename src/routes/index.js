const express = require('express');
const router = express.Router();

router.use('/auth', require('./authRoutes'));
router.use('/properties', require('./propertyRoutes'));
router.use('/chats', require('./chatRoutes'));
router.use('/visits', require('./visitRoutes'));
router.use('/roommate', require('./roommateRoutes'));
router.use('/reports', require('./reportRoutes'));
router.use('/notifications', require('./notificationRoutes'));
router.use('/analytics', require('./analyticsRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/test-tools', require('./testToolsRoutes'));

module.exports = router;
