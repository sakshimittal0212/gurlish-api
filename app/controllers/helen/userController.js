"use strict";
const path = require('path');
const HELPERS = require("../../helpers");
const { MESSAGES, ERROR_TYPES, NORMAL_PROJECTION, OPERATION_TYPES, SOCKET_EVENTS, SOCKET_EVENTS_TYPES } = require('../../utils/constants');
const SERVICES = require('../../services');
const { compareHash, encryptJwt } = require(`../../utils/utils`);
const CONFIG = require(`../../../config`);

/**************************************************
 ***** Auth controller for authentication logic ***
 **************************************************/
let userController = {};

/**
 * function to get server response.
 */

userController.getServerResponse = async (payload) => {
  return HELPERS.responseHelper.createSuccessResponse(MESSAGES.SERVER_IS_WORKING_FINE);

};

/**
 * function to register a user to the system.
 */
userController.registerNewUser = async (payload) => {
  let isUserAlreadyExists = await SERVICES.userService.getUser({ email: payload.email }, NORMAL_PROJECTION);
  if (!isUserAlreadyExists) {
    let newRegisteredUser = await SERVICES.userService.registerUser(payload);
    return Object.assign(HELPERS.responseHelper.createSuccessResponse(MESSAGES.USER_REGISTERED_SUCCESSFULLY), { user: newRegisteredUser });
  }
  throw HELPERS.responseHelper.createErrorResponse(MESSAGES.EMAIL_ALREADY_EXISTS, ERROR_TYPES.BAD_REQUEST);
};

/**
 * function to login a user to the system.
 */
userController.loginUser = async (payload) => {
  // check is user exists in the database with provided email or not.
  let user = await SERVICES.userService.getUser({ email: payload.email }, NORMAL_PROJECTION);
  // if user exists then compare the password that user entered.
  if (user) {
    // compare user's password.
    if (compareHash(payload.password, user.password)) {
      const dataForJwt = {
        id: user._id,
        date: Date.now()
      };
      return Object.assign(HELPERS.responseHelper.createSuccessResponse(MESSAGES.LOGGED_IN_SUCCESSFULLY), { token: encryptJwt(dataForJwt) });
    }
    throw HELPERS.responseHelper.createErrorResponse(MESSAGES.INVALID_PASSWORD, ERROR_TYPES.BAD_REQUEST);
  }
  throw HELPERS.responseHelper.createErrorResponse(MESSAGES.INVALID_EMAIL, ERROR_TYPES.BAD_REQUEST);
};

/**
 * function to create and update user based on the operation type. 
 */
userController.createAndUpdateUser = async (payload) => {
  let criteria = { email: payload.email, isDeleted: false }, dataToUpdate = payload;
  if (payload.operationType === OPERATION_TYPES.DELETE) {
    dataToUpdate = { $set: { isDeleted: true } };
  }
  let user = await SERVICES.userService.updateUser(criteria, dataToUpdate, { new: true, upsert: true });
  return Object.assign(HELPERS.responseHelper.createSuccessResponse(MESSAGES.USER_UPDATED_SUCCESSFULLY), { data: user });
};


/**
 * Function to upload file.
 */
 userController.uploadFile = async (payload) => {
  // check whether the request contains valid payload.
  if (!Object.keys(payload.file).length) {
    throw HELPERS.responseHelper.createErrorResponse(MESSAGES.FILE_REQUIRED_IN_PAYLOAD, ERROR_TYPES.BAD_REQUEST);
  }
  let pathToUpload = path.resolve(__dirname + `../../../..${CONFIG.PATH_TO_UPLOAD_FILES_ON_LOCAL}`),
    pathOnServer = CONFIG.PATH_TO_UPLOAD_FILES_ON_LOCAL;
  let fileUrl = await SERVICES.fileUploadService.uploadFile(payload, pathToUpload, pathOnServer);
  return Object.assign(HELPERS.responseHelper.createSuccessResponse(MESSAGES.FILE_UPLOADED_SUCCESSFULLY), { fileUrl });
};

/* export userController */
module.exports = userController;