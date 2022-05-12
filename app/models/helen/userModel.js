"use strict";
/************* Modules ***********/
const { USER_ROLE } = require('../../utils/constants')

const MONGOOSE = require('mongoose');
const Schema = MONGOOSE.Schema;
/**************************************************
 ************* User Model or collection ***********
 **************************************************/
const userSchema = new Schema({
    userName: { type: String },
    email: { type: String },
    password: { type: String },
    isDeleted: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    firstName: { type: String },
    lastName: { type: String },
    contactNumber: { type: String },
    role: { type: Number, enum: [USER_ROLE.ADMIN, USER_ROLE.STUDENT, USER_ROLE.TEACHER] }
});

userSchema.set('timestamps', true);

module.exports = MONGOOSE.model('user', userSchema);



