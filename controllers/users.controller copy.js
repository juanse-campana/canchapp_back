const modelUsers = require("../models/users.models");

const getList = async () => {
    const result = await modelUsers.findAll();
    return result;
  };
  

  const postCreate = async (data) => {
    const result = await modelUsers.create(data);
    return result;
  };
  

const patchUpdate = async (data) => {
    const result = await modelUsers.update(data, { where: {user_id: data.user_id} });
    return result;
};

const deleteDelete = async (data) => {
    const result = await modelUsers.destroy({ where: {user_id:data.user_id} });
    return result;
};

module.exports = {
    getList,
    postCreate,
    patchUpdate,
    deleteDelete,
}; 