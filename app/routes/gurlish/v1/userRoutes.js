'use strict';

const { Joi } = require('../../../utils/joiUtils');
const { USER_ROLE } = require(`../../../utils/constants`);
//load controllers
const { getServerResponse, loginUser, createAndUpdateUser, getGameData, uploadFile } = require(`../../../controllers/gurlish/userController`);

let routes = [
	{
		method: 'GET',
		path: '/v1/serverResponse/',
		joiSchemaForSwagger: {
			group: 'User',
			description: 'Route to get server response (Is server working fine or not?).',
			model: 'SERVER'
		},
		// auth: [USER_ROLE.STUDENT, USER_ROLE.TEACHER],
		handler: getServerResponse
	},
	{
		method: 'POST',
		path: '/v1/user/',
		joiSchemaForSwagger: {
			body: {
				email: Joi.string().email().optional().description('User\'s email.'),
				password: Joi.string().optional().description('User\'s password.'),
				userName: Joi.string().optional().description('User\'s user name.'),
				firstName: Joi.string().optional().description('User\'s first name.'),
				lastName: Joi.string().optional().description('User\'s last name.'),
				contactNumber: Joi.string().optional().description('User\'s contact number.'),
				operationType: Joi.number().required().description('Operation type. 1 for create, 2 for update & 3 for delete.')
			},
			group: 'User',
			description: 'Route to create/update/Delete a user.',
			model: 'CRUD_USER'
		},
		handler: createAndUpdateUser
	},
	{
		method: "GET",
		path: "/contest/getActiveDailyVotingContest",
		joiSchemaForSwagger: {
			query: Joi.object({
				limit: Joi.number().min(0).default(10).description("Pagination limit."),
				offset: Joi.number()
					.min(0)
					.default(10)
					.description("Pagination offset."),
			}),
			responses: {
				200: {
					description: "Tcreated",
					body: Joi.object({
						title: Joi.string().required().description("User's name."),
						designation: Joi.string().required().description("User's name."),
					}).unknown(),
				},
				500: {
					description: "Some server error",
				},
				404: {
					body: Joi.object({
						err: Joi.string().description("Resource not found"),
					}),
				},
			},
			group: "User",
			description: "Route to register a user.",
			model: "VOTING_CONTEST",
		},
		handler: createAndUpdateUser
	},
	{
		method: 'POST',
		path: '/v1/user/login',
		joiSchemaForSwagger: {
			body: {
				email: Joi.string().email().required().description('User\'s email Id.'),
				password: Joi.string().required().description('User\'s password.')
			},
			group: 'User',
			description: 'Route to login a user.',
			model: 'Login'
		},
		handler: loginUser
	},
	{
		method: 'POST',
		path: '/v1/uploadFile',
		joiSchemaForSwagger: {
			formData: {
				file: Joi.file({ name: "file" })
			},
			group: 'File',
			description: 'Route to upload a file.',
			model: 'FILE_UPLOAD'
		},
		auth: false,
		handler: uploadFile
	}
];

module.exports = routes;




