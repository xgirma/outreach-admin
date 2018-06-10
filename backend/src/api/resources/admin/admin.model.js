import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import bcrypt from 'bcrypt';
import logger from '../../modules/logger';

export const schema = {
  username: {
    type: String,
    unique: true,
    required: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: Number,
    enum: [0, 1],
    required: true,
  },
};

const adminSchema = new mongoose.Schema(schema, { timestamps: true });
adminSchema.plugin(uniqueValidator);

adminSchema.methods = {
  authenticate(plaintTextPassword) {
    return bcrypt.compareSync(plaintTextPassword, this.passwordHash);
  },
  hashPassword(plaintTextPassword) {
    if (!plaintTextPassword) {
      logger.error('Can not create a new Admin user', { admin: this.username });
      throw new Error('Could not save admin user');
    }

    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(plaintTextPassword, salt);
  },
};

export const Admin = mongoose.model('admin', adminSchema);
