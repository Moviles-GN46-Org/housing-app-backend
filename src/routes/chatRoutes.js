const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/auth');
const { roleGuard, verifiedOnly } = require('../middleware/roleGuard');

router.get('/', auth, chatController.list);
router.post('/', auth, roleGuard('STUDENT'), verifiedOnly, chatController.start);
router.get('/:id/messages', auth, chatController.getMessages);
router.post('/:id/messages', auth, chatController.sendMessage);
router.post('/:id/visit-proposal', auth, roleGuard('LANDLORD'), verifiedOnly, chatController.sendVisitProposal);
router.post('/:id/visit-response', auth, roleGuard('STUDENT'), verifiedOnly, chatController.respondToVisitProposal);

module.exports = router;
