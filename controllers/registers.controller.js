const { Op } = require("sequelize");
const modelRegisters = require("../models/registers.models");

const postList = async () => {
    const result = await modelRegisters.findAll();
    return result;
  };
  

  const postCreate = async (data) => {
    const result = await modelRegisters.create(data);
    return result;
  };
  

const postUpdate = async (data) => {
    const result = await modelRegisters.update(data, { where: {
      user_id: data.user_id,
      register_end_time: null,
    } });
    return result;
};

const postEndTime = async (data) => {
  const result = await modelRegisters.update(data, { where: {register_id: data.register_id} });
  return result;
};

const postDelete = async (data) => {
    const result = await modelRegisters.destroy({ where: {register_id:data.register_id} });
    return result;
};

const getLastestRegisters = async () => {
  try {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - 30);

    const result = await modelRegisters.findAll({
      where: {
        register_date: { [Op.gt]: fechaLimite },
      },
    });

    return result;
  } catch (error) {
    console.error("Error al obtener los registros:", error);
    throw error;
  }
};

const getRegistersByDateRange = async (data) => {
  try {
    const result = await modelRegisters.findAll({
      where: {
        register_date: {
          [Op.between]: [data.fechaInicio, data.fechaFin]
        }
      }
    });
    return result;
  } catch (error) {
    console.error("Error al obtener los registros por rango de fechas:", error);
    throw error;
  }
};


module.exports = {
    postList,
    postCreate,
    postUpdate,
    postDelete,
    postEndTime,
    getLastestRegisters,
    getRegistersByDateRange,
}; 