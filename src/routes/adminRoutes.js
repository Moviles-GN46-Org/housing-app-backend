const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');
const userRepository = require('../repositories/userRepository');
const reportService = require('../services/reportService');
const propertyRepository = require('../repositories/propertyRepository');

const adminOnly = [auth, roleGuard('ADMIN')];

// Landlord verifications
router.get('/verifications/pending', ...adminOnly, async (req, res, next) => {
  try {
    const verifications = await userRepository.findPendingLandlordVerifications();
    res.json({ success: true, data: verifications });
  } catch (err) {
    next(err);
  }
});

router.patch('/verifications/:id', ...adminOnly, async (req, res, next) => {
  try {
    const { status, rejectionReason } = req.body;
    const verification = await userRepository.updateLandlordVerification(req.params.id, {
      status,
      rejectionReason: rejectionReason || null,
      reviewedBy: req.user.userId,
      reviewedAt: new Date(),
    });
    res.json({ success: true, data: verification });
  } catch (err) {
    next(err);
  }
});

// Reports
router.get('/reports/pending', ...adminOnly, async (req, res, next) => {
  try {
    const reports = await reportService.listPending();
    res.json({ success: true, data: reports });
  } catch (err) {
    next(err);
  }
});

router.patch('/reports/:id', ...adminOnly, async (req, res, next) => {
  try {
    const report = await reportService.resolve(req.params.id, req.user.userId, req.body);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
});

// Properties
router.patch('/properties/:id/hide', ...adminOnly, async (req, res, next) => {
  try {
    await propertyRepository.updateStatus(req.params.id, 'HIDDEN');
    res.json({ success: true, data: { message: 'Property hidden' } });
  } catch (err) {
    next(err);
  }
});

// Users
router.patch('/users/:id/deactivate', ...adminOnly, async (req, res, next) => {
  try {
    await userRepository.update(req.params.id, { isActive: false });
    res.json({ success: true, data: { message: 'User deactivated' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
