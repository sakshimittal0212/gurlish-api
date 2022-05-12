
'use strict';

/***********************************
 **** node module defined here *****
 ***********************************/
require('dotenv').config();
const EXPRESS = require("express");
const cluster = require('cluster');

const PORT = process.env.SERVER_PORT || 3002;

/**creating express server app for server */
const app = EXPRESS();

/********************************
 ***** Server Configuration *****
 ********************************/
app.set('port', PORT);

// configuration to setup socket.io on express server.
const server = require('http').Server(app);
// const io = require('socket.io')(server);
global.io = require('socket.io')(server);
const p2p = require('socket.io-p2p-server').Server;
global.io.use(p2p);


const NODES = 3;

{
  if (cluster.isMaster) {
    // Create NODE number of clusters
    for (let i = 0; i < NODES; i += 1) {
      cluster.fork();
    }

    // Listen for dying workers
    cluster.on("exit", (worker, code, signal) => {
      console.log(`Worker ${worker.id} died with code: ${code} and signal: ${signal}`);
      // Create another worker
      cluster.fork();
    });

    // Callback for worker going online
    cluster.on('online', (worker) => {
      console.log(`Worker ${worker.process.pid} is online`);
    });
  } else {
    startNodeserver(cluster);
  }
}


/** Server is running here */
async function  startNodeserver (cluster) {
  // express startup.
  await require(`./app/startup/helen/expressStartup`)(app);
  // start socket on server
  await require(`./app/socket/helen/socket`).connect(global.io, p2p);

  server.listen(PORT, (error) => {
    if (error) {
      return console.log('something bad happened', error);
    }
    if (cluster) {
      console.log(`Worker with ID: ${cluster.worker.id} is listening on ${PORT} ...`);
    } else {
      console.log(`Server started Listening on ${PORT} ...`);
    }
  });
  console.log("Process Environment - " + process.env.ENVIRONMENT);

};


process.on('unhandledRejection', error => {
  // Will print "unhandledRejection err is not defined"
  console.log('unhandledRejection', error);
});
