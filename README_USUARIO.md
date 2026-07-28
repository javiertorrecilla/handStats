# 📖 HandStats — Manual y Guía de Usuario

Bienvenido al manual oficial de **HandStats**. Esta guía detalla paso a paso el funcionamiento del sistema a nivel de usuario, desde la preparación de plantillas hasta la toma de datos en directo y el análisis avanzado post-partido.

---

## 🤾‍♂️ 1. Gestión de Equipos y Plantillas

Antes de analizar un partido, se recomienda registrar los equipos y sus plantillas de jugadores:
1. Accede a la pestaña **Equipos** en la barra de navegación superior.
2. Haz clic en **Crear Nuevo Equipo**.
3. Introduce el nombre del equipo, categoría y asigna el escudo o color identificativo.
4. Añade a los jugadores indicando:
   - **Dorsal** (1 a 99).
   - **Nombre completo o apodo**.
   - **Posición habitual** (Pivote, Central, Lateral Izq/Der, Extremo Izq/Der, Portero).
   - **Indicador de Portero** (`is_goalkeeper`).

---

## ⏱️ 2. Toma de Datos en Directo (Análisis del Partido)

La pantalla de **Análisis de Partido** está diseñada para una toma de datos ultra-rápida a pie de pista con dispositivos táctiles o portátiles.

```
+-------------------------------------------------------------------------+
|                              MARCADOR                                   |
|   LOCAL [ 24 ]        00:15:42 [ ▶ Iniciar ]        [ 21 ] VISITANTE    |
|   ( ATAQUE )          [-1m] [-10s] [+10s] [+1m]     ( DEFENSA )         |
|   [Lanzar] [Pérdida]                                [7m] [Golpe] [Sanc] |
|   [Sanción] [T.Muerto]                                                  |
+-------------------------------------------------------------------------+
|                       CAMPOGRAMA INTERACTIVO                            |
|             (Selección de zona de tiro y portería)                      |
+-------------------------------------------------------------------------+
```

### A. Marcador y Control de Posesión
- **Marcador en Vivo**: Muestra la puntuación en tiempo real y resalta qué equipo ostenta el **Ataque** y cuál la **Defensa**.
- **Control del Cronómetro**:
  - Botón principal **Iniciar / Pausar**.
  - Ajuste fino rápido (`-1m`, `-10s`, `+10s`, `+1m`).
  - Edición directa haciendo clic sobre la cifra del tiempo (`MM:SS`).
- **Tiempo Muerto (`T. Muerto`)**:
  - La opción de solicitar tiempo muerto **aparece únicamente en la botonera del equipo en posesión del balón (Ataque)** de acuerdo al reglamento oficial. Al pulsar `T. Muerto`, el cronómetro se detiene automáticamente.

### B. Registro de Lanzamientos (Tiros)
1. Pulsa **Lanzamiento** en el equipo atacante.
2. Selecciona al **Jugador Lanzador** en la parrilla táctil.
3. Haz clic en el **Campograma de Pista** para marcar la posición exacta del tiro (6m, 9m, extremo, 7m, contraataque).
4. Selecciona la **Zona de Portería** (arriba a la izquierda, abajo a la derecha, etc.).
5. Selecciona el **Resultado**:
   - ⚽ **Gol**
   - 🧤 **Parada del Portero** (permite seleccionar al portero defensor).
   - ❌ **Fuera / Poste**

### C. Registro de Pérdidas de Balón Segmentadas
Para un análisis táctico preciso, las pérdidas se clasifican por su causa:
- **Mal Pase**: Entrega directa al rival.
- **Dobles**: Infracción no forzada en el bote.
- **Pasos**: Infracción en el desplazamiento.
- **Pasivo**: Agotamiento del tiempo de ataque.
- **Falta en Ataque**: Choque contra el defensor.

### D. Flujo Táctico de 2 Pasos (7 Metros Penalti y Falta en Ataque)
Para registrar el mérito tanto del atacante como del defensor de forma completa:
- **7 Metros Penalti**:
  1. Paso 1: Selecciona en el equipo defensor al **Defensor que cometió la falta**.
  2. Paso 2: Selecciona en el equipo atacante al **Atacante que provocó el penalti**.
- **Falta en Ataque**:
  1. Paso 1: Selecciona en el equipo atacante al **Atacante que cometió la falta**.
  2. Paso 2: Selecciona en el equipo defensor al **Defensor que la provocó**.

---

## 📊 3. Módulo de Estadísticas y Analítica Avanzada

Al cambiar a la pestaña **Estadísticas**, HandStats ofrece 6 vistas analíticas detalladas:

### 1. Cuadro de Mando (Dashboard)
- **KPIs Principales**: Eficiencia Ofensiva (goles por cada 100 ataques), xG Acumulado, Paradas de Portería, Pérdidas y Ritmo del partido.
- **Gráfica de Momentum**: Muestra los picos de iniciativa y dominio de cada equipo a lo largo del tiempo.
- **Gráfica de Evolución del Marcador**: Muestra la progresión del tanteador **exclusivamente con marcadores en los momentos que se anotan goles**.
- **Perfil Táctico Radar**: Comparativa pentagonal cara a cara entre ambos equipos.

### 2. Tabla de Jugadores y Porteros (Rating 0.0 - 10.0)
Evalúa el rendimiento de cada jugador sin basarse únicamente en contar goles:
- **Escala de Color y Calificación**:
  - `9.5 - 10.0` (Verde): **Excelente / MVP**
  - `8.0 - 9.4` (Azul): **Muy Buen Partido**
  - `5.0` (Gris Neutro): **Partido Promedio**
  - `3.0 - 4.9` (Naranja): **Partido Flojo**
  - `< 3.0` (Rojo): **Partido Muy Malo**
- **Columnas**: Dorsal, Nombre, Rol, Tiros, Goles (y % eficacia), xG Campo, Tiros Recibidos, Paradas (y % paradas), xSaves, Pérdidas, Robos, 2 Minutos y Rating final.
- **Ordenación dinámica**: Haz clic en el encabezado de cualquier columna para ordenar ascendente o descendentemente.

### 3. Análisis de Lanzamiento y Ataque
- Desglose por tipo de tiro (Distancia, 6m, Extremo, 7m, Contraataque).
- Eficiencia por zona de portería.
- Análisis por fase de juego (Posicional, Segunda Ola, Contraataque) y situación numérica (Igualdad, Superioridad, Inferioridad).

### 4. Mapas de Calor (Heatmaps)
- **Mapa de Pista**: Concentración visual de los puntos de lanzamiento.
- **Mapa de Portería**: Distribución del destino de los disparos y efectividad del portero.

### 5. Cronología Interactiva
- Registro cronológico completo de todos los eventos acontecidos durante el partido con filtros por equipo y tipo de acción.

---

## ⚙️ 4. Ajustes de Parámetros y Calibración

En el apartado **Ajustes de Parámetros**, los entrenadores pueden calibrar:
- **Factores del Modelo xG**: Probabilidades base de cada posición de tiro.
- **Factor Sigmoide ($k$)**: Sensibilidad de la curva de nota (por defecto $k = 0.35$).
- **Ponderaciones de Valoración ($w$)**: Ajuste del peso concedido a los goles, paradas, pérdidas segmentadas, acciones defensivas y sanciones.
