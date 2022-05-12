"use strict";
/************* Modules ***********/
const MONGOOSE = require('mongoose');
const Schema = MONGOOSE.Schema;
/**************************************************
 ************* Db version Model or collection ***********
 **************************************************/
const versionSchema = new Schema({
    dbVersion:{type:Number}
});

versionSchema.set('timestamps', true);

module.exports = MONGOOSE.model('version', versionSchema);



