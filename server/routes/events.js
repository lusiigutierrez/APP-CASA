const makeCrudRouter = require('../utils/crudRouter');
const Event = require('../models/Event');
module.exports = makeCrudRouter(Event);
