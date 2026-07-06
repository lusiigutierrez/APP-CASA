const makeCrudRouter = require('../utils/crudRouter');
const Task = require('../models/Task');
module.exports = makeCrudRouter(Task);
