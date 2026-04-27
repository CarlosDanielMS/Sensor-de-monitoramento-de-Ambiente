import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Alert,
  Vibration
} from "react-native";
import { io } from "socket.io-client";
import { API_URL } from "../../constants/api";

const LIMITE_ALERTA_FRONT = 830;

type DadosSensor = {
  deviceId?: string;
  sensor?: string;
  valor: number;
  limite?: number;
  status: string;
  ameaca?: boolean;
  dataHora?: string;
};

export default function HomeScreen() {
  const [conectado, setConectado] = useState(false);
  const alertaLiberado = useRef(true);

  const [dados, setDados] = useState<DadosSensor>({
    deviceId: "ESP32-01",
    sensor: "MQ-9",
    valor: 0,
    limite: LIMITE_ALERTA_FRONT,
    status: "AGUARDANDO",
    ameaca: false,
    dataHora: ""
  });

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"]
    });

    socket.on("connect", () => {
      console.log("Conectado ao backend");
      setConectado(true);
    });

    socket.on("disconnect", () => {
      console.log("Desconectado do backend");
      setConectado(false);
    });

    socket.on("sensor:update", (data: DadosSensor) => {
      processarLeitura(data);
    });

    socket.on("fire:alert", (data: DadosSensor) => {
      processarLeitura(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function processarLeitura(data: DadosSensor) {
    const valorAtual = Number(data.valor);
    const existeAmeaca = valorAtual > LIMITE_ALERTA_FRONT;

    const dadosAtualizados: DadosSensor = {
      ...data,
      limite: LIMITE_ALERTA_FRONT,
      ameaca: existeAmeaca,
      status: existeAmeaca ? "AMEACA_DE_FOGO_OU_GAS" : "NORMAL"
    };

    setDados(dadosAtualizados);

    if (existeAmeaca && alertaLiberado.current) {
      alertaLiberado.current = false;

      Vibration.vibrate([0, 500, 300, 500]);

      Alert.alert(
        "Alerta de possível ameaça!",
        `O sensor detectou o valor ${valorAtual}, acima do limite ${LIMITE_ALERTA_FRONT}. Verifique o ambiente.`,
        [{ text: "Entendi" }]
      );
    }

    if (!existeAmeaca) {
      alertaLiberado.current = true;
    }
  }

  const ameaca = dados.valor > LIMITE_ALERTA_FRONT;

  return (
    <SafeAreaView style={[styles.container, ameaca ? styles.fundoAlerta : styles.fundoNormal]}>
      <View style={styles.card}>
        <Text style={styles.titulo}>Monitoramento Ambiental</Text>

        <Text style={styles.subtitulo}>
          ESP32 + MQ-9 + Node.js
        </Text>

        <View style={styles.bloco}>
          <Text style={styles.label}>Conexão com o backend</Text>
          <Text style={conectado ? styles.conectado : styles.desconectado}>
            {conectado ? "Conectado" : "Desconectado"}
          </Text>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.label}>Sensor</Text>
          <Text style={styles.valor}>{dados.sensor || "MQ-9"}</Text>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.label}>Valor atual</Text>
          <Text style={styles.valorGrande}>{dados.valor}</Text>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.label}>Limite de alerta no app</Text>
          <Text style={styles.valor}>{LIMITE_ALERTA_FRONT}</Text>
        </View>

        <View style={styles.statusBox}>
          <Text style={styles.label}>Status</Text>

          <Text style={ameaca ? styles.textoAlerta : styles.textoNormal}>
            {ameaca ? "POSSÍVEL AMEAÇA DE FOGO OU GÁS" : "AMBIENTE NORMAL"}
          </Text>
        </View>

        <Text style={styles.rodape}>
          Última leitura: {dados.dataHora || "aguardando dados..."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  fundoNormal: {
    backgroundColor: "#0f172a"
  },
  fundoAlerta: {
    backgroundColor: "#7f1d1d"
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    elevation: 6
  },
  titulo: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center"
  },
  subtitulo: {
    fontSize: 15,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24
  },
  bloco: {
    marginBottom: 18
  },
  label: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4
  },
  valor: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827"
  },
  valorGrande: {
    fontSize: 44,
    fontWeight: "bold",
    color: "#111827"
  },
  conectado: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#15803d"
  },
  desconectado: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#b91c1c"
  },
  statusBox: {
    marginTop: 10,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f3f4f6"
  },
  textoNormal: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#15803d",
    textAlign: "center"
  },
  textoAlerta: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#b91c1c",
    textAlign: "center"
  },
  rodape: {
    marginTop: 20,
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center"
  }
});