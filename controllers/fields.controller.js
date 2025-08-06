const modelFields = require("../models/fields.models");

const getList = async () => {
    const result = await modelFields.findAll();
    return result;
  };

const findCompanyFields = async (id) =>{
  const result = await modelFields.findAll({
    where: {
      company_id: id
    }
  })
  return result
} 

const postCreate = async (data) => {
  const result = await modelFields.create(data);
  return result;
};
  

const patchUpdate = async (data) => {
    const result = await modelFields.update(data, { where: {field_id: data.field_id} });
    return result;
};

module.exports = {
    getList,
    postCreate,
    patchUpdate,
    findCompanyFields
}; 