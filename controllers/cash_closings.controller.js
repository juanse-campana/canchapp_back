const modelCashClosings = require("../models/cash_closings.models.js");
const fieldsController = require("../controllers/fields.controller");
const calendarsController = require("../controllers/calendars.controller");

const getList = async () => {
    const result = await modelCashClosings.findAll();
    return result;
  };

const postCreate = async (data) => {
    // 1. Obtener todas las canchas de la compañía
    const fieldsToClose = await fieldsController.findCompanyFields(data.company_id);

    const calendarsToCloseIds = []; // Renombrado para mayor claridad (contiene IDs)

    // Usamos `for...of` que es más moderno y seguro para iterar sobre arrays.
    for (const field of fieldsToClose) {
        const fieldId = field.dataValues.field_id;

        // 2. Buscar los calendarios para CADA cancha
        const pendingCalendars = await calendarsController.findPayedCalendarsByField(fieldId);

        // 3. ¡LA VERIFICACIÓN CLAVE!
        // Si se encontraron calendarios para esta cancha, procesarlos.
        if (pendingCalendars && pendingCalendars.length > 0) {
            
            // 4. Iterar sobre TODOS los calendarios encontrados para esta cancha
            for (const calendar of pendingCalendars) {
                const calendarId = calendar.dataValues.calendar_id;
                
                // Agregar el ID a la lista para el cierre de caja
                calendarsToCloseIds.push(calendarId);

                // Preparar datos para actualizar el estado del calendario a "Cerrado"
                const updateData = {
                    calendar_id: calendarId,
                    calendar_payment: 'Cerrado' 
                };

                // Actualizar cada calendario individualmente
                await calendarsController.patchUpdate(updateData);
            }
        }
        // Si no se encuentran calendarios para esta cancha (el `else`), no hacemos nada y simplemente continuamos con la siguiente cancha.
    }

    // 5. Asignar la lista de IDs de calendarios procesados al objeto de datos principal
    data.cash_closing_calendar_list = calendarsToCloseIds;

    // 6. Crear el registro del cierre de caja
    const result = await modelCashClosings.create(data);

    return result
};
  
const patchUpdate = async (data) => {
    const result = await modelCashClosings.update(data, { where: {
      cash_closing_id: data.cash_closing_id,
    } });
    return result;
};

module.exports = {
    getList,
    postCreate,
    patchUpdate,
}; 