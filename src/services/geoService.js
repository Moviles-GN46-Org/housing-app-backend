const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');

// Ruta al archivo
const geojsonPath = path.join(__dirname, '../../docs/geojson/poligonosbogota.geojson');

let geojsonData = null;

// Cargamos el archivo una sola vez al iniciar el servidor para mayor eficiencia
try {
    const rawData = fs.readFileSync(geojsonPath, 'utf8');
    geojsonData = JSON.parse(rawData);
    console.log('✅ GeoJSON de localidades cargado correctamente.');
} catch (error) {
    console.error('Error cargando el archivo GeoJSON:', error.message);
}

/**
 * Determina en qué localidad de Bogotá se encuentra un punto (lat, lng)
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {string|null} Nombre de la localidad o null si está fuera de los polígonos
 */
const getLocalidadByCoords = (lat, lng) => {
    if (!geojsonData) return null;

    const pt = turf.point([lng, lat]);

    for (const feature of geojsonData.features) {
        if (turf.booleanPointInPolygon(pt, feature)) {
            // Usamos la propiedad que confirmamos en tu archivo
            return feature.properties.nombre_de_la_localidad;
        }
    }

    return "FUERA_BOGOTA";
};

module.exports = { getLocalidadByCoords };