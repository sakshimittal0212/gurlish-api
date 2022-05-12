'use strict';
const { userModel } = require(`../../models`);

let userService = {};

/**
 * function to fetch user from the system based on criteria.
 */
userService.getUser = async (criteria, projection) => {
  return await userModel.findOne(criteria, projection).lean();
};

/**
 * function to update user. 
 */
userService.updateUser = async (criteria = {}, dataToUpdate = {}, options = {}) => {
  return await userModel.findOneAndUpdate(criteria, dataToUpdate, options).lean();
};

module.exports = userService;