// controllers/bank_accounts.controller.js - VERSIÓN SEGURA
const Bank_accounts = require("../models/bank_accounts.models");
const sequelize = require("../database/connect");

const bankAccountsController = {
  /**
   * Obtener lista de cuentas bancarias - MÉTODO ORIGINAL SIN MODIFICAR
   */
  getList: async () => {
    try {
      console.log('🔍 Obteniendo lista de cuentas bancarias');
      
      const result = await Bank_accounts.findAll({
        where: {
          b_account_delete: false // Solo cuentas activas
        },
        order: [
          ['created_date', 'DESC'],
          ['b_account_id', 'DESC']
        ]
      });
      
      console.log(`✅ Cuentas encontradas: ${result.length}`);
      return result;
      
    } catch (error) {
      console.error('❌ Error en getList:', error);
      throw error;
    }
  },

  /**
   * 🆕 NUEVO MÉTODO: Obtener solo cuentas del admin (SIN MODIFICAR MÉTODO ORIGINAL)
   */
  getAdminPaymentAccounts: async () => {
  try {
    console.log('🏦 Obteniendo cuentas bancarias del admin para pagos');

    // Obtener todas las cuentas activas
    const allAccounts = await Bank_accounts.findAll({
      where: {
        b_account_delete: false,
        is_active: true
      },
      order: [
        ['created_date', 'DESC'],
        ['b_account_id', 'DESC']
      ]
    });

    console.log(`📊 Total de cuentas activas encontradas: ${allAccounts.length}`);

    // Log para debug
    allAccounts.forEach(account => {
      console.log(`🔍 Cuenta ID: ${account.b_account_id}, Banco: ${account.b_account_bank}, Tipo: ${account.account_type}, Company_ID: ${account.company_id}`);
    });

    // Filtrar cuentas del admin
    const adminAccounts = allAccounts.filter(account => {
      const isAdminCollection = account.account_type === 'admin_collection';
      const isAdminOwned = account.company_id === null || account.company_id === undefined;
      const ownerIndicatesAdmin = account.b_account_owner && (
        account.b_account_owner.toLowerCase().includes('admin') ||
        account.b_account_owner.toLowerCase().includes('sistema') ||
        account.b_account_owner.toLowerCase().includes('administrador')
      );

      console.log(`🔍 Evaluando cuenta ${account.b_account_id}:`);
      console.log(`   - isAdminCollection: ${isAdminCollection}`);
      console.log(`   - isAdminOwned: ${isAdminOwned}`);
      console.log(`   - ownerIndicatesAdmin: ${ownerIndicatesAdmin}`);

      return isAdminCollection || (isAdminOwned && !account.company_id);
    });

    console.log(`✅ Cuentas del admin encontradas: ${adminAccounts.length}`);

    // Si no hay cuentas específicas del admin, devolver todas las activas
    let accountsToReturn = adminAccounts;
    if (adminAccounts.length === 0 && allAccounts.length > 0) {
      console.log('⚠️ No hay cuentas específicas del admin, usando todas las cuentas disponibles');
      accountsToReturn = allAccounts;
    }

    // Mapear los resultados **con los nombres originales de la DB**
    const mappedResults = accountsToReturn.map(account => ({
      b_account_id: account.b_account_id,
      b_account_bank: account.b_account_bank,
      b_account_number: account.b_account_number,
      b_account_type: account.b_account_type,
      b_account_owner: account.b_account_owner,
      b_account_ci: account.b_account_ci,
      is_active: account.is_active,
      account_type: account.account_type,
      created_date: account.created_date
    }));

    console.log(`📤 Enviando ${mappedResults.length} cuentas al frontend`);
    return mappedResults;

  } catch (error) {
    console.error('❌ Error en getAdminPaymentAccounts:', error);
    throw error;
  }
},



  /**
   * Crear nueva cuenta bancaria - MÉTODO ORIGINAL SIN MODIFICAR
   */
  postCreate: async (data) => {
    try {
      console.log('🏦 Creando nueva cuenta bancaria:', data);
      
      const {
        b_account_bank,
        b_account_number,
        b_account_ci,
        b_account_type,
        b_account_owner,
        company_id = null,
        account_type = 'owner_payout'
      } = data;

      // Verificar si ya existe el número de cuenta
      const existing = await Bank_accounts.findOne({
        where: {
          b_account_number,
          b_account_delete: false
        }
      });

      if (existing) {
        throw new Error('Ya existe una cuenta con este número');
      }

      // Crear nueva cuenta
      const newAccount = await Bank_accounts.create({
        company_id,
        b_account_bank,
        b_account_number,
        b_account_ci,
        b_account_type,
        b_account_owner,
        account_type,
        is_active: true,
        created_date: new Date(),
        b_account_delete: false
      });

      console.log('✅ Cuenta creada con ID:', newAccount.b_account_id);
      return newAccount;
      
    } catch (error) {
      console.error('❌ Error en postCreate:', error);
      throw error;
    }
  },

  /**
   * Actualizar cuenta bancaria existente - MÉTODO ORIGINAL SIN MODIFICAR
   */
  patchUpdate: async (data) => {
    try {
      console.log('🔄 Actualizando cuenta bancaria:', data);
      
      const {
        b_account_id,
        b_account_bank,
        b_account_number,
        b_account_ci,
        b_account_type,
        b_account_owner
      } = data;

      if (!b_account_id) {
        throw new Error('ID de cuenta requerido para actualizar');
      }

      // Verificar que la cuenta existe
      const existing = await Bank_accounts.findOne({
        where: {
          b_account_id,
          b_account_delete: false
        }
      });

      if (!existing) {
        throw new Error('Cuenta bancaria no encontrada');
      }

      // Si se está cambiando el número, verificar que no exista otro con el mismo
      if (b_account_number && b_account_number !== existing.b_account_number) {
        const duplicate = await Bank_accounts.findOne({
          where: {
            b_account_number,
            b_account_id: { [sequelize.Op.ne]: b_account_id },
            b_account_delete: false
          }
        });

        if (duplicate) {
          throw new Error('Ya existe otra cuenta con este número');
        }
      }

      // Actualizar campos proporcionados
      const updateData = {};
      if (b_account_bank) updateData.b_account_bank = b_account_bank;
      if (b_account_number) updateData.b_account_number = b_account_number;
      if (b_account_ci) updateData.b_account_ci = b_account_ci;
      if (b_account_type) updateData.b_account_type = b_account_type;
      if (b_account_owner) updateData.b_account_owner = b_account_owner;

      const [affectedRows] = await Bank_accounts.update(updateData, {
        where: { b_account_id }
      });

      if (affectedRows === 0) {
        throw new Error('No se pudo actualizar la cuenta');
      }

      console.log('✅ Cuenta actualizada exitosamente');
      
      // Devolver la cuenta actualizada
      const updatedAccount = await Bank_accounts.findByPk(b_account_id);
      return updatedAccount;
      
    } catch (error) {
      console.error('❌ Error en patchUpdate:', error);
      throw error;
    }
  }
};

module.exports = bankAccountsController;