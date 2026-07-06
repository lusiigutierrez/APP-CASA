const makeCrudRouter = require('../utils/crudRouter');
const Expense = require('../models/Expense');
module.exports = makeCrudRouter(Expense);
