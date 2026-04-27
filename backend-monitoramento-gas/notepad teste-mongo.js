require("dotenv").config();

const { MongoClient } = require("mongodb");

async function testarMongo() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();

    const db = client.db(process.env.MONGODB_DATABASE);

    const resultado = await db.collection("teste").insertOne({
      mensagem: "Conexão com MongoDB Atlas funcionando",
      dataHora: new Date()
    });

    console.log("Conectado ao MongoDB Atlas com sucesso!");
    console.log("Documento inserido com ID:", resultado.insertedId);
  } catch (error) {
    console.error("Erro ao conectar no MongoDB Atlas:");
    console.error(error);
  } finally {
    await client.close();
  }
}

testarMongo();