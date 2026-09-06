# Especificaciones Técnicas del Tablero

## Sistema de Unidades Responsive

El tablero utiliza un sistema de unidades relativas que se adapta automáticamente a cualquier tamaño de pantalla:

### Unidad Base
- **Font-size base:** `4vmin` (4% del lado más pequeño del viewport)
- Esto asegura que el texto escale proporcionalmente en cualquier resolución

### Distribución de Pantalla
```
┌─────────────────────────────────────┐
│                                     │
│      ÁREA DEL TABLERO (77vh)        │
│                                     │
│  - Fondo: score_pantalla-1.jpg      │
│  - Jugadores, puntos, sets          │
│  - Etapa, reloj                     │
│                                     │
├─────────────────────────────────────┤
│   ÁREA DE PUBLICIDAD (23vh)         │
│  ┌─────────┐      ┌─────────┐       │
│  │Banner 1 │      │Banner 2 │       │
│  └─────────┘      └─────────┘       │
└─────────────────────────────────────┘
```

## Posicionamiento de Elementos (Porcentajes)

### Etapa del Torneo
- **Posición:** `top: 21%`, centrado horizontalmente
- **Color:** `#c3bf6f` (dorado)
- **Fuente:** Solanel
- **Tamaño:** `calc(0.6em * 1.7)` = `1.02em` relativo al base
- **Letter-spacing:** `0.3rem`

### Nombres de Jugadores
Todos los jugadores siguen el mismo patrón con diferentes posiciones verticales:

- **Ancho:** `36%` del tablero
- **Alto:** `20%` del tablero
- **Left:** `0.8%`
- **Padding interno:** `1.5%` (para separar del borde)
- **Border-radius:** `0 1vh 1vw 0` (esquinas redondeadas a la derecha)
- **Tamaño fuente:** `calc(0.8em * 1.7)` = `1.36em`

Posiciones verticales (`top`):
- Equipo 1, Jugador 1: `5%`
- Equipo 1, Jugador 2: `30%`
- Equipo 2, Jugador 1: `57%`
- Equipo 2, Jugador 2: `82%`

### Puntos Actuales (Game)
- **Left:** `41%`
- **Width:** `15%`
- **Height:** `50%`
- **Tamaño fuente:** `calc(2.5em * 1.7)` = `4.25em`
- **Display:** `flex` con `justify-content: center` y `align-items: center`

Posiciones verticales:
- Equipo 1: `top: 0%`
- Equipo 2: `top: 53.5%`

### Sets
- **Width:** `12.5%`
- **Height:** `55%`
- **Top (equipo 1):** `3%`
- **Top (equipo 2):** `53.5%`
- **Tamaño fuente:** `calc(2.3em * 1.7)` = `3.91em`
- **Text-align:** `center`

Posiciones horizontales (`left`):
- Set 1: `60.5%`
- Set 2: `74%`
- Set 3: `87.5%`

### Reloj (Tiempo Transcurrido)
- **Top:** `29%`
- **Left:** `80%`
- **Transform:** `translateX(-50%)` para centrar
- **Tamaño fuente:** `calc(0.6em * 1.7)`
- **Background:** `rgba(0,0,0,0.2)` con padding y border-radius

### Indicador de Servicio (Pelota)
- **Posición:** Dentro del contenedor del jugador
- **Height:** `63%` del contenedor
- **Width:** `11%` del contenedor
- **Background:** `url('/assets/ball.png')`
- **Background-size:** `contain`
- **Background-position:** `right center`

## Colores de Equipos

Los colores se aplican mediante gradiente lineal:
```css
background: linear-gradient(165deg, transparent 60%, ${colorEquipo})
```

Esto crea un efecto de degradado que va de transparente a color del equipo.

## Responsive Breakpoints

### Desktop (> 900px)
- Layout horizontal
- Banners lado a lado (48% cada uno)
- Font-size base: `4vmin`

### Móvil (< 900px)
- Banners apilados verticalmente (95% de ancho cada uno)
- Font-size base: `5.5vmin` (más grande para legibilidad)
- Altura de banners: `auto` con `min-height: 100px`

## Aspect Ratios Soportados

El tablero funciona en cualquier aspect ratio gracias al uso de unidades relativas:
- **16:9** (Full HD, 4K) - Óptimo
- **16:10** (Monitores profesionales) - Óptimo
- **4:3** (Proyectores antiguos) - Funcional
- **21:9** (Ultra-wide) - Funcional
- **Vertical** (Pantallas rotadas) - Funcional con ajustes móviles

## Resoluciones Testeadas

### Recomendadas
- 1920x1080 (Full HD)
- 2560x1440 (2K)
- 3840x2160 (4K)
- 1366x768 (HD)
- 1280x720 (HD Ready)

### Funcionales
- 1024x768 (XGA)
- 1440x900 (WXGA+)
- 2560x1080 (Ultra-wide)

## Fuentes

### Fuente Principal
- **Nombres y puntos:** "Segoe UI", sans-serif (sistema)
- **Etapa:** "Solanel" (custom font en `/assets/Solanel-Black.otf`)

### Fallbacks
Si Solanel no carga, el navegador usará la fuente sans-serif del sistema.

## Assets Críticos

Estos archivos DEBEN estar en `client/public/assets/`:

1. **score_pantalla-1.jpg** - Fondo del tablero principal
2. **ball.png** - Indicador de servicio
3. **Solanel-Black.otf** - Fuente para etapa
4. **banner1.jfif** - Banner publicitario 1
5. **banner2.jfif** - Banner publicitario 2
6. **background_calentamiento.png** - Fondo de calentamiento/descanso
7. **logo_torneo.png** - Logo del torneo

## Optimización para Pantallas Grandes

### Proyectores y TVs (> 55")
- El sistema de `vmin` asegura que todo escale proporcionalmente
- Los porcentajes mantienen las posiciones relativas
- Recomendado: Resolución mínima 1920x1080

### Monitores Múltiples
- Cada monitor puede mostrar el tablero independientemente
- La sincronización SSE asegura que todos muestren lo mismo en tiempo real

## Performance

### Optimizaciones Aplicadas
- Uso de `position: absolute` para evitar reflows
- Imágenes de fondo con `background-size: 100% 100%`
- Actualización SSE en lugar de polling
- CSS con `!important` para evitar conflictos de especificidad

### Recomendaciones
- Usar imágenes optimizadas (WebP cuando sea posible)
- Mantener banners publicitarios < 500KB cada uno
- Fondo del tablero < 1MB

## Modo Pantalla Completa

Para usar en eventos:
1. Abrir el tablero en el navegador
2. Presionar `F11` para pantalla completa
3. El tablero ocupará toda la pantalla sin barras de navegación

## Compatibilidad de Navegadores

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+
- ⚠️ Internet Explorer: NO soportado

## Notas Importantes

1. **No modificar los porcentajes** sin testear en múltiples resoluciones
2. **Los valores de `calc()`** están calibrados para el diseño original
3. **El área de banners (23vh)** es fija para mantener proporciones
4. **Todos los elementos usan posicionamiento absoluto** dentro del tablero para evitar desplazamientos
