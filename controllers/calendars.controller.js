// 🔧 VERSIÓN MEJORADA Y UNIFICADA - calendars.controller.js

const { where, and, Op } = require("sequelize");
const modelCalendars = require("../models/calendars.models");
const modelFieldSchedules = require("../models/fieldSchedules.models");
const modelFields = require("../models/fields.models");
const sequelize = require("../database/connect");

const getDateList = async (data) => {
    const result = await modelCalendars.findAll({
        where: {
            field_id: data.field_id,
            calendar_date: data.calendar_date
        },
        order: [['calendar_init_time', 'ASC']]
    });
    return result; // ❌ No llamar postCreateDate
};

// 🆕 VERSIÓN MEJORADA: Obtener horarios disponibles usando FieldSchedules como base
const getAvailableSlots = async (data) => {
    console.log(`🔍 Buscando slots disponibles para cancha ${data.field_id} en fecha ${data.calendar_date}`);
    
    try {
        // 1. Validar que la cancha existe
        const field = await modelFields.findByPk(data.field_id);
        if (!field) {
            return {
                success: false,
                message: `Cancha con ID ${data.field_id} no encontrada`
            };
        }

        // 2. Obtener el día de la semana
        const targetDate = new Date(data.calendar_date);
        const dayOfWeek = targetDate.getDay(); // 0=Domingo, 1=Lunes, etc.
        console.log(`📅 Día de la semana: ${dayOfWeek} para fecha ${data.calendar_date}`);

        // 3. Buscar horarios programados para este día
        let schedules = await modelFieldSchedules.findAll({
            where: {
                field_id: data.field_id,
                day_of_week: dayOfWeek,
                is_available: true
            },
            order: [['start_time', 'ASC']]
        });

        console.log(`📋 Horarios programados encontrados: ${schedules.length}`);

        // 4. Si no hay horarios programados, crear horarios por defecto
        if (schedules.length === 0) {
            console.log('📅 No hay horarios programados, creando horarios por defecto...');
            await createDefaultSchedulesForDay(data.field_id, dayOfWeek);
            
            // Volver a consultar
            schedules = await modelFieldSchedules.findAll({
                where: {
                    field_id: data.field_id,
                    day_of_week: dayOfWeek,
                    is_available: true
                },
                order: [['start_time', 'ASC']]
            });
            console.log(`📋 Horarios por defecto creados: ${schedules.length}`);
        }

        // 5. Verificar reservas existentes para esta fecha
        const existingReservations = await modelCalendars.findAll({
            where: {
                field_id: data.field_id,
                calendar_date: data.calendar_date,
                calendar_state: {
                    [Op.in]: ['Reservada', 'Por Confirmar', 'Confirmada']
                }
            }
        });

        console.log(`🚫 Reservas existentes: ${existingReservations.length}`);

        // 6. Filtrar horarios disponibles
        const availableSlots = schedules.filter(schedule => {
            const scheduleStart = schedule.start_time;
            const scheduleEnd = schedule.end_time;

            // Verificar si hay conflicto con reservas existentes
            const hasConflict = existingReservations.some(reservation => {
                const reservationStart = reservation.calendar_init_time;
                const reservationEnd = reservation.calendar_end_time;

                return timeOverlap(scheduleStart, scheduleEnd, reservationStart, reservationEnd);
            });

            return !hasConflict;
        });

        console.log(`✅ Horarios disponibles: ${availableSlots.length} de ${schedules.length} total`);

        // 7. Formatear respuesta
        const formattedSlots = availableSlots.map(slot => ({
            schedule_id: slot.schedule_id || slot.id,
            field_id: slot.field_id,
            start_time: slot.start_time,
            end_time: slot.end_time,
            date: data.calendar_date,
            is_available: true,
            calendar_state: 'Disponible'
        }));

        return {
            success: true,
            data: formattedSlots,
            total: formattedSlots.length,
            message: `${formattedSlots.length} horarios disponibles encontrados`
        };

    } catch (error) {
        console.error('❌ Error en getAvailableSlots:', error);
        return {
            success: false,
            data: [],
            total: 0,
            message: error.message || 'Error obteniendo horarios disponibles'
        };
    }
};

// 🆕 FUNCIÓN HELPER: Crear horarios por defecto para un día específico
const createDefaultSchedulesForDay = async (fieldId, dayOfWeek) => {
    const transaction = await sequelize.transaction();
    
    try {
        const defaultSchedules = [];
        
        // Crear horarios de 6 AM a 11 PM (6:00 a 23:00)
        for (let hour = 6; hour < 23; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00:00`;
            
            defaultSchedules.push({
                field_id: fieldId,
                day_of_week: dayOfWeek,
                start_time: startTime,
                end_time: endTime,
                is_available: true
            });
        }
        
        await modelFieldSchedules.bulkCreate(defaultSchedules, { transaction });
        await transaction.commit();
        
        console.log(`✅ Creados ${defaultSchedules.length} horarios por defecto para día ${dayOfWeek}`);
        
    } catch (error) {
        await transaction.rollback();
        console.error('❌ Error creando horarios por defecto:', error);
        throw error;
    }
};

// 🆕 FUNCIÓN HELPER: Verificar solapamiento de horarios
const timeOverlap = (start1, end1, start2, end2) => {
    return (
        (start1 >= start2 && start1 < end2) ||
        (end1 > start2 && end1 <= end2) ||
        (start1 <= start2 && end1 >= end2)
    );
};

// 🆕 MÉTODO: Reservar un horario específico
const reserveTimeSlot = async (data) => {
    console.log(`🎯 Reservando horario:`, data);
    
    try {
        const {
            field_id,
            calendar_date,
            start_time,
            end_time,
            user_id,
            calendar_transaccion // Corregido: usar calendar_transaccion
        } = data;

        // 1. Verificar si ya existe una reserva para este horario exacto
        let existingSlot = await modelCalendars.findOne({
            where: {
                field_id,
                calendar_date,
                calendar_init_time: start_time,
                calendar_end_time: end_time
            }
        });

        // 2. Si no existe, crear el slot
        if (!existingSlot) {
            existingSlot = await modelCalendars.create({
                field_id,
                calendar_date,
                calendar_init_time: start_time,
                calendar_end_time: end_time,
                calendar_state: 'Por Confirmar',
                user_id: user_id,
                calendar_payment: 'Pendiente',
                calendar_transaccion: calendar_transaccion
            });

            console.log(`✅ Nuevo slot creado y reservado - Calendar ID: ${existingSlot.calendar_id}`);
            
            return {
                success: true,
                data: {
                    calendar_id: existingSlot.calendar_id,
                    calendar_state: 'Por Confirmar',
                    message: 'Horario creado y reservado exitosamente'
                }
            };
        }

        // 3. Si existe, verificar que esté disponible
        if (existingSlot.calendar_state !== 'Disponible') {
            return {
                success: false,
                message: `Este horario ya no está disponible. Estado actual: ${existingSlot.calendar_state}`
            };
        }

        // 4. Actualizar el estado a reservado
        const [affectedRows] = await modelCalendars.update(
            {
                calendar_state: 'Por Confirmar',
                user_id: user_id,
                calendar_payment: 'Pendiente',
                calendar_transaccion: calendar_transaccion
            },
            {
                where: {
                    calendar_id: existingSlot.calendar_id,
                    calendar_state: 'Disponible'
                }
            }
        );

        if (affectedRows === 0) {
            return {
                success: false,
                message: 'El horario ya fue reservado por otro usuario'
            };
        }

        console.log(`✅ Horario reservado exitosamente - Calendar ID: ${existingSlot.calendar_id}`);
        
        return {
            success: true,
            data: {
                calendar_id: existingSlot.calendar_id,
                calendar_state: 'Por Confirmar',
                message: 'Horario reservado exitosamente'
            }
        };

    } catch (error) {
        console.error('❌ Error en reserveTimeSlot:', error);
        return {
            success: false,
            message: error.message || 'Error reservando horario'
        };
    }
};

// Mantener las demás funciones existentes...
const confirmReservation = async (calendar_id, confirmed_by = null) => {
    try {
        console.log(`✅ Confirmando reserva - Calendar ID: ${calendar_id}`);
        
        const [affectedRows] = await modelCalendars.update(
            {
                calendar_state: 'Reservada'
            },
            {
                where: {
                    calendar_id,
                    calendar_state: 'Por Confirmar'
                }
            }
        );

        if (affectedRows === 0) {
            return {
                success: false,
                message: 'Reserva no encontrada o ya confirmada'
            };
        }

        return {
            success: true,
            message: 'Reserva confirmada exitosamente'
        };

    } catch (error) {
        console.error('❌ Error en confirmReservation:', error);
        return {
            success: false,
            message: error.message || 'Error confirmando reserva'
        };
    }
};

const cancelReservation = async (calendar_id, reason = 'Cancelado') => {
    try {
        console.log(`🚫 Cancelando reserva - Calendar ID: ${calendar_id}`);
        
        const [affectedRows] = await modelCalendars.update(
            {
                calendar_state: 'Disponible',
                user_id: null,
                calendar_payment: null,
                calendar_transaccion: null
            },
            {
                where: {
                    calendar_id,
                    calendar_state: ['Por Confirmar', 'Reservada']
                }
            }
        );

        if (affectedRows === 0) {
            return {
                success: false,
                message: 'Reserva no encontrada o no se puede cancelar'
            };
        }

        console.log(`✅ Reserva cancelada - Horario liberado`);
        
        return {
            success: true,
            message: 'Reserva cancelada exitosamente. El horario ya está disponible nuevamente.'
        };

    } catch (error) {
        console.error('❌ Error en cancelReservation:', error);
        return {
            success: false,
            message: error.message || 'Error cancelando reserva'
        };
    }
};

// ⚠️ DEPRECATED: Mantener por compatibilidad pero no usar
const postCreateDate = async (data) => {
    console.warn('⚠️ postCreateDate está deprecated. Usar getAvailableSlots en su lugar.');
    return [];
};

const patchUpdate = async (data) => {
    const result = await modelCalendars.update(data, { where: {calendar_id: data.calendar_id} });
    return result;
};

const closeCalendar = async (data) => {
    const result = await modelCalendars.update(data, {
        where: {
            calendar_id: data.calendar_id
        }
    });
    return result;
};

const findPayedCalendarsByField = async (id) => {
    console.log(id);
    try {
        const result = await modelCalendars.findAll({
            where: {
                field_id: id,
                calendar_state: 'Reservada',
                calendar_payment: 'Pendiente'
            }
        });
        console.log(result);
        return result;
    } catch (error) {
        console.log(error);
    }
};

module.exports = {
    getDateList,
    postCreateDate, // Mantener por compatibilidad
    patchUpdate,
    findPayedCalendarsByField,
    closeCalendar,
    getAvailableSlots, // ✅ VERSIÓN MEJORADA
    reserveTimeSlot,
    confirmReservation,
    cancelReservation
};