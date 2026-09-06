# Tablero - Pantalla de Visualización

## Cómo usar el tablero

### Desde el Panel de Control
1. Inicia sesión en el sistema
2. Ve a "Puntuación" o crea un nuevo partido
3. En la barra superior, haz clic en **"Abrir Tablero"** (icono de ventana externa)
4. El tablero se abrirá en una nueva pestaña del navegador

### Desde el Home
1. Haz clic en **"Pantalla / Tablero"**
2. Se abrirá en una nueva pestaña

### Características del Tablero

#### Visualización Principal
- **Imagen de fondo:** `score_pantalla-1.jpg` (se estira para cubrir toda el área)
- **Nombres de jugadores:** Con gradiente de color del equipo
- **Indicador de servicio:** Pelota amarilla junto al jugador que saca
- **Puntos actuales:** Muestra 0, 15, 30, 40, Ad (o números en tie-break)
- **Sets:** Hasta 3 sets visibles
- **Etapa del torneo:** Centrado arriba con fuente Solanel
- **Reloj:** Tiempo transcurrido del partido

#### Área de Publicidad (Inferior)
- **Altura:** 23vh (23% de la altura de la ventana)
- **2 slots de banners:** Lado a lado en desktop, apilados en móvil
- **Imágenes:** `banner1.jfif` y `banner2.jfif`
- **Responsive:** Se adapta automáticamente a diferentes resoluciones

#### Pantallas Especiales

**Calentamiento (5 minutos):**
- Fondo: `background_calentamiento.png`
- Logo del torneo arriba
- Nombres de equipos con "VS" en el centro
- Cuenta regresiva grande abajo
- Se activa desde el panel de control

**Descanso (90s o 2min):**
- Mismo diseño que calentamiento
- Muestra tiempo restante del descanso
- Se activa automáticamente o manualmente

**Cartel de Ganador:**
- Animación con gradiente dorado
- Se muestra cuando hay un equipo ganador
- Overlay sobre el tablero principal

### Posicionamiento de Elementos

Todos los elementos están posicionados con porcentajes para mantener proporciones en cualquier resolución:

- **Jugadores:** 
  - Equipo 1 Jugador 1: top 5%, left 0.8%
  - Equipo 1 Jugador 2: top 30%, left 0.8%
  - Equipo 2 Jugador 1: top 57%, left 0.8%
  - Equipo 2 Jugador 2: top 82%, left 0.8%

- **Puntos:** left 41%, width 15%
  - Equipo 1: top 0%
  - Equipo 2: top 53.5%

- **Sets:** width 12.5%, height 55%
  - Set 1: left 60.5%
  - Set 2: left 74%
  - Set 3: left 87.5%

### Responsive Design

**Desktop (> 900px):**
- Layout horizontal con banners lado a lado
- Fuente base: 4vmin
- Banners: 48% de ancho cada uno

**Móvil (< 900px):**
- Banners apilados verticalmente
- Fuente base: 5.5vmin (más grande para legibilidad)
- Banners: 95% de ancho cada uno

### Sincronización en Tiempo Real

El tablero se actualiza automáticamente mediante **Server-Sent Events (SSE)**:
- Cambios de puntuación
- Cambios de servicio
- Inicio/fin de calentamiento
- Inicio/fin de descanso
- Declaración de ganador

No requiere recargar la página.

### Assets Requeridos

Asegúrate de que estos archivos estén en `client/public/assets/`:
- `score_pantalla-1.jpg` - Fondo del tablero
- `background_calentamiento.png` - Fondo de calentamiento/descanso
- `logo_torneo.png` - Logo del torneo
- `ball.png` - Indicador de servicio
- `banner1.jfif` - Banner publicitario 1
- `banner2.jfif` - Banner publicitario 2
- `Solanel-Black.otf` - Fuente para la etapa
- `favicon.ico` - Icono del sitio

### Notas Técnicas

- El tablero NO requiere autenticación (es público)
- Se puede abrir en múltiples dispositivos simultáneamente
- Funciona en modo kiosko/pantalla completa (F11)
- Compatible con proyectores y pantallas grandes
- Optimizado para 16:9 pero funciona en cualquier aspect ratio
