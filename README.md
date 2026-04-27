# Sistema IoT de Monitoramento Ambiental com ESP32, MQ-9, Node.js e React Native

Projeto acadêmico de monitoramento ambiental utilizando **ESP32**, sensor **MQ-9**, backend em **Node.js** e aplicativo mobile em **React Native com Expo**.

O sistema realiza a leitura do sensor MQ-9, envia os dados para um backend Node.js e exibe as informações em tempo real no aplicativo mobile. Quando o valor do sensor ultrapassa o limite configurado, o aplicativo alerta o usuário sobre uma possível ameaça de fogo, fumaça ou gás.

---

## Tecnologias utilizadas

### Hardware

- ESP32
- Sensor MQ-9
- Jumpers
- Cabo USB
- Protoboard, opcional

### Backend

- Node.js
- Express
- Socket.IO
- CORS

### Mobile

- React Native
- Expo
- Socket.IO Client

---

## Estrutura do projeto

```txt
sensor de ambiente/
│
├── backend-monitoramento-gas/
│   ├── server.js
│   ├── package.json
│   └── node_modules/
│
├── app-monitoramento-gas/
│   ├── app/
│   │   └── (tabs)/
│   │       └── index.tsx
│   ├── constants/
│   │   └── api.ts
│   ├── package.json
│   └── node_modules/
│
├── sensor_gas.c/
│   └── sensor_gas.ino
│
└── README.md
```

---

## Funcionamento geral

```txt
Sensor MQ-9 detecta fumaça/gás
        ↓
ESP32 lê o valor analógico no GPIO 34
        ↓
ESP32 envia os dados via Wi-Fi para o backend Node.js
        ↓
Backend processa os dados
        ↓
Backend envia os dados em tempo real via Socket.IO
        ↓
Aplicativo React Native exibe o valor e alerta o usuário
```

---

## Ligações do sensor MQ-9 no ESP32

| MQ-9 | ESP32 |
|---|---|
| VCC | VIN / 5V |
| GND | GND |
| A0 | GPIO 34 |
| D0 | Não utilizado |

> Observação: o ideal é utilizar um divisor de tensão no pino A0 para proteger o ESP32, pois o ESP32 trabalha com entrada analógica de até 3.3V.

---

## Configuração do backend Node.js

Entre na pasta do backend:

```powershell
cd "C:\Users\carlo\Documents\Arduino\sensor de ambiente\backend-monitoramento-gas"
```

Instale as dependências:

```powershell
npm.cmd install
```

Caso esteja criando o projeto do zero, instale:

```powershell
npm.cmd install express cors socket.io
npm.cmd install nodemon -D
```

Execute o backend em modo desenvolvimento:

```powershell
npm.cmd run dev
```

Ou execute diretamente:

```powershell
node server.js
```

O backend deve iniciar na porta `3000`.

Exemplo de retorno esperado:

```txt
Servidor rodando na porta 3000
```

---

## Rotas do backend

### Teste inicial

```txt
GET /
```

Retorna uma mensagem informando que o backend está ativo.

### Última leitura

```txt
GET /api/latest
```

Retorna a última leitura recebida do sensor.

### Enviar leitura do sensor

```txt
POST /api/sensor
```

Exemplo de JSON:

```json
{
  "deviceId": "ESP32-01",
  "valor": 900,
  "limite": 830
}
```

Quando o valor passa do limite, o backend envia um evento em tempo real para o aplicativo mobile.

---

## Teste do backend pelo navegador

Com o servidor rodando, acesse:

```txt
http://localhost:3000
```

Para consultar a última leitura:

```txt
http://localhost:3000/api/latest
```

---

## Teste do backend pelo Postman

Faça uma requisição `POST` para:

```txt
http://localhost:3000/api/sensor
```

Body em JSON:

```json
{
  "deviceId": "ESP32-01",
  "valor": 900,
  "limite": 830
}
```

Se o aplicativo estiver aberto, ele deve mostrar o alerta.

Para voltar ao estado normal, envie:

```json
{
  "deviceId": "ESP32-01",
  "valor": 700,
  "limite": 830
}
```

---

## Configuração do aplicativo mobile

Entre na pasta do aplicativo:

```powershell
cd "C:\Users\carlo\Documents\Arduino\sensor de ambiente\app-monitoramento-gas"
```

Instale as dependências:

```powershell
npm.cmd install
```

Instale o Socket.IO Client, caso ainda não esteja instalado:

```powershell
npm.cmd install socket.io-client
```

Execute o aplicativo:

```powershell
npx.cmd expo start
```

Depois, abra o app **Expo Go** no celular e escaneie o QR Code.

---

## Configuração do IP do backend no mobile

No arquivo:

```txt
app-monitoramento-gas/constants/api.ts
```

Configure o IP do computador onde o backend está rodando:

```ts
export const API_URL = "http://192.168.0.105:3000";
```

Troque `192.168.0.105` pelo IPv4 do seu computador.

Para descobrir o IP no Windows:

```powershell
ipconfig
```

Procure por:

```txt
Endereço IPv4
```

> Importante: o celular e o computador precisam estar conectados na mesma rede Wi-Fi.

---

## Condição de alerta no aplicativo

No front mobile, foi configurado o limite:

```ts
const LIMITE_ALERTA_FRONT = 830;
```

Quando o valor atual do sensor passa de `830`, o aplicativo:

- muda o fundo para vermelho;
- vibra o celular;
- exibe um alerta na tela;
- mostra status de possível ameaça.

---

## Código do ESP32

O ESP32 deve estar conectado à mesma rede Wi-Fi do computador.

No código do ESP32, configure:

```cpp
const char* ssid = "NOME_DO_WIFI";
const char* password = "SENHA_DO_WIFI";
```

Configure também a URL do backend:

```cpp
const char* serverUrl = "http://192.168.0.105:3000/api/sensor";
```

Troque o IP pelo endereço IPv4 do computador.

O sensor MQ-9 deve estar conectado no pino:

```cpp
#define SENSOR_GAS 34
```

---

## Bibliotecas usadas no ESP32

No Arduino IDE, utilize:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
```

Essas bibliotecas permitem conectar o ESP32 ao Wi-Fi e enviar requisições HTTP para o backend.

---

## Como executar o projeto completo

### 1. Iniciar o backend

```powershell
cd "C:\Users\carlo\Documents\Arduino\sensor de ambiente\backend-monitoramento-gas"
npm.cmd run dev
```

### 2. Iniciar o aplicativo mobile

Em outro terminal:

```powershell
cd "C:\Users\carlo\Documents\Arduino\sensor de ambiente\app-monitoramento-gas"
npx.cmd expo start
```

Abra o app pelo Expo Go no celular.

### 3. Ligar o ESP32

Conecte o ESP32 no computador ou em uma fonte USB.

Abra o Monitor Serial da Arduino IDE para verificar se ele está conectado ao Wi-Fi e enviando dados para o backend.

---

## Possíveis problemas e soluções

### O app não conecta ao backend

Verifique se:

- o backend está rodando;
- o celular e o computador estão no mesmo Wi-Fi;
- o arquivo `constants/api.ts` está com o IP correto;
- a porta `3000` não está bloqueada pelo firewall do Windows.

### O sensor não muda o valor

Verifique se:

- o MQ-9 está ligado no `VIN/5V`;
- o GND do sensor está ligado ao GND do ESP32;
- o A0 do sensor está ligado no GPIO 34;
- o sensor aqueceu por alguns minutos;
- o teste está sendo feito com fumaça ou gás próximo ao sensor.

### O PowerShell bloqueia o npm

Use `npm.cmd` no lugar de `npm`.

Exemplo:

```powershell
npm.cmd install
npm.cmd run dev
```

### O comando git não funciona

Instale o Git no Windows:

```powershell
winget install --id Git.Git -e --source winget
```

Depois feche e abra o PowerShell novamente.

Teste:

```powershell
git --version
```

---

## Arquivo .gitignore recomendado

Na raiz do projeto, mantenha um arquivo `.gitignore` com:

```gitignore
node_modules/
.expo/
dist/
web-build/

.env
.env.local
.env.development
.env.production

*.log
.DS_Store
Thumbs.db

secrets.h
wifi_config.h
```

---

## Enviar para o GitHub

Na pasta principal do projeto:

```powershell
cd "C:\Users\carlo\Documents\Arduino\sensor de ambiente"
```

Execute:

```powershell
git init
git add .
git commit -m "Projeto IoT de monitoramento ambiental com ESP32"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/monitoramento-ambiental-esp32.git
git push -u origin main
```

Troque a URL pelo endereço real do seu repositório.

---

## Observação de segurança

Este projeto é um protótipo acadêmico e demonstrativo. Ele não deve ser utilizado como sistema real de segurança contra incêndio, vazamento de gás ou monitoramento industrial sem sensores certificados, calibração adequada, redundância e validação técnica.

---

## Objetivo acadêmico

O objetivo do projeto é demonstrar a integração entre hardware, Internet das Coisas, backend e aplicação mobile, criando um sistema capaz de monitorar um ambiente e alertar o usuário em caso de possível ameaça detectada pelo sensor.

---

## Autor

Projeto desenvolvido por Carlos Daniel Martins da Silva.
