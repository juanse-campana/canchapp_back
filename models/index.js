const Users = require("./users.models");
const Companies = require("./companies.models");
const Cities = require("./cities.models");

// Definir relaciones

// Una empresa pertenece a una ciudad
Companies.belongsTo(Cities, {
  foreignKey: "company_city_id",
  as: "city",
});

// Una ciudad tiene muchas empresas
Cities.hasMany(Companies, {
  foreignKey: "company_city_id",
  as: "companies",
});

// Una empresa pertenece a un usuario (dueño)
Companies.belongsTo(Users, {
  foreignKey: "company_user_id",
  as: "owner",
});

// Un usuario puede tener muchas empresas
Users.hasMany(Companies, {
  foreignKey: "company_user_id",
  as: "companies",
});

module.exports = {
  Users,
  Companies,
  Cities,
};
