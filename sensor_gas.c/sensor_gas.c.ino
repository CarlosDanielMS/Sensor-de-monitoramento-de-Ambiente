#include <WiFi.h>
#include <HTTPClient.h>

#define SENSOR_GAS 34

const char* ssid = "DANIELECAMILA";
const char* password = "@Satoshi12";

const char* serverUrl = "http://192.168.1.4:3000/api/sensor";

int limiteGas = 1500;

void setup() {
  Serial.begin(115200);
  delay(1000);

  analogReadResolution(12);
  analogSetPinAttenuation(SENSOR_GAS, ADC_11db);

  Serial.println("Conectando ao Wi-Fi...");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("Wi-Fi conectado!");
  Serial.print("IP do ESP32: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  int valorGas = analogRead(SENSOR_GAS);

  Serial.print("Valor MQ-9: ");
  Serial.println(valorGas);

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;

    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String json = "{";
    json += "\"deviceId\":\"ESP32-01\",";
    json += "\"valor\":";
    json += valorGas;
    json += ",";
    json += "\"limite\":";
    json += limiteGas;
    json += "}";

    int httpResponseCode = http.POST(json);

    Serial.print("Resposta HTTP: ");
    Serial.println(httpResponseCode);

    String resposta = http.getString();
    Serial.println(resposta);

    http.end();
  } else {
    Serial.println("Wi-Fi desconectado.");
  }

  delay(2000);
}