const modelCompanies = require("../models/companies.models");

const getList = async () => {
    const result = await modelCompanies.findAll();
    return result;
  };

  const postCreate = async (data) => {
    const result = await modelCompanies.create(data);
    return result;
  };
  
const patchUpdate = async (data) => {
    const result = await modelCompanies.update(data, { where: {
      companie_id: data.companie_id,
    } });
    return result;
};

const deleteDelete = async (data) => {
    const result = await modelCompanies.destroy({ where: {companie_id:data.companie_id} });
    return result;
};

module.exports = {
    getList,
    postCreate,
    patchUpdate,
    deleteDelete,
}; 