const propertyService = require('../services/propertyService');
const { toPropertyDTO, toPropertyDetailDTO } = require('../dtos/property.dto');

const propertyController = {
  async search(req, res, next) {
    try {
      const result = await propertyService.search(req.query);
      const responseData = {
        properties: result.properties.map(toPropertyDTO),
        total: result.total,
        page: result.page,
        limit: result.limit,
      };

      if (result.averageMonthlyRent !== undefined) {
        responseData.averageMonthlyRent = result.averageMonthlyRent;
      }

      res.json({
        success: true,
        data: responseData,
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const property = await propertyService.getById(req.params.id);
      res.json({ success: true, data: toPropertyDetailDTO(property) });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const property = await propertyService.create(req.user.userId, req.body);
      res.status(201).json({ success: true, data: toPropertyDTO(property) });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const property = await propertyService.update(req.params.id, req.user.userId, req.body);
      res.json({ success: true, data: toPropertyDTO(property) });
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const property = await propertyService.updateStatus(req.params.id, req.user.userId, req.body.status);
      res.json({ success: true, data: { id: property.id, status: property.status } });
    } catch (err) {
      next(err);
    }
  },

  async softDelete(req, res, next) {
    try {
      await propertyService.softDelete(req.params.id, req.user.userId);
      res.json({ success: true, data: { message: 'Property hidden' } });
    } catch (err) {
      next(err);
    }
  },

  async getMyListings(req, res, next) {
    try {
      const properties = await propertyService.getMyListings(req.user.userId);
      res.json({ success: true, data: properties.map(toPropertyDTO) });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = propertyController;
