
const CONFIG = require('../../config');
/********************************
 **** Managing all the services ***
 ********* independently ********
 ********************************/
module.exports = {
    userService: require(`./helen/userService`),
    swagger: require(`./helen/swagger`),
    authService: require(`./helen/authService`),
    sessionService: require(`./helen/sessionService`),
    socketService: require(`./helen/socketService`),
    fileUploadService: require(`./helen/fileUploadService`)
};