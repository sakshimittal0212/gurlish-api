'use strict';
const CONFIG = require('../../config');
/********************************
 **** Managing all the models ***
 ********* independently ********
 ********************************/
module.exports = {
    userModel: require(`../models/helen/userModel`),
    versionModel: require(`../models/helen/versionModel`)
};