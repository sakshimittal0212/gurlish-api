const CONSTANTS = require('../utils/constants');
const MODELS = require('../models/index');
let dbUtils = {};

/**
 * function to check valid reference from models.
 */
dbUtils.checkValidReference = async (document, referenceMapping) => {
  for (let key in referenceMapping) {
    let model = referenceMapping[key];
    if (!!document[key] && !(await model.findById(document[key]))) {
      throw CONSTANTS.RESPONSE.ERROR.BAD_REQUEST(key + ' is invalid.');
    }
  }
};

/**
 * create pagination condition for aggregateQuery with sort.
 *
 * @param {JSON} sort valid mongodb sort condition Object.
 * @param {Number} skip no. of documents to skip.
 * @param {Number} limit no. of documents to return.
 * @returns {Promise<[JSON]>} aggregate pipeline queries for pagination.
 */

dbUtils.paginateWithTotalCount = (sort, skip, limit) => {
  let condition = [
    ...(!!sort ? [{ $sort: sort }] : []),
    { $group: { _id: null, items: { $push: '$$ROOT' }, totalCount: { $sum: 1 } } },
    { $addFields: { items: { $slice: ['$items', skip, limit] } } },
  ]
  return condition;
}

/**
 * Funcion to migrate database.
 */
dbUtils.migrateDatabase = async () => {
  let dbVersion = await MODELS.versionModel.findOne();
  let version = dbVersion ? dbVersion.dbVersion : 0;
  let updatedVersion = version;
  if (version < 1) {
    // updatedVersion = 1;
  }

  if (updatedVersion !== version)
    await MODELS.versionModel.findOneAndUpdate({}, { dbVersion: updatedVersion }, { upsert: true });

  return;
};

/**
 *  function to add initial template activities.
 */
dbUtils.addInitialTemplateActivities = async () => {
  await MODELS.activityModel.insertMany(activities);
};

/**
 *  function to add initial courses.
 */
dbUtils.addInitialCourses = async () => {
  await MODELS.courseModel.insertMany(courses);
};

module.exports = dbUtils;