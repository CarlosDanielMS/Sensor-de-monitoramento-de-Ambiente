const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

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
  limite: 1500,
  status: "NORMAL",
  ameaca: false,
  dataHora: null
};

app.get("/", (req, res) => {
  res.json({
    mensagem: "Backend de monitoramento de gás/fogo ativo"
  });
});

app.get("/api/latest", (req, res) => {
  res.json(ultimaLeitura);
});

app.post("/api/sensor", (req, res) => {
  const { deviceId, valor, limite } = req.body;

  if (valor === undefined) {
    return res.status(400).json({
      erro: "O campo valor é obrigatório"
    });
  }

  const limiteSensor = limite || 1500;
  const ameaca = valor >= limiteSensor;

  ultimaLeitura = {
    deviceId: deviceId || "ESP32-01",
    sensor: "MQ-9",
    valor,
    limite: limiteSensor,
    status: ameaca ? "AMEACA_DE_FOGO_OU_GAS" : "NORMAL",
    ameaca,
    dataHora: new Date().toISOString()
  };

  console.log("Leitura recebida:", ultimaLeitura);

  io.emit("sensor:update", ultimaLeitura);

  if (ameaca) {
    io.emit("fire:alert", {
      mensagem: "Possível ameaça de fogo ou gás detectada!",
      ...ultimaLeitura
    });
  }

  return res.status(201).json({
    mensagem: "Leitura recebida com sucesso",
    dados: ultimaLeitura
  });
});

io.on("connection", (socket) => {
  console.log("Aplicativo conectado:", socket.id);

  socket.emit("sensor:update", ultimaLeitura);

  socket.on("disconnect", () => {
    console.log("Aplicativo desconectado:", socket.id);
  });
});

const PORT = 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});