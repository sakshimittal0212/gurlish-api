let CONSTANTS = require('./constants');
const MONGOOSE = require('mongoose');
const BCRYPT = require("bcrypt");
const JWT = require("jsonwebtoken");
const CONFIG = require('../../config');

let commonFunctions = {};

/**
 * incrypt password in case user login implementation
 * @param {*} payloadString 
 */
commonFunctions.hashPassword = (payloadString) => {
  return BCRYPT.hashSync(payloadString, CONSTANTS.SECURITY.BCRYPT_SALT);
};

/**
 * @param {string} plainText 
 * @param {string} hash 
 */
commonFunctions.compareHash = (payloadPassword, userPassword) => {
  return BCRYPT.compareSync(payloadPassword, userPassword);
};

/**
 * function to get array of key-values by using key name of the object.
 */
commonFunctions.getEnumArray = (obj) => {
  return Object.keys(obj).map(key => obj[key]);
};

/** used for converting string id to mongoose object id */
commonFunctions.convertIdToMongooseId = (stringId) => {
  return MONGOOSE.Types.ObjectId(stringId);
};

/** create jsonwebtoken **/
commonFunctions.encryptJwt = (payload) => {
  let token = JWT.sign(payload, CONSTANTS.SECURITY.JWT_SIGN_KEY, { algorithm: 'HS256' });
  return token;
};

commonFunctions.decryptJwt = (token) => {
  return JWT.verify(token, CONSTANTS.SECURITY.JWT_SIGN_KEY, { algorithm: 'HS256' })
}

/**
 * function to convert an error into a readable form.
 * @param {} error 
 */
commonFunctions.convertErrorIntoReadableForm = (error) => {
  let errorMessage = '';
  if (error.message.indexOf("[") > -1) {
    errorMessage = error.message.substr(error.message.indexOf("["));
  } else {
    errorMessage = error.message;
  }
  errorMessage = errorMessage.replace(/"/g, '');
  errorMessage = errorMessage.replace('[', '');
  errorMessage = errorMessage.replace(']', '');
  error.message = errorMessage;
  return error;
};

/***************************************
 **** Logger for error and success *****
 ***************************************/
commonFunctions.messageLogs = (error, success) => {
  if (error)
    console.log(`\x1b[31m` + error);
  else
    console.log(`\x1b[32m` + success);
};

/**
 * function to get pagination condition for aggregate query.
 * @param {*} sort 
 * @param {*} skip 
 * @param {*} limit 
 */
commonFunctions.getPaginationConditionForAggregate = (sort, skip, limit) => {
  let condition = [
    ...(!!sort ? [{ $sort: sort }] : []),
    { $skip: skip },
    { $limit: limit }
  ];
  return condition;
};

/**
 * function to remove undefined keys from the payload.
 * @param {*} payload 
 */
commonFunctions.removeUndefinedKeysFromPayload = (payload = {}) => {
  for (let key in payload) {
    if (!payload[key]) {
      delete payload[key];
    }
  }
};

/**
 * Send an email to perticular user mail 
 * @param {*} email email address
 * @param {*} subject  subject
 * @param {*} content content
 * @param {*} cb callback
 */
commonFunctions.sendEmail = async (userData, type) => {
  const transporter = require('nodemailer').createTransport(CONFIG.SMTP.TRANSPORT);
  const handleBars = require('handlebars');
  /** setup email data with unicode symbols **/
  const mailData = commonFunctions.emailTypes(userData, type), email = userData.email;
  let template = handleBars.compile(mailData.template);

  let result = template(mailData.data);

  let emailToSend = {
    to: email,
    from: CONFIG.SMTP.SENDER,
    subject: mailData.Subject,
    html: result
  }
  return await transporter.sendMail(emailToSend);
};


commonFunctions.emailTypes = (user, type) => {
  let EmailStatus = {
    Subject: '',
    data: {},
    template: ''
  };
  switch (type) {

    case CONSTANTS.EMAIL_TYPES.ACCOUNT_RESTORATION_EMAIL:
      EmailStatus['Subject'] = CONSTANTS.EMAIL_SUBJECTS.ACCOUNT_RESTORATION_EMAIL;
      EmailStatus.template = CONSTANTS.EMAIL_CONTENTS.ACCOUNT_RESTORATION_EMAIL;
      EmailStatus.data['name'] = user.name;
      EmailStatus.data['confirmationLink'] = user.confirmationLink;
      break;

    default:
      EmailStatus['Subject'] = 'Welcome Email!';
      break;
  }
  return EmailStatus;
};

commonFunctions.renderTemplate = (template, data) => {
  return handlebars.compile(template)(data);
};

/**
 * function to create reset password link.
 */
commonFunctions.createResetPasswordLink = (userData) => {
  let dataForJWT = { _id: userData._id, Date: Date.now, email: userData.email };
  let resetPasswordLink = CONFIG.SERVER_URL + '/v1/user/resetpassword/' + commonFunctions.encryptJwt(dataForJWT);
  return resetPasswordLink;
};

/**
 * function to create reset password link.
 */
commonFunctions.createAccountRestoreLink = (userData) => {
  let dataForJWT = { previousAccountId: userData._id, Date: Date.now, email: userData.email, newAccountId: userData.newAccountId };
  let accountRestoreLink = CONFIG.SERVER_URL + '/v1/user/restore/' + commonFunctions.encryptJwt(dataForJWT);
  return accountRestoreLink;
};

/**
 * function to generate random alphanumeric string
 */
commonFunctions.generateAlphanumericString = (length) => {
  let chracters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var randomString = '';
  for (var i = length; i > 0; --i) randomString += chracters[Math.floor(Math.random() * chracters.length)];
  return randomString;
};

/**
 * function to generate random alphabet string
 */
commonFunctions.generateCharacterString = (length) => {
  let chracters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var randomString = '';
  for (var i = length; i > 0; --i) randomString += chracters[Math.floor(Math.random() * chracters.length)];
  return randomString;
};

module.exports = commonFunctions;

