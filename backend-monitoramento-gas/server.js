require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { connectDB, getDB } = require("./db");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

let ultimaLeitura = {
  deviceId: null,
  sensor: "MQ-9",
  valor: 0,
  limite: 830,
  status: "NORMAL",
  ameaca: false,
  dataHora: null
};

app.get("/", (req, res) => {
  res.json({
    mensagem: "Backend de monitoramento ambiental ativo com MongoDB"
  });
});

app.get("/api/latest", (req, res) => {
  res.json(ultimaLeitura);
});

app.get("/api/readings", async (req, res) => {
  try {
    const db = getDB();

    const leituras = await db
      .collection("leituras")
      .find()
      .sort({ dataHora: -1 })
      .limit(20)
      .toArray();

    res.json(leituras);
  } catch (error) {
    console.error("Erro ao buscar leituras:", error);

    res.status(500).json({
      erro: "Erro ao buscar leituras no MongoDB"
    });
  }
});

app.get("/api/alerts", async (req, res) => {
  try {
    const db = getDB();

    const alertas = await db
      .collection("leituras")
      .find({ ameaca: true })
      .sort({ dataHora: -1 })
      .limit(20)
      .toArray();

    res.json(alertas);
  } catch (error) {
    console.error("Erro ao buscar alertas:", error);

    res.status(500).json({
      erro: "Erro ao buscar alertas no MongoDB"
    });
  }
});

app.post("/api/sensor", async (req, res) => {
  try {
    const { deviceId, valor, limite } = req.body;

    if (valor === undefined) {
      return res.status(400).json({
        erro: "O campo valor é obrigatório"
      });
    }

    const valorNumerico = Number(valor);
    const limiteSensor = Number(limite || 830);
    const ameaca = valorNumerico > limiteSensor;

    ultimaLeitura = {
      deviceId: deviceId || "ESP32-01",
      sensor: "MQ-9",
      valor: valorNumerico,
      limite: limiteSensor,
      status: ameaca ? "AMEACA_DE_FOGO_OU_GAS" : "NORMAL",
      ameaca,
      dataHora: new Date()
    };

    const db = getDB();

    await db.collection("leituras").insertOne(ultimaLeitura);

    console.log("Leitura salva no MongoDB:", ultimaLeitura);

    io.emit("sensor:update", ultimaLeitura);

    if (ameaca) {
      io.emit("fire:alert", {
        mensagem: "Possível ameaça de fogo ou gás detectada!",
        ...ultimaLeitura
      });
    }

    return res.status(201).json({
      mensagem: "Leitura recebida e salva com sucesso",
      dados: ultimaLeitura
    });
  } catch (error) {
    console.error("Erro ao salvar leitura:", error);

    return res.status(500).json({
      erro: "Erro interno ao salvar leitura"
    });
  }
});

io.on("connection", (socket) => {
  console.log("Aplicativo conectado:", socket.id);

  socket.emit("sensor:update", ultimaLeitura);

  socket.on("disconnect", () => {
    console.log("Aplicativo desconectado:", socket.id);
  });
});

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();

    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error("Erro ao iniciar servidor:", error);
    process.exit(1);
  }
}

startServer();