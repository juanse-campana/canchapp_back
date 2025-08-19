const modelCities = require("../models/cities.models");

const getList = async () => {
    const result = await modelCities.findAll();
    return result;
  };

  const postCreate = async (data) => {
    const result = await modelCities.create(data);
    return result;
  };
  
const patchUpdate = async (data) => {
    const result = await modelCities.update(data, { where: {
      city_id: data.city_id,
    } });
    return result;
};

module.exports = {
    getList,
    postCreate,
    patchUpdate,
}; 