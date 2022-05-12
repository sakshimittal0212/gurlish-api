const jwt = require('jsonwebtoken');

const { SECURITY, MESSAGES, ERROR_TYPES, NORMAL_PROJECTION } = require('../../utils/constants');
const HELPERS = require("../../helpers");
const { userModel, sessionModel, testUserModel } = require(`../../models`);

let authService = {};

/**
 * function to authenticate user and attach user to request
 * @param {*} request 
 */
const authenticateUser = async (request) => {
    try {
        // authenticate JWT token and attach user to request object (request.user)
        let decodedToken = jwt.verify(request.headers.authorization, SECURITY.JWT_SIGN_KEY);
        let authenticatedUser = await userModel.findOne({ _id: decodedToken.id }, { ...NORMAL_PROJECTION, password: 0 }).lean();
        if (!authenticatedUser) {
            throw HELPERS.responseHelper.createErrorResponse(MESSAGES.UNAUTHORIZED, ERROR_TYPES.UNAUTHORIZED);
        }
        request.user = authenticatedUser;
        return authenticatedUser;
    } catch (err) {
        throw HELPERS.responseHelper.createErrorResponse(MESSAGES.UNAUTHORIZED, ERROR_TYPES.UNAUTHORIZED);
    }
}


/**
 * fucntion to authorise user according to its role
 * @param {*} request 
 * @param {*} roles 
 */
const authoriseUser = (request, roles) => {
    if (roles.length && !roles.includes(request.user.role)) {
        // user's role is not authorized to access the resource
        throw HELPERS.responseHelper.createErrorResponse(MESSAGES.FORBIDDEN, ERROR_TYPES.FORBIDDEN);
    }
    return true;
}


/**
 * function to check authentication and authorisation for user.
 * @param {*} roles authorised roles array
 */

authService.validateUser = (roles = []) => {
    return (request, response, next) => {
        authenticateUser(request)
            .then(user => {
                authoriseUser(request, roles);
                // authentication and authorization successful
                return next();
            })
            .catch(err => {
                response.status(err.statusCode).json(err);
            })
    };
};

/**
 * function to authenticate socket users
 */
authService.socketAuthentication = async (socket, next) => {
    try {
        // const token = socket.handshake.query.authToken;
        const token = socket.handshake.query.userName;
        console.log(token);
        if (token) {
            // const socketUser = await sessionModel.findOne({ token: token}).lean();
            const socketUser = await userModel.findOne({ userName: token }).lean();
            if (socketUser) {
                // socket.id = socketUser.userId;
                socket.id = socketUser._id;
                console.log("socketId", socket.id);
                return next();
            }
            else {
                return next(new Error("Socket authentication Error"));
            }
        }
        return next(new Error("Socket authentication Error"));
    } catch (err) {
        return next(new Error("Socket unhandled authentication Error"));
    }
};

module.exports = authService;