const modelSchedules = require("../models/schedules.models");

const getList = async () => {
    const result = await modelSchedules.findAll();
    return result;
  };

  const postCreate = async (data) => {
    const result = await modelSchedules.create(data);
    return result;
  };
  
const patchUpdate = async (data) => {
    const result = await modelSchedules.update(data, { where: {
      schedule_id: data.schedule_id,
    } });
    return result;
};

module.exports = {
    getList,
    postCreate,
    patchUpdate,
}; 