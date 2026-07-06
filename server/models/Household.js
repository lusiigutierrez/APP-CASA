const mongoose = require('mongoose');
const crypto = require('crypto');

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, required: true },
}, { _id: true });

function generateInviteCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // ej. "A1B2C3"
}

const householdSchema = new mongoose.Schema({
  name: { type: String, default: 'Nuestra casa' },
  inviteCode: { type: String, unique: true, default: generateInviteCode },
  members: { type: [memberSchema], default: [] },
  budgets: {
    type: Map,
    of: Number,
    default: {},
  },
}, { timestamps: true });

householdSchema.statics.generateInviteCode = generateInviteCode;

module.exports = mongoose.model('Household', householdSchema);
