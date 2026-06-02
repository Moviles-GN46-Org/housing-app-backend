import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
const API_URL = `${API_BASE}/api`;

const analyticsService = {
  getLocalidadStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/localidad-stats`);
      return response.data;
    } catch (error) {
      console.error("Error in getLocalidadStats:", error);
      throw error;
    }
  },

  getSupplyDensity: async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/supply-density`);
      return response.data;
    } catch (error) {
      console.error("Error in getSupplyDensity:", error);
      throw error;
    }
  },

  getTopFilters: async ({ from, to } = {}) => {
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const response = await axios.get(`${API_URL}/analytics/top-filters${qs}`);
      return response.data;
    } catch (error) {
      console.error("Error in getTopFilters:", error);
      throw error;
    }
  },

  getRoommateProfileCharacteristics: async ({ top } = {}) => {
    try {
      const params = new URLSearchParams();
      if (top) params.set("top", String(top));
      const qs = params.toString() ? `?${params.toString()}` : "";
      const response = await axios.get(
        `${API_URL}/analytics/roommate-profile-characteristics${qs}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error in getRoommateProfileCharacteristics:", error);
      throw error;
    }
  },

  getSearchesByMonth: async ({ from, to } = {}) => {
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const response = await axios.get(
        `${API_URL}/analytics/searches-by-month${qs}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error in getSearchesByMonth:", error);
      throw error;
    }
  },
};

export default analyticsService;
