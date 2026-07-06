const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true },
  household: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId }, // referencia al perfil dentro de Household.members
  darkMode: { type: Boolean, default: false }, // preferencia personal, no compartida
}, { timestamps: true });

userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 10);
};
userSchema.methods.checkPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};
userSchema.methods.toSafeJSON = function () {
  return {
    id: this._id,
    email: this.email,
    name: this.name,
    household: this.household,
    memberId: this.memberId,
    darkMode: this.darkMode,
  };
};

module.exports = mongoose.model('User', userSchema);
