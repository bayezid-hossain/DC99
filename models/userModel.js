const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please Enter Your Name'],
    maxlength: [30, 'Name cannot exceed 30 characters'],
    minlength: [4, 'Name should have more than 4 characters'],
  },
  email: {
    type: String,
    require: [true, 'Please Enter Your Email'],
    unique: true,
    validate: [validator.isEmail, 'Please Enter a valid Email'],
  },
  password: {
    type: String,
    required: [true, 'Please enter your password'],
    minlength: [8, 'Password should have minimum 8 characters'],
    select: false,
  },
  avatar: {
    public_id: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
  },
  role: {
    type: String,
    default: 'user',
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);

  console.log(this.password);
});

//JWT Token

userSchema.methods.getJWTToken = function () {
  return jwt.sign(
    {
      id: this._id,
      expiredAt: Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_Expire,
    }
  );
};

//Compare Password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generating Password reset token

userSchema.methods.getResetPasswordToken = function () {
  //Generating Token

  const resetToken = crypto.randomBytes(20).toString('hex');

  //Hasing and adding to userSchema
  this.resetPasswordToken = crypto
    .createHash('sha512')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpire = Date.now() + 15 * 60000;
  return resetToken;
};

module.exports = mongoose.model('user', userSchema);
