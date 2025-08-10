const Users = require("./users.models");
const Companies = require("./companies.models");
const Cities = require("./cities.models");
const BankAccounts = require("./bank_accounts.models");
const Calendars = require("./calendars.models");
const CashClosings = require("./cash_closings.models");
const Fields = require("./fields.models");
const Schedules = require("./schedules.models");

// --- Relaciones de Companies ---
// Compañía -> Usuario (Dueño)
Companies.belongsTo(Users, { foreignKey: "company_user_id", as: "owner" });
Users.hasMany(Companies, { foreignKey: "company_user_id", as: "companies" });

// Compañía -> Ciudad
Companies.belongsTo(Cities, { foreignKey: "company_city_id", as: "city" });
Cities.hasMany(Companies, { foreignKey: "company_city_id", as: "companies" });

// Compañía -> Cuentas Bancarias
Companies.hasMany(BankAccounts, { foreignKey: "company_id", as: "bank_accounts" });
BankAccounts.belongsTo(Companies, { foreignKey: "company_id", as: "company" });

// Compañía -> Canchas
Companies.hasMany(Fields, { foreignKey: "company_id", as: "fields" });
Fields.belongsTo(Companies, { foreignKey: "company_id", as: "company" });

// Compañía -> Cierres de Caja
Companies.hasMany(CashClosings, { foreignKey: "company_id", as: "cash_closings" });
CashClosings.belongsTo(Companies, { foreignKey: "company_id", as: "company" });


// --- Relaciones de Fields (Canchas) ---
// Cancha -> Horarios
Fields.hasMany(Schedules, { foreignKey: "field_id", as: "schedules" });
Schedules.belongsTo(Fields, { foreignKey: "field_id", as: "field" });

// Cancha -> Calendario (Reservas)
Fields.hasMany(Calendars, { foreignKey: "field_id", as: "calendars" });
Calendars.belongsTo(Fields, { foreignKey: "field_id", as: "field" });


// --- Relaciones de Calendars (Reservas) ---
// Calendario -> Usuario (Jugador que reserva)
Calendars.belongsTo(Users, { foreignKey: "user_id", as: "player" });
Users.hasMany(Calendars, { foreignKey: "user_id", as: "reservations" });

// Calendario -> Cierre de Caja
Calendars.belongsTo(CashClosings, { foreignKey: "cash_closing_id", as: "cash_closing" });
CashClosings.hasMany(Calendars, { foreignKey: "cash_closing_id", as: "calendars" });


module.exports = {
  Users,
  Companies,
  Cities,
  BankAccounts,
  Calendars,
  CashClosings,
  Fields,
  Schedules,
};