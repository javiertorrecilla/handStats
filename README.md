# 🤾‍♂️ HandStats — Plataforma Profesional de Análisis Estadístico para Balonmano

**HandStats** es una plataforma avanzada e integral para el análisis estadístico en tiempo real, seguimiento de rendimiento y valoración cuantitativa de jugadores en balonmano.

---

## 📚 Documentación del Proyecto

El proyecto dispone de tres manuales detallados según el perfil de lectura:

### 1. 🏗️ [README_PROYECTO.md](./README_PROYECTO.md) — Proyecto y Organización
> **Para desarrolladores y gestores de proyecto**.
> Incluye la visión general del sistema, arquitectura del software (FastAPI + React + MongoDB), organización modular de carpetas, motores de analítica (`metricsEngine.js`, `playerRatingEngine.js`, `xgModel.js`) y flujo de trabajo de desarrollo.

### 2. 🛠️ [README_TECNICO.md](./README_TECNICO.md) — Requisitos Técnicos y Despliegue
> **Para ingenieros de software, DevOps y administradores**.
> Incluye el stack tecnológico completo, requisitos de entorno, comandos de instalación y arranque (Backend en Python/FastAPI y Frontend en React/Vite), referencia de APIs REST y formulación matemática de $xG$, $xSaves$, $NPS$ y la función sigmoide de valoración ($0.0 - 10.0$).

### 3. 📖 [README_USUARIO.md](./README_USUARIO.md) — Manual y Guía de Usuario
> **Para entrenadores, analistas tácticos y usuarios finales**.
> Incluye la guía paso a paso para la gestión de equipos y plantillas, toma de datos en directo (marcador, campograma de tiro, flujo de 2 pasos para 7m y faltas en ataque, solicitudes de tiempo muerto), exploración del dashboard de estadísticas, tablas de valoración individual y mapas de calor.

---

## ⚡ Inicio Rápido (Desarrollo Local)

```bash
# 1. Backend (FastAPI)
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Frontend (React + Vite)
cd ../frontend
npm install
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Documentación de API (Swagger)**: `http://localhost:8000/docs`