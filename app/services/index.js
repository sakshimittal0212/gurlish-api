
const CONFIG = require('../../config');
/********************************
 **** Managing all the services ***
 ********* independently ********
 ********************************/
module.exports = {
    userService: require(`./gurlish/userService`),
    swagger: require(`./gurlish/swagger`),
    authService: require(`./gurlish/authService`),
    sessionService: require(`./gurlish/sessionService`),
    socketService: require(`./gurlish/socketService`),
    fileUploadService: require(`./gurlish/fileUploadService`)
};