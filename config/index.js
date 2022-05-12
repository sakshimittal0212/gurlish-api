const path = require('path');
const lodash = require('lodash');

var development = require('./env/development');
var production = require('./env/production');
var staging = require('./env/staging');


var PLATFORM = process.env.PLATFORM || 'helen';
var mongoUri = 'mongodb://localhost:27017/helen';



var defaults = {
    PLATFORM: PLATFORM,
    root: path.normalize(__dirname + '/../app'),
    theme: PLATFORM + '/us',
    mongoUri: mongoUri,
    adminEmail: 'admin@admin.com',
    host: 'helendomain.com',
    SENDGRID_API_KEY: 'CHANGEME',
    environment: process.env.NODE_ENV || 'production',
    show: function () {
        console.log('environment: ' + this.environment);
    },
    SENDINBLUE: {
        API_KEY: 'dummy',
        SENDER_EMAIL: 'contact@demo.in'
    },
    COCOS_PROJECT_PATH: {
        TEMPLATE_ACTIVITY_PATH: '/template-activities',
        TEMPLATE_ACTIVITY_PREVIEW:'/template-activity-preview',
        BASE_PATH: '/HelenDron-Cocos2d',
        ACTIVITY_DIRECTORY_PATH:'/cloned-activities',
        LESSON_DIRECTORY_PATH:'/cloned-lessons',
        ACTIVITY_PREVIEW_PATH:'/activity-preview',
        ACTIVITY_RESOURCE_DIRECTORY_PATH:'/res',   
        ACTIVITY_CONFIG_PATH:'/config.json',
        ACTIVITY_SRC_PATH: '/src/index.js',
        LESSON_PATH:'/lesson-created'       
    },
    SMTP: {
        TRANSPORT: {
            host: process.env.NODEMAILER_HOST || `node-mailer-host-name`,
            service: process.env.NODEMAILER_SERVICE || `node-mailer-service`,
            auth: {
                user: process.env.NODEMAILER_USER || `node-mailer-user`,
                pass: process.env.NODEMAILER_PASSWORD || `node-mailer-password`
            },
            secure: false,
            tls: { rejectUnauthorized: false },
        },
        SENDER: 'Helen <helen@demo.co.in>',
    },
    FCM: {
        API_KEY: 'FCM_API_KEY'
    },

    ENV_STAGING: "staging",
    ENV_DEVELOPMENT: "development",
    ENV_PRODUCTION: "production",
    environment: process.env.NODE_ENV || 'development',
    mongoDB: {
        PROTOCOL: process.env.DB_PROTOCOL || 'mongodb',
        HOST: process.env.DB_HOST || '127.0.0.1',
        PORT: process.env.DB_PORT || 27017,
        NAME: process.env.DB_NAME || PLATFORM,
        USER: '',
        PASSWORD: '',
        get URL() { return process.env.dbUrl || `${this.PROTOCOL}://${this.HOST}:${this.PORT}/${this.NAME}` }
    },
    domain: {
        PROTOCOL: process.env.DOMAIN_PROTOCOL || 'http',
        HOST: process.env.DOMAIN_HOST || '127.0.0.1',
        PORT: process.env.DOMAIN_PORT ? process.env.DOMAIN_PORT : '5000',
        get URL() { return `${this.PROTOCOL}://${this.HOST}${!!this.PORT ? ':' + this.PORT : ''}` }
    },
    server: {
        PROTOCOL: process.env.SERVER_PROTOCOL || 'http',
        HOST: process.env.SERVER_HOST || '0.0.0.0',
        PORT: process.env.SERVER_PORT || '3002',
        get URL() { return `${this.PROTOCOL}://${this.HOST}:${this.PORT}` }
    },
    PATH_FOR_LOCAL: process.env.PATH_FOR_LOCAL || '/uploads/',
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',
    s3Bucket: {
        accessKeyId: process.env.ACCESS_KEY_ID || 'access-key-id',
        secretAccessKey: process.env.SECRET_ACCESS_KEY || 'secret-access-key',
        bucketName: process.env.S3_BUCKET_NAME || 'bucket-name'
    },
    REDIS: {
        PORT: process.env.REDIS_PORT || '6379',
        HOST: process.env.REDIS_HOST || '127.0.0.1'
    },
    SERVER_URL: process.env.SERVER_URL || 'http://localhost:5000',
    PATH_TO_UPLOAD_FILES_ON_LOCAL: process.env.PATH_TO_UPLOAD_FILES_ON_LOCAL || '/uploads/files',
};

let currentEnvironment = process.env.NODE_ENV || 'production';

function myConfig(myConfig) {
    let mergedConfig = lodash.extend(lodash.clone(defaults), myConfig);
    return mergedConfig;
};

module.exports = {
    development: myConfig(development),
    production: myConfig(production),
    staging: myConfig(staging)
}[currentEnvironment];


