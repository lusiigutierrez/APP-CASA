const makeCrudRouter = require('../utils/crudRouter');
const Note = require('../models/Note');
module.exports = makeCrudRouter(Note);
