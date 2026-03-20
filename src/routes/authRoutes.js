const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/google', authController.googleAuth);
router.post('/refresh', authController.refresh);

// Authenticated routes
router.post('/verify-email', auth, roleGuard('STUDENT'), authController.verifyEmail);
router.post('/resend-code', auth, roleGuard('STUDENT'), authController.resendCode);
router.get('/me', auth, authController.me);

// TODO: POST /api/auth/upload-documents
//   - Role: LANDLORD (auth + roleGuard('LANDLORD'))
//   - Accepts: multipart/form-data with fields: idDocument (file), utilityBill (file)
//   - Middleware: multer (to be added to src/middleware/upload.js)
//   - Controller: authController.uploadLandlordDocuments
//   - Service: authService.uploadLandlordDocuments(userId, { idDocumentUrl, utilityBillUrl })
//   - Repo: userRepository.updateLandlordVerification(verificationId, { idDocumentUrl, utilityBillUrl, status: 'PENDING' })
//   - After upload, admin reviews via PATCH /api/admin/verifications/:id (already implemented)

module.exports = router;
