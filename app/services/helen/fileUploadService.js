const AWS = require('aws-sdk');
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const CONFIG = require('../../../config');
const fileUploadService = {};
AWS.config.update({ accessKeyId: CONFIG.s3Bucket.accessKeyId, secretAccessKey: CONFIG.s3Bucket.secretAccessKey });
let s3Bucket = new AWS.S3();
const { AVAILABLE_EXTENSIONS_FOR_FILE_UPLOADS, SERVER, MESSAGES, ERROR_TYPES } = require(`../../utils/constants`);
const HELPERS = require("../../helpers");

/**
 * function to upload a file to s3(AWS) bucket.
 */
fileUploadService.uploadFileToS3 = (payload, fileName, bucketName) => {
    return new Promise((resolve, reject) => {
        s3Bucket.upload({
            Bucket: bucketName || CONFIG.s3Bucket.bucketName,
            Key: fileName,
            Body: payload.file.buffer,
            ACL: 'public-read',
        }, function (err, data) {
            if (err) {
                console.log('Error here', err);
                return reject(err);
            }
            resolve(data.Location);
        });
    });
};

/**
 * function to upload file to local server.
 */
fileUploadService.uploadFileToLocal = async (payload, fileName, pathToUpload, pathOnServer) => {
    let directoryPath = pathToUpload ? pathToUpload : path.resolve(__dirname + `../../../..${CONFIG.PATH_TO_UPLOAD_SUBMISSIONS_ON_LOCAL}/${payload.user._id}`);
    // create user's directory if not present.
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
    }
    let fileSavePath = `${directoryPath}/${fileName}`;
    let writeStream = fs.createWriteStream(fileSavePath);
    return new Promise((resolve, reject) => {
        writeStream.write(payload.file.buffer);
        writeStream.on('error', function (err) {
            reject(err);
        });
        writeStream.end(function (err) {
            if (err) {
                reject(err);
            } else {
                let fileUrl = pathToUpload ? `${CONFIG.server.URL}${pathOnServer}/${fileName}` : `${CONFIG.SERVER_URL}${CONFIG.PATH_TO_UPLOAD_SUBMISSIONS_ON_LOCAL}/${payload.user._id}/${fileName}`;
                resolve(fileUrl);
            }
        });
    });
};

/**
 * function to upload a file on either local server or on s3 bucket.
 */
fileUploadService.uploadFile = async (payload, pathToUpload, pathOnServer) => {
    let fileExtention = payload.file.originalname.split('.')[1];
    if (AVAILABLE_EXTENSIONS_FOR_FILE_UPLOADS.indexOf(fileExtention) !== -(SERVER.ONE)) {
        let fileName = `upload_${Date.now()}.${fileExtention}`, fileUrl = '';
        let UPLOAD_TO_S3 = process.env.UPLOAD_TO_S3 ? process.env.UPLOAD_TO_S3 : '';
        if (UPLOAD_TO_S3.toLowerCase() === 'true') {
            let s3BucketName = CONFIG.s3Bucket.normalFilesPath;
            fileUrl = await fileUploadService.uploadFileToS3(payload, fileName, s3BucketName);
        } else {
            fileUrl = await fileUploadService.uploadFileToLocal(payload, fileName, pathToUpload, pathOnServer);
        }
        return fileUrl;
    }
    throw HELPERS.responseHelper.createErrorResponse(MESSAGES.INVALID_FILE_TYPE, ERROR_TYPES.BAD_REQUEST);
};

/**
 * function to upload file to local server.
 */
fileUploadService.uploadMultipleFilesToLocal = async (payload, pathToUpload) => {
    console.log('uploading multiple files ', payload.files.length);
    let directoryPath = pathToUpload;
    // create user's directory if not present.
    fse.ensureDirSync(directoryPath);
    const promises = payload.files.map(file => {
        console.log(file.originalname);
        let fileSavePath = `${directoryPath}/${file.originalname}`;
        const writeStream = fs.createWriteStream(fileSavePath);
        return new Promise((resolve, reject) => {
            writeStream.write(file.buffer);
            writeStream.on('error', reject);
            writeStream.end(err => {
                if (err) reject(err)
                else {
                    resolve(file.originalname);
                }
            });
        });
    });
    return Promise.all(promises);
};

/**
 * function to delete the multiple files from local
 */

fileUploadService.deleteMultipleFilesFromLocal = async (payload, pathToDelete) => {
    console.log('deleting multiple files ');
    let directoryPath = pathToDelete;
    let promises = [];
    for (let index = 0; index < payload.fileNames.length; index++) {
        let fileName = payload.fileNames[index];
        let fileDeletePath = `${directoryPath}/${fileName}`;
        if (!fs.existsSync(fileDeletePath)) continue;
        let promise = new Promise((resolve, reject) => {
            fs.unlink(fileDeletePath, err => {
                if (err) reject(err)
                else resolve('ok');
            });
        });
        promises[index] = promise;
    }
    return Promise.all(promises);
}

module.exports = fileUploadService;