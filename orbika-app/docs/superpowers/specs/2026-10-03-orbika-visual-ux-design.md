# Diseño de renovación visual y UX de ÓrbiKa

## Objetivo

Hacer que ÓrbiKa se perciba como un marketplace terminado, confiable y fácil de usar, manteniendo intactos el backend, los contratos de API y las reglas actuales del negocio.

## Alcance aprobado

- Portada moderna con una propuesta de valor clara y acceso rápido al catálogo.
- Tarjetas de producto con jerarquía clara para precio, ahorro, vencimiento y stock.
- Filtros cómodos en escritorio y en un panel móvil.
- Skeletons durante las cargas y estados vacíos/de error reutilizables.
- Detalle del producto orientado a tomar una decisión de compra.
- Experiencias diferenciadas para compradores y vendedores.
- Indicadores coherentes para vencimiento, ahorro, stock y estado del pedido.
- Sustitución de `alert`, `confirm` y `prompt` por modales accesibles.
- Contraste, foco visible, etiquetas y navegación por teclado.

## Dirección visual

Se conservará la identidad actual de mercado sostenible: verde bosque, tonos tierra, papel cálido y tipografía editorial. La renovación mejorará espaciado, escalas tipográficas, superficies, estados interactivos y consistencia; no añadirá una segunda identidad visual ni una biblioteca pesada de componentes.

## Arquitectura de interfaz

Los patrones repetidos se concentrarán en componentes pequeños dentro de `frontend/src/components/ui`: botones, insignias, modal, skeleton y panel de estado. Las páginas seguirán siendo responsables de obtener datos y ejecutar acciones; los componentes de presentación recibirán datos y callbacks. Los cálculos visuales de ahorro, vencimiento y stock serán funciones puras probadas con Vitest.

## Comportamiento adaptable

- Móvil: una columna, acciones principales de ancho completo, filtros dentro de un panel/modal y navegación compacta.
- Tableta: dos columnas para productos y detalle equilibrado.
- Escritorio: cuatro columnas de catálogo, filtros visibles y paneles con información secundaria.
- No debe existir desplazamiento horizontal desde 320 px de ancho.

## Accesibilidad

Los controles tendrán nombre accesible, estados de foco visibles y área táctil suficiente. El modal atrapará el foco, cerrará con `Escape`, devolverá el foco al disparador y tendrá título/descripción vinculados. Los mensajes dinámicos importantes usarán regiones `aria-live`, y el color nunca será el único medio para comunicar un estado.

## Fuera de alcance

- Cambios en Supabase, migraciones, endpoints o datos de demostración.
- Chat, pagos, mapas, notificaciones en tiempo real o carga de imágenes.
- Una aplicación administrativa nueva.
- Inicialización de Git.

## Criterios de aceptación

La renovación estará terminada cuando comprador y vendedor puedan recorrer sus flujos principales en móvil y escritorio; no queden llamadas a `window.alert`, `window.confirm` o `window.prompt`; todas las pantallas tengan carga, vacío y error adecuados; las pruebas y el build pasen; y la revisión por teclado no encuentre controles inaccesibles.
