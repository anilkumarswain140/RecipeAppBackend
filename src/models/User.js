const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userSchema = new mongoose.Schema(
    {
        username: {
            required: [true, 'Please add a username'],
            unique: true,
            type: String,
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unquie: true,
            match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'],

        },
        password: {
            type: String,
            required: [true, "Please add a password"],
            minlenght: 6,
            select: false,

        },
        createdAt: {
            type: Date,
            default: Date.now
        },
    },
    { timestamps: true }
);

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
      next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  });
  
  // Match user entered password to hashed password in database
  userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  };

  module.exports = mongoose.model('User', userSchema)
  