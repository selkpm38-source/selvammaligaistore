'use strict';

const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('strictQuery', true);

let connectPromise = null;

function connect() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (!connectPromise) {
    connectPromise = mongoose
      .connect(env.mongoUri, {
        serverSelectionTimeoutMS: 8000,
      })
      .then(() => mongoose.connection)
      .catch((err) => {
        connectPromise = null; // allow retry on next request
        throw err;
      });
  }

  return connectPromise;
}

async function healthCheck() {
  await connect();
  await mongoose.connection.db.admin().ping();
}

module.exports = {
  mongoose,
  connect,
  healthCheck,
};
