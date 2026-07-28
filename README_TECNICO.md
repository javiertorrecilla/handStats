# 🛠️ HandStats — Requisitos Técnicos, Arquitectura y Despliegue

Este documento recoge los **requisitos técnicos**, stack de tecnologías, APIs REST, modelos matemáticos ($xG$, $xSaves$, $NPS$, Sigmoide) e instrucciones completas para la instalación, desarrollo y despliegue del sistema **HandStats**.

---

## ⚙️ Stack Tecnológico

### Backend
- **Lenguaje**: Python 3.10+
- **Framework Web**: FastAPI (asíncrono, validación basada en Pydantic 2)
- **Servidor ASGI**: Uvicorn
- **Base de Datos**: MongoDB 6.0+ (driver asíncrono `motor` / `pymingo`)
- **Generación de Informes**: ReportLab (exportación de actas y analíticas a PDF)

### Frontend
- **Framework UI**: React 18
- **Herramienta de Construcción / Bundle**: Vite 8
- **Estilos**: Vanilla CSS con diseño adaptativo, tokens de diseño y glassmorphism en modo oscuro.
- **Gráficos**: Componentes SVG dinámicos (sin dependencias pesadas de terceros).
- **Gestión de Estado**: React Context API (`MatchContext`) + LocalStorage fallback para Ajustes.

---

## 📋 Requisitos de Entorno de Desarrollo

Para ejecutar el proyecto localmente se requiere:
1. **Node.js**: `v18.0.0` o superior (`npm v9+`).
2. **Python**: `3.10` o superior (`uv` o `pip` / `venv`).
3. **MongoDB**: Instancia local corriendo en `mongodb://localhost:27017` o una URI de MongoDB Atlas.

---

## 🚀 Guía de Instalación y Puesta en Marcha

### 1. Clonar el Repositorio
```bash
git clone https://github.com/javiertorrecilla/handStats.git
cd handStats
```

### 2. Configurar y Ejecutar el Backend (FastAPI)

```bash
cd backend

# Crear y activar entorno virtual (usando uv o venv)
python3 -m venv .venv
source .venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Iniciar servidor FastAPI en modo desarrollo (Hot Reload)
uvicorn main:app --reload --port 8000
```

- **Documentación Swagger interactiva**: `http://localhost:8000/docs`
- **ReDOC API Specification**: `http://localhost:8000/redoc`

### 3. Configurar y Ejecutar el Frontend (React + Vite)

```bash
cd ../frontend

# Instalar dependencias Node.js
npm install

# Iniciar servidor de desarrollo Vite
npm run dev
```

El frontend estará disponible en `http://localhost:5173`.

### 4. Compilación de Producción (Frontend)

Para generar los archivos estáticos listos para producción:
```bash
cd frontend
npm run build
```
Los archivos optimizados se generarán en la carpeta `frontend/dist/`.

---

## 🧮 Modelos Matemáticos Estadísticos

### 1. Modelo de Goles Esperados ($xG$) y Paradas Esperadas ($xSaves$)
Cada lanzamiento registrado en pista se evalúa mediante la función `calculateShotXG(shot)`:

$$xG = \text{xG\_Base}(\text{Posición}) \times \text{Factor}(\text{Fase}) \times \text{Factor}(\text{Superioridad/Inferioridad})$$

- **Posiciones de Tiro**:
  - **7m Penalti**: $xG = 0.85$
  - **6m Centro / Pivote**: $xG = 0.75$
  - **Contraataque Directo**: $xG = 0.85$
  - **Extremos (Izquierdo / Derecho)**: $xG = 0.55$
  - **9m Centro / Laterales**: $xG = 0.35$
  - **Campo Propio / Puerta Vacía**: $xG = 0.90$ (o $0.15$ con portero colocado)

- **Paradas Esperadas ($xSaves$)**:
  $$\text{xSaves} = 1 - xG$$

---

### 2. Sistema de Valoración Individual ($R$) e Impacto Neto ($NPS$)

El algoritmo `PlayerRatingCalculator` evalúa a cada jugador generando una nota continua entre $0.0$ y $10.0$ redondeada a un decimal.

#### Paso A: Acumulativo de Impacto Neto ($NPS$)
$$NPS = \sum \text{Acciones Positivas} - \sum \text{Acciones Negativas}$$

- **Ataque**:
  $$\text{Puntos Gol} = \text{Goles} \times (1 - xG) \times w_{\text{goal}}$$
  $$\text{Penalización Parada Sufrida} = \text{Paradas} \times xG \times w_{\text{miss\_saved}}$$
  $$\text{Penalización Tiro Fuera} = \text{Fallos} \times xG \times w_{\text{miss\_off}}$$
- **Pérdidas Segmentadas**: Mal pase ($-1.0$), Dobles ($-0.8$), Pasos ($-0.8$), Pasivo ($-0.9$), Falta en ataque cometida ($-1.1$).
- **Defensa**: Provocar Golpe Franco ($+0.30$), Provocar Falta en Ataque ($+1.10$), Cometer Penalti 7m ($-1.10$).
- **Portería**: Paradas ($+1.50 \times xG$), Goles encajados ($-1.00 \times (1 - xG)$).
- **Disciplina**: Tarjeta Amarilla ($-0.40$), Exclusión 2 Minutos ($-1.20$), Tarjeta Roja ($-2.50$).

#### Paso B: Normalización Logística Sigmoide
Para transformar el score ilimitado $NPS$ a la escala $[0.0 - 10.0]$ centrada en $5.0$ para $NPS = 0$:

$$Rating(NPS) = \frac{10}{1 + e^{-k \cdot NPS}}$$

Donde $k = 0.35$ (calibrable desde la pantalla de Ajustes).

---

## 📡 Referencia de API REST Backend

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/teams/` | Lista todos los equipos y plantillas registradas. |
| `POST` | `/teams/` | Crea un nuevo equipo con su plantilla de jugadores. |
| `GET` | `/matches/` | Lista todos los partidos analizados o en curso. |
| `POST` | `/matches/` | Crea un nuevo partido en estado inicial. |
| `GET` | `/matches/{id}` | Obtiene el detalle completo del partido (eventos, posesiones). |
| `POST` | `/matches/{id}/events` | Registra atómicamente un nuevo evento durante el directo. |
| `POST` | `/matches/{id}/possessions` | Registra o cierra una posesión en directo. |
| `GET` | `/matches/{id}/pdf` | Genera y descarga el informe oficial del partido en formato PDF. |
