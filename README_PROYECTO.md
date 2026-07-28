# 🤾‍♂️ HandStats — Proyecto y Organización del Sistema

Bienvenido a la documentación de **HandStats**, la plataforma integral y profesional de análisis estadístico en tiempo real, seguimiento de rendimiento y valoración cuantitativa para balonmano.

---

## 📌 Visión General del Proyecto

**HandStats** ha sido concebido para proporcionar a entrenadores, analistas y cuerpos técnicos de balonmano una herramienta de alto nivel para:
- **Toma de datos ágil en pista** durante partidos en vivo mediante una interfaz táctil optimizada.
- **Modelado avanzado de datos** incorporando conceptos modernos de *Expected Goals* ($xG$), *Expected Saves* ($xSaves$), Impacto Neto del Jugador ($NPS$) y valoración de rendimiento individual de 0.0 a 10.0.
- **Visualización analítica interactiva** mediante dashboards en tiempo real, gráficos de momentum, evolución de marcador por goles, mapas de calor en pista y portería, y comparativas cara a cara.

---

## 🏗️ Arquitectura General del Sistema

HandStats está estructurado como una aplicación **Single Page Application (SPA)** desacoplada con arquitectura **Client-Server REST**:

```mermaid
graph TD
    A["📱 Frontend (React 18 + Vite)"] <-->|REST API / JSON| B["⚡ Backend (FastAPI + Uvicorn)"]
    B <-->|Motor ODM (Motor / PyMongo)| C["🗄️ MongoDB Database"]
    A --> D["🧮 Engine de Métricas e xG (JS Client)"]
    A --> E["⭐ Player Rating Calculator (JS Client)"]
```

---

## 📂 Organización del Repositorio

El repositorio se divide en dos bloques principales (**Backend** y **Frontend**):

```
handStats/
├── backend/                  # Servidor API REST en Python (FastAPI)
│   ├── main.py               # Punto de entrada FastAPI, middlewares CORS y rutas
│   ├── database.py           # Conexión asíncrona a MongoDB
│   ├── models.py             # Esqueletos y modelos Pydantic (Teams, Players, Matches, Events)
│   ├── routes/               # Endpoints divididos por controlador
│   │   ├── teams.py          # CRUD de equipos y plantillas de jugadores
│   │   ├── matches.py        # CRUD de partidos, eventos y posesiones
│   │   └── stats.py          # Endpoints de generación de informes
│   ├── utils/                # Utilidades de backend y generador de PDF (ReportLab)
│   └── uploads/              # Almacenamiento local de escudos y fotos
│
├── frontend/                 # Aplicación Web cliente (React + Vite)
│   ├── index.html            # Punto de entrada HTML
│   ├── src/
│   │   ├── assets/           # Recursos estáticos e iconos SVG
│   │   ├── components/       # Componentes de UI principales
│   │   │   ├── common/       # Botones, inputs, badges y modales reutilizables
│   │   │   ├── match/        # Toma de datos en directo (MatchAnalysisPage)
│   │   │   ├── teams/        # Gestión de equipos y jugadores
│   │   │   └── settings/     # Ajustes y calibración de parámetros (SettingsPage)
│   │   ├── context/          # Estado global (MatchContext para live tracking)
│   │   ├── services/         # Clientes de API REST (api.js, matchService, settingsService)
│   │   └── stats/            # Módulo de analítica avanzada y visualización
│   │       ├── MatchStatsModule.jsx # Contenedor principal de pestañas analíticas
│   │       ├── engine/       # Motores estadísticos puramente funcionales
│   │       │   ├── metricsEngine.js       # Cálculo global de métricas del partido
│   │       │   ├── playerRatingEngine.js  # Modelo de valoración sigmoide (0.0 - 10.0)
│   │       │   ├── xgModel.js             # Modelo matematico de xG y xSaves
│   │       │   ├── teamCumulativeEngine.js # Estadísticas acumuladas e históricas
│   │       │   └── insightsEngine.js      # Generador de conclusiones tácticas
│   │       ├── components/
│   │       │   ├── views/    # Vistas analíticas (Dashboard, Jugadores, Ataque, Mapas, Tendencias)
│   │       │   └── charts/   # Componentes SVG puros (EvolutionChart, MomentumChart, Radar, Heatmaps)
│   │       └── hooks/        # Custom React Hooks (useMatchStats)
│   └── package.json
│
├── README.md                 # Portal principal de documentación
├── README_PROYECTO.md        # Documentación de organización y arquitectura (este archivo)
├── README_TECNICO.md         # Manual de requisitos técnicos y despliegue
└── README_USUARIO.md         # Guía de funcionamiento a nivel de usuario
```

---

## 🧮 Motores de Cálculo y Organización Modular

El core de la inteligencia analítica de **HandStats** reside en el módulo `frontend/src/stats/engine/`:

| Motor | Archivo | Responsabilidad Principal |
| :--- | :--- | :--- |
| **Metrics Engine** | `metricsEngine.js` | Consolida la totalidad del análisis del partido: posesiones, tiros, mapa de lanzamientos, filtro estricto por jugador y coordinación de submotores. |
| **Player Rating Engine** | `playerRatingEngine.js` | Implementa la clase `PlayerRatingCalculator`. Acumula el Impacto Neto ($NPS$) y aplica una curva logística sigmoide centrada en 5.0 para notas $[0.0 - 10.0]$. |
| **xG Model** | `xgModel.js` | Calcula las probabilidades esperadas de gol ($xG$) según posición (6m, 9m, 7m, extremo, contraataque), distancia, ángulo, fase de juego y situación numérica. |
| **Team Cumulative Engine** | `teamCumulativeEngine.js` | Agrega el histórico de partidos de un equipo para ofrecer comparativas históricas en tiempo real. |
| **Insights Engine** | `insightsEngine.js` | Evalúa patrones estadísticos y genera recomendaciones tácticas automáticas. |

---

## 🔄 Flujo de Trabajo y Desarrollo

1. **Estado en Tiempo Real (Live Session)**: Durante el partido, `MatchAnalysisPage` interactúa con `MatchContext`, manteniendo una copia local en React y sincronizando atómicamente cada evento con el backend en MongoDB.
2. **Desacoplamiento Estadístico**: Las visualizaciones de `MatchStatsModule` son puramente reactivas y leen datos transformados por `metricsEngine.js`, garantizando respuesta instantánea sin bloqueos de renderizado.
3. **Control de Calidad**: El proyecto mantiene compilaciones mediante `npm run build` verificando cero errores y linters estrictos.
