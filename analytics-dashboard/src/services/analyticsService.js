import axios from 'axios';


const API_URL = 'http://localhost:3000/api';

const analyticsService = {

  getLocalidadStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/localidad-stats`);
      return response.data; 
    } catch (error) {
      console.error("Error en getLocalidadStats:", error);
      throw error;
    }
  },


  getSupplyDensity: async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/supply-density`);
      return response.data;
    } catch (error) {
      console.error("Error en getSupplyDensity:", error);
      throw error;
    }
  }
};

export default analyticsService;