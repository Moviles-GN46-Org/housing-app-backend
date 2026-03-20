const reportRepository = require('../repositories/reportRepository');
const propertyRepository = require('../repositories/propertyRepository');
const appEvents = require('../events/eventEmitter');
const userRepository = require('../repositories/userRepository');
const logger = require('../utils/logger');
const { ValidationError, NotFoundError } = require('../utils/errors');

const VALID_REASONS = [
  'ASKS_MONEY_OUTSIDE_APP',
  'FAKE_LISTING',
  'HARASSMENT',
  'INAPPROPRIATE_CONTENT',
  'SCAM_SUSPICION',
  'OTHER',
];

const reportService = {
  async create(reporterId, { propertyId, reportedUserId, reason, description }) {
    if (!reason) throw new ValidationError('reason is required');
    if (!VALID_REASONS.includes(reason)) throw new ValidationError(`reason must be one of: ${VALID_REASONS.join(', ')}`);
    if (!propertyId && !reportedUserId) throw new ValidationError('propertyId or reportedUserId is required');

    const report = await reportRepository.create({
      reporterId,
      propertyId: propertyId || null,
      reportedUserId: reportedUserId || null,
      reason,
      description: description || null,
      status: 'PENDING',
    });

    // Auto-hide the property
    if (propertyId) {
      const property = await propertyRepository.findById(propertyId);
      if (property && property.status === 'ACTIVE') {
        await propertyRepository.updateStatus(propertyId, 'HIDDEN');
        logger.warn('Property auto-hidden due to report', { propertyId, reportId: report.id });
      }

      const reporter = await userRepository.findById(reporterId);
      appEvents.emit('report:created', { report, reporter, property });
    }

    logger.info('Report created', { reportId: report.id, reporterId, propertyId, reason });
    return report;
  },

  async listPending() {
    return reportRepository.findPending();
  },

  async resolve(id, adminId, { status, resolution }) {
    const report = await reportRepository.findById(id);
    if (!report) throw new NotFoundError('Report not found');

    const validStatuses = ['RESOLVED_REMOVED', 'RESOLVED_WARNING', 'RESOLVED_DISMISSED'];
    if (!validStatuses.includes(status)) throw new ValidationError('Invalid resolution status');

    return reportRepository.update(id, {
      status,
      resolution: resolution || null,
      resolvedBy: adminId,
      resolvedAt: new Date(),
    });
  },
};

module.exports = reportService;
