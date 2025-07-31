const { where, and } = require("sequelize");
const modelCalendars = require("../models/calendars.models");
const schedulesController = require("../controllers/schedules.controller");

const getDateList = async (data) => {
    const result = await modelCalendars.findAll({
        where: {
            field_id: data.field_id,       // Condición para field_id
            calendar_date: data.calendar_date // Condición para calendar_date
        }
    });
    if (result.length == 0) {
      return postCreateDate(data)
    }
    else {
      return result;
    }
};
  

const postCreateDate = async (data) => {
  console.log(data)
    // 1. Obtener el horario para el campo
    const fieldSchedule = await schedulesController.getScheduleByField(data);
    const createdCalendars = [];

    // Verificar si se obtuvo un horario y si tiene las propiedades esperadas
    if (!fieldSchedule || typeof fieldSchedule !== 'object' || !fieldSchedule.field_id) {
        console.log('No se encontró un horario válido para el campo, o el formato es inesperado.');
        return [];
    }

    // Mapeo de días de la semana (0 = Domingo, 1 = Lunes, ..., 6 = Sábado) a las claves del horario
    const dayMap = {
        0: 'schedule_sun',
        1: 'schedule_mon',
        2: 'schedule_tue',
        3: 'schedule_wed',
        4: 'schedule_thu',
        5: 'schedule_fri',
        6: 'schedule_sat',
    };

    // Obtener el día de la semana de la fecha proporcionada (data.calendar_date)
    // data.calendar_date debe ser una cadena 'YYYY-MM-DD' para crear un objeto Date
    const targetDate = new Date(data.calendar_date + 'T00:00:00'); // Añadimos 'T00:00:00' para evitar problemas de zona horaria
    const dayOfWeek = targetDate.getDay(); // 0 = Domingo, 1 = Lunes, etc.
    const scheduleKey = dayMap[dayOfWeek]; // Por ejemplo, 'schedule_wed'

    // Verificar si existe un horario para ese día específico
    if (!fieldSchedule[scheduleKey]) {
        console.warn(`No se encontró un horario para el día ${scheduleKey} en el objeto de horario.`);
        return [];
    }

    // Dividir la cadena de estados de horario en un arreglo
    const hourlyStates = fieldSchedule[scheduleKey].split(',');

    // Iterar a través de las 24 horas del día
    for (let i = 0; i < hourlyStates.length; i++) {
        const calendar_init_hour = i;
        const calendar_end_hour = i + 1;
        const calendar_state = hourlyStates[i].trim(); // .trim() para eliminar posibles espacios en blanco

        // Formatear las horas a HH:MM:SS para el tipo DataTypes.TIME de Sequelize
        // Por ejemplo, 0 se convierte en '00:00:00', 9 en '09:00:00', 17 en '17:00:00'
        const formatTime = (hour) => {
            const h = String(hour).padStart(2, '0');
            return `${h}:00:00`;
        };

        const timeSlotData = {
            field_id: data.field_id,
            calendar_date: data.calendar_date,
            calendar_init_time: formatTime(calendar_init_hour),
            calendar_end_time: formatTime(calendar_end_hour),
            calendar_state: calendar_state
        };

        try {
            const newCalendarEntry = await modelCalendars.create(timeSlotData);
            createdCalendars.push(newCalendarEntry);
            console.log('Entrada de calendario creada:', newCalendarEntry.toJSON());
        } catch (error) {
            console.error('Error al crear entrada de calendario para el slot:', timeSlotData, 'Error:', error.message);
            // Decide cómo manejar el error: continuar, lanzar o añadir a una lista de errores
        }
    }

    return createdCalendars; // Retorna el arreglo de todas las entradas de calendario creadas exitosamente
};
  


const patchUpdate = async (data) => {
    const result = await modelCalendars.update(data, { where: {calendar_id: data.calendar_id} });
    return result;
};

module.exports = {
    getDateList,
    postCreateDate,
    patchUpdate,
}; 