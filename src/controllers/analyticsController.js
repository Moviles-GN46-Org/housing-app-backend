const analyticsService = require("../services/analyticsService");
const geoService = require("../services/geoService");

const analyticsController = {
  async logEvent(req, res, next) {
    try {
      let eventData = req.body;


      if (eventData.payload && eventData.payload.lat && eventData.payload.lng) {
        const localidad = geoService.getLocalidadByCoords(
          eventData.payload.lat, 
          eventData.payload.lng
        );
        eventData.payload.localidad = localidad; 
      }

      const event = await analyticsService.logEvent(req.user.userId, eventData);
      res.status(201).json({ success: true, data: { id: event.id } });
    } catch (err) {
      next(err);
    }
  },

  async logBatch(req, res, next) {
    try {
      const enrichedEvents = req.body.events.map(event => {
        if (event.payload && event.payload.lat && event.payload.lng) {
          event.payload.localidad = geoService.getLocalidadByCoords(
            event.payload.lat, 
            event.payload.lng
          );
        }
        return event;
      });

      const result = await analyticsService.logBatch(
        req.user.userId,
        enrichedEvents,
      );
      res.status(201).json({ success: true, data: { count: result.count } });
    } catch (err) {
      next(err);
    }
  },

  // --- Endpoints de Analítica ---

  async getPreferredMaxDistanceSummary(req, res, next) {
    try {
      const data = await analyticsService.getPreferredMaxDistanceSummary(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getMyPreferredMaxDistance(req, res, next) {
    try {
      const userId = req.user?.userId;
      const data = await analyticsService.getMyPreferredMaxDistance(userId, req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async trackSearchEvent(req, res, next) {
    try {
      const actorUserId = req.user?.userId || null;
      const result = await analyticsService.trackSearchEvent(
        actorUserId,
        req.body,
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  async getTopSearchedZones(req, res, next) {
    try {
      const data = await analyticsService.getTopSearchedZones(req.query);
      res.json({ success: true, data: { zones: data } });
    } catch (err) {
      next(err);
    }
  },

  async getSessionStats(req, res, next) {
    try {
      const data = await analyticsService.getSessionStats(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getDashboard(req, res, next) {
    try {
      const dashboard = await analyticsService.getDashboard();
      res.json({ success: true, data: dashboard });
    } catch (err) {
      next(err);
    }
  },

  async getCrashStats(req, res, next) {
    try {
      const data = await analyticsService.getCrashStats(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getFeatureLoadTimes(req, res, next) {
    try {
      const data = await analyticsService.getFeatureLoadTimes(req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getSupplyDensity(req, res, next) {
    try {
      const data = await analyticsService.getSupplyDensityStats();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async getPopularApartmentSizeNearUniversity(req, res, next) {
    try {
      const data = await analyticsService.getPopularApartmentSizeNearUniversity(req.user.userId, req.query);
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },


  async getLocalidadStats(req, res, next) {
    try {
      const data = await analyticsService.getLocalidadStats();
      res.json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = analyticsController;