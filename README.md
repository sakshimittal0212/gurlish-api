# Gurlish

## To run this project on your machine install these dependencies on your local machine(If  you have already these then ignore these steps):

1. Start mongodb on your local machine. To install mongodb on your machine refer this link: https://www.mongodb.com/ to download mongodb.
2. Install node on your machine using this link: https://nodejs.org/en/

### After installing the above dependencies then run the following commands to run the node server:

`npm install`: run this command to install all the dependencies required by the node server.
`node server.js`: run this command to start the node server on your local machine.

After executing the above commands you will the see the output like this: 
Mongo connected at  mongodb://127.0.0.1:27017/gurlish
Node server running on  http://localhost:5000

##### For swagger documentation of APIs, refer this link on your browser: http://localhost:5000/documentation

First of all you've to make a copy of `.env.example` file to `.env` file under your project directory so that all the enviornment variables are loaded from `.env` file in server.

## Environment variables documentation: 
**SERVER_HOST**: This variable is used to define the server host where our node server is running. This is to be used internally in the docker configurations. Default goes to `0.0.0.0` or `localhost`.
**SERVER_PORT**: Server port on which our node server will run. This is to be used internally in the docker configurations. Default is `5000`.
**DOMAIN_PROTOCOL**: Protocol on which our node server is running or not. 
**SERVER_URL**: This variable basically refers to assets URL on which our public images can access. Default is `http://localhost:5000`.
**DB_PROTOCOL**: This belongs to the protocol of mongo database. Default is `mongodb`.
**DB_HOST**: This belongs to the host of mongo database. Default is `127.0.0.1`.
**DB_PORT**: This belongs to the port of our mongo database on which it is running. Default is `27017`.
**DB_NAME**: This belongs to the name of our mongo database. Default is `gurlish`.
**NODE_ENV**: This belongs to the working enviornment of node server. Default is `development`.
**PLATFORM**: This belongs to the platform for which we are running our server. Default is `gurlish`.