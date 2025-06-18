const modelBankAccounts = require("../models/bank_accounts.models");

const getList = async () => {
    const result = await modelBankAccounts.findAll();
    return result;
  };
  

  const postCreate = async (data) => {
    const result = await modelBankAccounts.create(data);
    return result;
  };
  

const patchUpdate = async (data) => {
    const result = await modelBankAccounts.update(data, { where: {b_account_id: data.b_account_id} });
    return result;
};

module.exports = {
    getList,
    postCreate,
    patchUpdate,
}; 