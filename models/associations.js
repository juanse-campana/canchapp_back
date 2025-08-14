// models/associations.js
const Fields = require('./fields.models');
const FieldSchedules = require('./fieldSchedules.models');
const RecurringReservations = require('./recurringReservations.models');

// Definir relaciones
Fields.hasMany(FieldSchedules, {
    foreignKey: 'field_id',
    as: 'schedules'
});

FieldSchedules.belongsTo(Fields, {
    foreignKey: 'field_id',
    as: 'field'
});

Fields.hasMany(RecurringReservations, {
    foreignKey: 'field_id',
    as: 'recurringReservations'
});

RecurringReservations.belongsTo(Fields, {
    foreignKey: 'field_id',
    as: 'field'
});

module.exports = {
    Fields,
    FieldSchedules,
    RecurringReservations
};