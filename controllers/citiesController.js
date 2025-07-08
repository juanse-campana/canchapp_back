const Cities = require("../models/Cities");

const getCities = async (req, res) => {
  try {
    const cities = await Cities.findAll();
    res.json(cities);
  } catch (error) {
    console.error("Error al obtener ciudades:", error);
    res.status(500).json({ error: "Error al obtener ciudades" });
  }
};

module.exports = { getCities };
