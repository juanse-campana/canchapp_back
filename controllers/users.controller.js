const modelUsers = require("../models/users.models");

const postList = async () => {
    const result = await modelUsers.findAll();
    return result;
  };
  

  const postCreate = async (data) => {
    const result = await modelUsers.create(data);
    return result;
  };
  

const postUpdate = async (data) => {
    const result = await modelUsers.update(data, { where: {user_id: data.user_id} });
    return result;
};

const postDelete = async (data) => {
    const result = await modelUsers.destroy({ where: {user_id:data.user_id} });
    return result;
};

const getLogin = async (data) => {
  const result = await modelUsers.findOne({
      where: {user_mail: data.user_mail,user_password:data.user_password},
  });

  return result;
};

const getOpenRegisters = async () => {
  const result = await modelUsers.findAll({
      where: {user_state: true},
  });

  return result;
};

module.exports = {
    postList,
    postCreate,
    postUpdate,
    postDelete,
    getLogin,
    getOpenRegisters,
}; 