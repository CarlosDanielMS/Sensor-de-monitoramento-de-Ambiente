import csv
import os
from datetime import datetime
from collections import deque

import pandas as pd
import requests
from dash import Dash, dcc, html, dash_table, Input, Output
import plotly.express as px

# IP real do ESP32
ESP32_IP = "192.168.1.6"
ESP32_URL = f"http://{ESP32_IP}/data"

CSV_FILE = "leituras_esp32_refinado.csv"
MAX_POINTS = 300
REQUEST_TIMEOUT = 5

dados = deque(maxlen=MAX_POINTS)
ultimo_erro = "Sem erro"
sessao = requests.Session()

# Contador de movimentos / objetos
contador_movimentos = 0
objeto_ativo = False


def card_style():
    return {
        "backgroundColor": "white",
        "padding": "16px",
        "borderRadius": "12px",
        "boxShadow": "0 2px 8px rgba(0,0,0,0.08)",
        "minHeight": "95px",
        "display": "flex",
        "flexDirection": "column",
        "justifyContent": "center",
    }


def montar_card(titulo: str, valor: str):
    return [
        html.Div(titulo, style={"fontSize": "14px", "color": "#666", "marginBottom": "8px"}),
        html.Div(valor, style={"fontSize": "24px", "fontWeight": "bold"}),
    ]


def init_csv():
    if not os.path.exists(CSV_FILE):
        with open(CSV_FILE, "w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            writer.writerow([
                "hora_pc",
                "timestamp_ms",
                "distance_cm",
                "reference_distance_cm",
                "difference_cm",
                "threshold_cm",
                "detection_score",
                "object_detected",
                "servo_angle",
                "angle_cluster_start",
                "angle_cluster_end",
                "movement_count",
                "new_movement",
            ])


def append_csv(registro: dict):
    with open(CSV_FILE, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            registro["hora_pc"],
            registro["timestamp_ms"],
            registro["distance_cm"],
            registro["reference_distance_cm"],
            registro["difference_cm"],
            registro["threshold_cm"],
            registro["detection_score"],
            registro["object_detected"],
            registro["servo_angle"],
            registro["angle_cluster_start"],
            registro["angle_cluster_end"],
            registro["movement_count"],
            registro["new_movement"],
        ])


def buscar_dado_esp32():
    global ultimo_erro, contador_movimentos, objeto_ativo

    try:
        resposta = sessao.get(ESP32_URL, timeout=REQUEST_TIMEOUT)
        resposta.raise_for_status()

        payload = resposta.json()
        detectado_agora = bool(payload.get("object_detected", False))

        novo_movimento = False
        if detectado_agora and not objeto_ativo:
            contador_movimentos += 1
            novo_movimento = True

        objeto_ativo = detectado_agora

        registro = {
            "hora_pc": datetime.now().strftime("%H:%M:%S"),
            "timestamp_ms": payload.get("timestamp_ms"),
            "distance_cm": payload.get("distance_cm"),
            "reference_distance_cm": payload.get("reference_distance_cm"),
            "difference_cm": payload.get("difference_cm"),
            "threshold_cm": payload.get("threshold_cm"),
            "detection_score": payload.get("detection_score"),
            "object_detected": detectado_agora,
            "servo_angle": payload.get("servo_angle"),
            "angle_cluster_start": payload.get("angle_cluster_start"),
            "angle_cluster_end": payload.get("angle_cluster_end"),
            "movement_count": contador_movimentos,
            "new_movement": novo_movimento,
        }

        dados.append(registro)
        append_csv(registro)
        ultimo_erro = "Conectado com sucesso"
        print(f"[OK] {ESP32_URL} -> {payload}")
        return None

    except requests.exceptions.ConnectTimeout:
        ultimo_erro = f"Timeout de conexão com {ESP32_URL}"
        print(f"[ERRO] {ultimo_erro}")
        return ultimo_erro

    except requests.exceptions.ReadTimeout:
        ultimo_erro = f"Timeout de leitura em {ESP32_URL}"
        print(f"[ERRO] {ultimo_erro}")
        return ultimo_erro

    except requests.exceptions.ConnectionError as e:
        ultimo_erro = f"Sem conexão com o ESP32: {e}"
        print(f"[ERRO] {ultimo_erro}")
        return ultimo_erro

    except requests.exceptions.RequestException as e:
        ultimo_erro = f"Erro HTTP: {e}"
        print(f"[ERRO] {ultimo_erro}")
        return ultimo_erro

    except ValueError as e:
        ultimo_erro = f"JSON inválido: {e}"
        print(f"[ERRO] {ultimo_erro}")
        return ultimo_erro

    except Exception as e:
        ultimo_erro = f"Erro inesperado: {e}"
        print(f"[ERRO] {ultimo_erro}")
        return ultimo_erro


def valor_num(df, col):
    return pd.to_numeric(df[col], errors="coerce")


app = Dash(__name__)
app.title = "Dashboard ESP32"

app.layout = html.Div(
    style={"fontFamily": "Arial", "padding": "20px", "backgroundColor": "#f5f7fb"},
    children=[
        html.H1("Dashboard ESP32 + SG90 + Sensor"),
        html.Div(f"Fonte: {ESP32_URL}", style={"marginBottom": "18px", "color": "#444"}),

        html.Div(
            style={
                "display": "grid",
                "gridTemplateColumns": "repeat(7, 1fr)",
                "gap": "15px",
            },
            children=[
                html.Div(id="card-distancia", style=card_style()),
                html.Div(id="card-referencia", style=card_style()),
                html.Div(id="card-diferenca", style=card_style()),
                html.Div(id="card-score", style=card_style()),
                html.Div(id="card-angulo", style=card_style()),
                html.Div(id="card-contador", style=card_style()),
                html.Div(id="card-status", style=card_style()),
            ],
        ),

        html.Div(style={"height": "18px"}),

        html.Div(
            style={"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "20px"},
            children=[
                dcc.Graph(id="grafico-distancia"),
                dcc.Graph(id="grafico-score"),
            ],
        ),

        html.Div(style={"height": "18px"}),

        html.Div(
            style={"display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "20px"},
            children=[
                dcc.Graph(id="grafico-angulo"),
                dcc.Graph(id="grafico-contador"),
            ],
        ),

        html.Div(style={"height": "18px"}),

        html.Div(
            style={
                "backgroundColor": "white",
                "padding": "15px",
                "borderRadius": "12px",
                "boxShadow": "0 2px 8px rgba(0,0,0,0.08)",
            },
            children=[
                html.H3("Últimas leituras"),
                dash_table.DataTable(
                    id="tabela-dados",
                    page_size=12,
                    style_table={"overflowX": "auto"},
                    style_cell={"textAlign": "center", "padding": "8px", "fontSize": "12px"},
                    style_header={"fontWeight": "bold"},
                ),
            ],
        ),

        dcc.Interval(id="intervalo", interval=1000, n_intervals=0),
    ],
)


@app.callback(
    Output("card-distancia", "children"),
    Output("card-referencia", "children"),
    Output("card-diferenca", "children"),
    Output("card-score", "children"),
    Output("card-angulo", "children"),
    Output("card-contador", "children"),
    Output("card-status", "children"),
    Output("grafico-distancia", "figure"),
    Output("grafico-score", "figure"),
    Output("grafico-angulo", "figure"),
    Output("grafico-contador", "figure"),
    Output("tabela-dados", "data"),
    Output("tabela-dados", "columns"),
    Input("intervalo", "n_intervals"),
)
def atualizar_dashboard(_):
    erro = buscar_dado_esp32()
    lista = list(dados)

    if not lista:
        vazio = pd.DataFrame(columns=["hora_pc", "distance_cm"])
        fig_vazia = px.line(vazio, x="hora_pc", y="distance_cm", title="Sem dados")
        return (
            montar_card("Distância atual", "--"),
            montar_card("Referência", "--"),
            montar_card("Diferença", "--"),
            montar_card("Score", "--"),
            montar_card("Ângulo", "--"),
            montar_card("Movimentos/Objetos", "0"),
            montar_card("Status", f"Erro: {erro}" if erro else ultimo_erro),
            fig_vazia,
            fig_vazia,
            fig_vazia,
            fig_vazia,
            [],
            [],
        )

    df = pd.DataFrame(lista)

    for col in [
    "distance_cm",
    "reference_distance_cm",
    "difference_cm",
    "threshold_cm",
    "detection_score",
    "servo_angle",
    "angle_cluster_start",
    "angle_cluster_end",
    "movement_count",
    ]:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    ultimo = df.iloc[-1]

    distancia_atual = "--" if pd.isna(ultimo["distance_cm"]) else f"{ultimo['distance_cm']:.2f} cm"
    referencia_atual = "--" if pd.isna(ultimo["reference_distance_cm"]) else f"{ultimo['reference_distance_cm']:.2f} cm"
    diferenca_atual = "--" if pd.isna(ultimo["difference_cm"]) else f"{ultimo['difference_cm']:.2f} cm"
    score_atual = "--" if pd.isna(ultimo["detection_score"]) else str(int(ultimo["detection_score"]))
    angulo_atual = "--" if pd.isna(ultimo["servo_angle"]) else f"{int(ultimo['servo_angle'])}°"
    contador_atual = "--" if pd.isna(ultimo["movement_count"]) else str(int(ultimo["movement_count"]))

    if erro:
        status_txt = f"Erro: {erro}"
    else:
        if bool(ultimo["object_detected"]):
            ini = ultimo["angle_cluster_start"]
            fim = ultimo["angle_cluster_end"]
            if pd.notna(ini) and pd.notna(fim):
                status_txt = f"Objeto detectado ({int(ini)}°–{int(fim)}°)"
            else:
                status_txt = "Objeto detectado"
        else:
            status_txt = "Sem objeto"

    fig_distancia = px.line(
        df,
        x="hora_pc",
        y=["distance_cm", "reference_distance_cm"],
        markers=True,
        title="Distância atual x referência",
    )
    fig_distancia.update_layout(template="plotly_white", xaxis_title="Hora", yaxis_title="cm")

    fig_score = px.line(
        df,
        x="hora_pc",
        y="detection_score",
        markers=True,
        title="Score de detecção",
    )
    fig_score.update_layout(template="plotly_white", xaxis_title="Hora", yaxis_title="score")

    fig_angulo = px.scatter(
        df,
        x="servo_angle",
        y="difference_cm",
        color="object_detected",
        title="Diferença por ângulo",
    )
    fig_angulo.update_layout(template="plotly_white", xaxis_title="Ângulo", yaxis_title="Diferença (cm)")

    fig_contador = px.line(
        df,
        x="hora_pc",
        y="movement_count",
        markers=True,
        title="Contador acumulado de movimentos/objetos",
    )
    fig_contador.update_layout(template="plotly_white", xaxis_title="Hora", yaxis_title="Quantidade")

    tabela_df = df.tail(12).iloc[::-1].copy()
    tabela_df["object_detected"] = tabela_df["object_detected"].map(lambda x: "Sim" if x else "Não")
    tabela_df["new_movement"] = tabela_df["new_movement"].map(lambda x: "Sim" if x else "Não")

    return (
        montar_card("Distância atual", distancia_atual),
        montar_card("Referência", referencia_atual),
        montar_card("Diferença", diferenca_atual),
        montar_card("Score", score_atual),
        montar_card("Ângulo", angulo_atual),
        montar_card("Movimentos/Objetos", contador_atual),
        montar_card("Status", status_txt),
        fig_distancia,
        fig_score,
        fig_angulo,
        fig_contador,
        tabela_df.to_dict("records"),
        [{"name": c, "id": c} for c in tabela_df.columns],
    )


if __name__ == "__main__":
    print(f"Iniciando dashboard com fonte em: {ESP32_URL}")
    init_csv()
    app.run(debug=True)