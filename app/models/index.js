'use strict';
const CONFIG = require('../../config');
/********************************
 **** Managing all the models ***
 ********* independently ********
 ********************************/
module.exports = {
    userModel: require(`../models/gurlish/userModel`),
    versionModel: require(`../models/gurlish/versionModel`)
};