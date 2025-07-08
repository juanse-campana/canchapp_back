const bcrypt = require("bcrypt");
const modelUsers = require("../models/users.models");

const getList = async () => {
  const result = await modelUsers.findAll();
  return result;
};

const postCreate = async (data) => {
  const {
    user_name,
    user_last_name,
    user_email,
    user_phone,
    user_password,
    user_profile_photo,
    user_role, // "jugador" o "dueno"
  } = data;

  // Validaciones mínimas
  if (!user_name || !user_last_name || !user_email || !user_password ||!user_phone) {
    throw new Error("Faltan campos obligatorios");
  }

  // Hashear la contraseña
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(user_password, saltRounds);

  // Crear usuario
  const result = await modelUsers.create({
    user_name,
    user_last_name,
    user_email,
    user_phone,
    user_hashed_password: hashedPassword,
    user_profile_photo,
    user_role: user_role || "jugador", // por defecto jugador
  });

  return result;
};

const patchUpdate = async (data) => {
  const result = await modelUsers.update(data, {
    where: { user_id: data.user_id },
  });
  return result;
};

const deleteDelete = async (data) => {
  const result = await modelUsers.destroy({
    where: { user_id: data.user_id },
  });
  return result;
};

module.exports = {
  getList,
  postCreate,
  patchUpdate,
  deleteDelete,
};
