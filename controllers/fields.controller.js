const modelFields = require("../models/fields.models");
const modelFieldSchedules = require("../models/fieldSchedules.models");
const modelRecurringReservations = require("../models/recurringReservations.models");
const sequelize = require("../database/connect");

const getList = async () => {
    const result = await modelFields.findAll({
        include: [
            {
                model: modelFieldSchedules,
                as: 'schedules',
                required: false
            },
            {
                model: modelRecurringReservations,
                as: 'recurringReservations',
                required: false
            }
        ]
    });
    return result;
};

const getById = async (fieldId) => {
    const result = await modelFields.findByPk(fieldId, {
        include: [
            {
                model: modelFieldSchedules,
                as: 'schedules',
                required: false
            },
            {
                model: modelRecurringReservations,
                as: 'recurringReservations',
                required: false,
                where: { is_active: true }
            }
        ]
    });
    return result;
};

const postCreate = async (data) => {
    const transaction = await sequelize.transaction();
    
    try {
        // 1. Crear la cancha
        const newField = await modelFields.create({
            company_id: data.company_id,
            field_name: data.field_name,
            field_type: data.field_type,
            field_size: data.field_size,
            field_max_capacity: data.field_max_capacity,
            field_hour_price: data.field_hour_price,
            field_description: data.field_description,
            field_img: data.field_img,
            field_calification: data.field_calification
        }, { transaction });

        const fieldId = newField.field_id;

        // 2. Crear horarios si se proporcionan
        if (data.schedules && Array.isArray(data.schedules)) {
            const scheduleData = data.schedules.map(schedule => ({
                field_id: fieldId,
                day_of_week: schedule.day_of_week,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                is_available: schedule.is_available !== undefined ? schedule.is_available : true
            }));

            await modelFieldSchedules.bulkCreate(scheduleData, { transaction });
        } else {
            // Si no se proporcionan horarios, crear horarios por defecto
            await createDefaultSchedules(fieldId, transaction);
        }

        // 3. Crear reservas recurrentes si se proporcionan
        if (data.recurring_reservations && Array.isArray(data.recurring_reservations)) {
            const recurringData = data.recurring_reservations.map(reservation => ({
                parent_calendar_id: 0, // Se actualizará después
                field_id: fieldId,
                user_id: reservation.user_id,
                created_by_owner_id: reservation.created_by_owner_id || null,
                recurring_type: reservation.recurring_type,
                day_of_week: reservation.day_of_week,
                day_of_month: reservation.day_of_month || null,
                start_time: reservation.start_time,
                end_time: reservation.end_time,
                start_date: reservation.start_date,
                end_date: reservation.end_date || null,
                payment_amount: reservation.payment_amount,
                notes: reservation.notes || null
            }));

            await modelRecurringReservations.bulkCreate(recurringData, { transaction });
        }

        await transaction.commit();
        
        // Obtener el resultado completo con relaciones
        const result = await getById(fieldId);
        return result;

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

// Función helper para crear horarios por defecto
const createDefaultSchedules = async (fieldId, transaction) => {
    const defaultSchedules = [];
    
    // Crear horarios de 6 AM a 12 AM para todos los días
    for (let day = 0; day <= 6; day++) { // 0=Domingo, 1=Lunes, etc.
        for (let hour = 6; hour < 24; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
            
            defaultSchedules.push({
                field_id: fieldId,
                day_of_week: day,
                start_time: startTime,
                end_time: endTime,
                is_available: true
            });
        }
    }
    
    await modelFieldSchedules.bulkCreate(defaultSchedules, { transaction });
};

const getFieldSchedules = async (fieldId) => {
    const result = await modelFieldSchedules.findAll({
        where: { field_id: fieldId },
        order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
    });
    return result;
};

const getAvailableSlots = async (fieldId, date) => {
    try {
        // Obtener el día de la semana de la fecha (0=Domingo, 1=Lunes, etc.)
        const targetDate = new Date(date);
        const dayOfWeek = targetDate.getDay();

        // Obtener todos los horarios disponibles para ese día
        const schedules = await modelFieldSchedules.findAll({
            where: {
                field_id: fieldId,
                day_of_week: dayOfWeek,
                is_available: true
            },
            order: [['start_time', 'ASC']]
        });

        // Obtener reservas recurrentes activas para ese día
        const recurringReservations = await modelRecurringReservations.findAll({
            where: {
                field_id: fieldId,
                is_active: true,
                recurring_type: 'semanal',
                day_of_week: dayOfWeek,
                start_date: { [sequelize.Op.lte]: date },
                [sequelize.Op.or]: [
                    { end_date: null },
                    { end_date: { [sequelize.Op.gte]: date } }
                ]
            }
        });

        // TODO: Aquí también deberías verificar reservas normales existentes
        // const existingReservations = await modelCalendars.findAll({...});

        // Filtrar horarios ocupados por reservas recurrentes
        const availableSlots = schedules.filter(schedule => {
            const scheduleStart = schedule.start_time;
            const scheduleEnd = schedule.end_time;

            // Verificar si hay conflicto con reservas recurrentes
            const hasConflict = recurringReservations.some(reservation => {
                const reservationStart = reservation.start_time;
                const reservationEnd = reservation.end_time;

                return (
                    (scheduleStart >= reservationStart && scheduleStart < reservationEnd) ||
                    (scheduleEnd > reservationStart && scheduleEnd <= reservationEnd) ||
                    (scheduleStart <= reservationStart && scheduleEnd >= reservationEnd)
                );
            });

            return !hasConflict;
        });

        return availableSlots;

    } catch (error) {
        throw error;
    }
};

const patchUpdate = async (data) => {
    const transaction = await sequelize.transaction();
    
    try {
        // Actualizar datos básicos de la cancha
        await modelFields.update(data, {
            where: { field_id: data.field_id },
            transaction
        });

        // Si se proporcionan nuevos horarios, actualizar
        if (data.schedules && Array.isArray(data.schedules)) {
            // Eliminar horarios existentes
            await modelFieldSchedules.destroy({
                where: { field_id: data.field_id },
                transaction
            });

            // Crear nuevos horarios
            const scheduleData = data.schedules.map(schedule => ({
                field_id: data.field_id,
                day_of_week: schedule.day_of_week,
                start_time: schedule.start_time,
                end_time: schedule.end_time,
                is_available: schedule.is_available !== undefined ? schedule.is_available : true
            }));

            await modelFieldSchedules.bulkCreate(scheduleData, { transaction });
        }

        await transaction.commit();
        
        const result = await getById(data.field_id);
        return result;

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

const deleteField = async (fieldId) => {
    const transaction = await sequelize.transaction();
    
    try {
        // Soft delete - marcar como eliminado
        await modelFields.update(
            { field_delete: true },
            { where: { field_id: fieldId }, transaction }
        );

        // Desactivar reservas recurrentes
        await modelRecurringReservations.update(
            { is_active: false },
            { where: { field_id: fieldId }, transaction }
        );

        await transaction.commit();
        return { success: true, message: 'Cancha eliminada correctamente' };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

module.exports = {
    getList,
    getById,
    postCreate,
    getFieldSchedules,
    getAvailableSlots,
    patchUpdate,
    deleteField,
};