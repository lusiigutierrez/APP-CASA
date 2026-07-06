const makeCrudRouter = require('../utils/crudRouter');
const ShoppingItem = require('../models/ShoppingItem');
module.exports = makeCrudRouter(ShoppingItem);
