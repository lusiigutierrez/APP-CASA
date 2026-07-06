const makeCrudRouter = require('../utils/crudRouter');
const InventoryItem = require('../models/InventoryItem');
module.exports = makeCrudRouter(InventoryItem);
