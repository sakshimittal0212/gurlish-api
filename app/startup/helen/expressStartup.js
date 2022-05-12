"use strict";

const express = require('express');
const cors = require('cors');
const routes = require('../../routes');
const routeUtils = require('../../utils/routeUtils');
const dbUtils = require(`../../utils/dbUtils`);
const COMMON_FUN = require('../../utils/utils');

module.exports = async function (app) {

    app.use(require("body-parser").json({ limit: '50mb' }));
    app.use(require("body-parser").urlencoded({ limit: '50mb', extended: true }));


    /** middleware for api's logging with deployment mode */
    let apiLogger = (req, res, next) => {
        COMMON_FUN.messageLogs(null, `api hitted ${req.url} ${req.method} ${process.env.NODE_ENV}`);
        next();
    };


    /********************************
    ***** For handling CORS Error ***
    *********************************/
    // app.all('/*', (request, response, next) => {
    //     response.header('Access-Control-Allow-Origin', '*');
    //     response.header('Access-Control-Allow-Headers', 'Content-Type, api_key, Authorization, x-requested-with, Total-Count, Total-Pages, Error-Message');
    //     response.header('Access-Control-Allow-Methods', 'POST, GET, DELETE, PUT, OPTIONS');
    //     response.header('Access-Control-Max-Age', 1800);
    //     next();
    // });
    // Enable cors
    app.use(cors());

    // serve static folder.
    app.use('/public', express.static('public'));
    app.use('/uploads', express.static('uploads'));

    //rewrite path
    // app.get('/lesson-preview/:lessonPath', function (req, res) {
    //     res.sendFile(path.join(lessonDirectoryPath +"/"+ lessonPath + '/index.html'));
    // });

    /** Used logger middleware for each api call **/
    app.use(apiLogger);

    // initialize mongodb 
    await require('../db_mongo')();
    //Db Migrations.
    await dbUtils.migrateDatabase();

    // initalize routes.
    await routeUtils.route(app, routes);
};
