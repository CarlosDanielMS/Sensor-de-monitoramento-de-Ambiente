const { MongoClient } = require("mongodb");

let client;
let database;

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  const databaseName = process.env.MONGODB_DATABASE;

  if (!uri) {
    throw new Error("MONGODB_URI não configurada no .env");
  }

  if (!databaseName) {
    throw new Error("MONGODB_DATABASE não configurado no .env");
  }

  client = new MongoClient(uri);

  await client.connect();

  database = client.db(databaseName);

  console.log("Conectado ao MongoDB Atlas com sucesso!");
}

function getDB() {
  if (!database) {
    throw new Error("Banco de dados ainda não conectado.");
  }

  return database;
}

module.exports = {
  connectDB,
  getDB
};