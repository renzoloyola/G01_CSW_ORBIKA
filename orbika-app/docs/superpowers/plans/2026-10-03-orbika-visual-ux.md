# Renovación visual y UX de ÓrbiKa — Plan de implementación

> **Para agentes de implementación:** SUB-SKILL REQUERIDA: usar `superpowers:subagent-driven-development` (recomendado) o `superpowers:executing-plans` para ejecutar este plan tarea por tarea. Los pasos usan casillas (`- [ ]`) para el seguimiento.

**Objetivo:** Renovar el frontend de ÓrbiKa para que se sienta como un marketplace terminado, adaptable y accesible, sin cambiar la lógica del negocio.

**Arquitectura:** Crear una capa pequeña de componentes visuales reutilizables y funciones puras de presentación, y luego aplicarla progresivamente al catálogo, detalle y pedidos. Las páginas conservarán la carga de datos y las acciones existentes; el backend y sus contratos no se modificarán.

**Stack:** React 18, React Router, Tailwind CSS 4, Vitest 5, React Testing Library, Supabase y API existente.

**Especificación:** `docs/superpowers/specs/2026-10-03-orbika-visual-ux-design.md`

## Restricciones globales

- No modificar backend, migraciones, endpoints ni datos de demostración.
- No inicializar Git; ejecutar los pasos de commit solo después de que el usuario lo inicialice.
- Mantener la identidad verde/tierra actual y evitar nuevas dependencias visuales pesadas.
- Mantener todos los textos de la interfaz en español.
- Soportar desde 320 px sin desplazamiento horizontal.
- Todo control interactivo debe tener foco visible, nombre accesible y uso por teclado.
- Respetar `prefers-reduced-motion` y evitar animaciones esenciales para comprender el estado.

## Foco de revisión

- Producto sin foto o con una imagen que falla: debe conservar tamaño, texto alternativo y un reemplazo visual estable (Tarea 3).
- Precio original inválido, stock cero o fecha vencida: los indicadores deben ser comprensibles y nunca mostrar `NaN`, porcentajes negativos ni mensajes engañosos (Tarea 2).
- Respuesta vacía, lenta o fallida: cada página debe mostrar un estado apropiado sin saltos bruscos (Tareas 4, 5 y 6).
- Modal abierto mediante teclado: debe atrapar el foco, cerrar con `Escape` y devolver el foco al disparador (Tarea 7).
- Perfil o rol aún no cargado: navegación y paneles no deben mostrar acciones del rol incorrecto (Tareas 4 y 6).

---

## Orden recomendado

1. Fundamentos y componentes reutilizables.
2. Indicadores y tarjetas.
3. Catálogo y filtros móviles.
4. Detalle del producto.
5. Paneles de comprador/vendedor.
6. Modales y eliminación de APIs nativas.
7. Accesibilidad, verificación visual y cierre.

Cada etapa debe quedar funcionando y verificada antes de iniciar la siguiente.

### Tarea 1: Base visual, pruebas de componentes y primitivas

**Archivos:**

- Modificar: `frontend/package.json`
- Modificar: `frontend/vite.config.js`
- Modificar: `frontend/tailwind.config.js`
- Modificar: `frontend/src/index.css`
- Crear: `frontend/src/test/setup.js`
- Crear: `frontend/src/components/ui/Button.jsx`
- Crear: `frontend/src/components/ui/Badge.jsx`
- Crear: `frontend/src/components/ui/Button.test.jsx`

**Interfaces:**

- Produce: `Button({ variant, size, loading, disabled, children, ...props })`.
- Produce: `Badge({ tone, children, ...props })`.
- Las variantes permitidas serán `primary`, `secondary`, `danger` y `ghost`; los tonos serán `success`, `warning`, `danger`, `neutral` e `info`.

- [ ] **Paso 1: Configurar el entorno de componentes.** Añadir `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom` y `jsdom` como dependencias de desarrollo; configurar Vitest con entorno `jsdom` y archivo `src/test/setup.js`.
- [ ] **Paso 2: Escribir pruebas que fallen.** Comprobar que `Button` expone estado deshabilitado mientras carga, conserva el texto accesible y permite foco de teclado; comprobar que las variantes producen clases diferenciadas.
- [ ] **Paso 3: Ejecutar la prueba.** Ejecutar `npm test -- src/components/ui/Button.test.jsx`; debe fallar porque las primitivas aún no existen.
- [ ] **Paso 4: Definir los tokens visuales.** Consolidar en Tailwind y `index.css` escalas de color, radios, sombras, ancho de contenido, foco visible, selección de texto, tipografía, estilos base de formulario y reducción de movimiento.
- [ ] **Paso 5: Implementar `Button` y `Badge`.** Mantenerlos pequeños, aceptar atributos nativos y no ocultar el foco.
- [ ] **Paso 6: Verificar.** Ejecutar la prueba específica y luego `npm test`; ambas deben pasar.
- [ ] **Paso 7: Commit opcional.** Cuando Git exista: `git add frontend && git commit -m "feat: establish accessible visual foundations"`.

### Tarea 2: Indicadores reutilizables de producto y pedido

**Archivos:**

- Crear: `frontend/src/utils/product-presentation.js`
- Crear: `frontend/src/utils/product-presentation.test.js`
- Crear: `frontend/src/components/ProductIndicators.jsx`
- Crear: `frontend/src/components/ProductIndicators.test.jsx`
- Modificar: `frontend/src/pages/product.helpers.js`

**Interfaces:**

- Produce: `getProductIndicators(product, now = new Date())` con `{ savingsAmount, savingsPercent, expiryTone, expiryLabel, stockTone, stockLabel }`.
- Produce: `ProductIndicators({ producto, compact = false })`.
- Consumen las tarjetas y el detalle del producto en las tareas siguientes.

- [ ] **Paso 1: Escribir pruebas que fallen para los cálculos.** Cubrir ahorro normal, precio original cero, fecha vencida, vencimiento hoy, vencimiento próximo, stock bajo y stock cero.
- [ ] **Paso 2: Ejecutar las pruebas.** Ejecutar `npm test -- src/utils/product-presentation.test.js`; debe fallar por módulo inexistente.
- [ ] **Paso 3: Implementar la función pura.** Normalizar números y fechas antes de calcular; limitar el porcentaje a `0–100`; considerar stock bajo entre 1 y 3 unidades.
- [ ] **Paso 4: Escribir la prueba visual del indicador.** Exigir texto además del color para comunicar ahorro, vencimiento y stock.
- [ ] **Paso 5: Implementar `ProductIndicators`.** Componer `Badge` y permitir una versión compacta para tarjetas.
- [ ] **Paso 6: Verificar.** Ejecutar las dos pruebas específicas y `npm test`.
- [ ] **Paso 7: Commit opcional.** `git add frontend && git commit -m "feat: add consistent product indicators"`.

### Tarea 3: Tarjetas de producto y estados de carga

**Archivos:**

- Modificar: `frontend/src/components/ProductCard.jsx`
- Crear: `frontend/src/components/ProductCard.test.jsx`
- Crear: `frontend/src/components/ProductCardSkeleton.jsx`
- Crear: `frontend/src/components/ui/StatePanel.jsx`
- Crear: `frontend/src/components/ui/StatePanel.test.jsx`

**Interfaces:**

- Produce: `ProductCard({ producto })` con imagen estable, categoría, título, precio, ahorro, vencimiento y stock.
- Produce: `ProductCardSkeleton()` con la misma geometría aproximada de la tarjeta.
- Produce: `StatePanel({ type, title, description, action })`, donde `type` es `empty` o `error`.

- [ ] **Paso 1: Escribir pruebas que fallen.** Verificar jerarquía de precio, nombre accesible del enlace, reemplazo sin fotografía, recuperación ante error de imagen y texto explícito de stock/vencimiento.
- [ ] **Paso 2: Ejecutar la prueba específica.** Debe fallar con la tarjeta actual.
- [ ] **Paso 3: Rediseñar `ProductCard`.** Usar una relación de imagen consistente, contenido que no salte, máximo de dos líneas para el título, CTA implícita clara y estados hover/focus equivalentes.
- [ ] **Paso 4: Implementar skeleton y panel de estado.** El skeleton tendrá `aria-hidden="true"`; el panel de error podrá recibir una acción “Reintentar”.
- [ ] **Paso 5: Verificar.** Ejecutar pruebas específicas y toda la suite.
- [ ] **Paso 6: Commit opcional.** `git add frontend && git commit -m "feat: redesign product cards and loading states"`.

### Tarea 4: Portada, catálogo y filtros adaptables

**Archivos:**

- Modificar: `frontend/src/pages/ProductList.jsx`
- Crear: `frontend/src/pages/ProductList.test.jsx`
- Crear: `frontend/src/components/ProductFilters.jsx`
- Crear: `frontend/src/components/ProductFilters.test.jsx`
- Crear: `frontend/src/components/MobileFilterPanel.jsx`
- Modificar: `frontend/src/components/Navbar.jsx`

**Interfaces:**

- Produce: `ProductFilters({ values, categories, onChange, onApply, onClear })`.
- Produce: `MobileFilterPanel({ open, onClose, children })`.
- Conserva `serializarFiltros` y el contrato actual de `GET /productos`.

- [ ] **Paso 1: Escribir pruebas que fallen.** Verificar apertura/cierre del filtro móvil, aplicación, limpieza, recuento de filtros activos, ordenamiento y ausencia de acciones de rol incorrectas mientras el perfil carga.
- [ ] **Paso 2: Ejecutar las pruebas específicas.** Deben fallar con la estructura actual.
- [ ] **Paso 3: Renovar la portada.** Crear un hero compacto con propuesta de valor, dos beneficios medibles y CTA que lleve al catálogo; evitar una imagen decorativa pesada.
- [ ] **Paso 4: Extraer filtros.** En escritorio mostrarlos como barra/panel; en móvil mostrar un botón “Filtros” y el panel con acciones fijas “Limpiar” y “Ver productos”.
- [ ] **Paso 5: Integrar estados.** Mostrar una cuadrícula de skeletons al cargar, `StatePanel` con reintento en error y estado vacío con limpieza de filtros.
- [ ] **Paso 6: Mejorar navegación.** Añadir estado activo, menú móvil accesible y acciones según el rol sin parpadeos de contenido incorrecto.
- [ ] **Paso 7: Verificar.** Ejecutar pruebas, build y revisión manual a 320, 768 y 1280 px.
- [ ] **Paso 8: Commit opcional.** `git add frontend && git commit -m "feat: renew storefront and responsive filters"`.

### Tarea 5: Detalle del producto orientado a la compra

**Archivos:**

- Modificar: `frontend/src/pages/ProductDetail.jsx`
- Crear: `frontend/src/pages/ProductDetail.test.jsx`
- Crear: `frontend/src/components/ProductDetailSkeleton.jsx`
- Crear: `frontend/src/components/PurchasePanel.jsx`
- Crear: `frontend/src/components/PurchasePanel.test.jsx`

**Interfaces:**

- Produce: `PurchasePanel({ producto, usuario, perfil, onPurchase })`.
- Mantiene la petición existente `POST /pedidos` y las modalidades devueltas por `modalidadesDisponibles(producto)`.

- [ ] **Paso 1: Escribir pruebas que fallen.** Cubrir usuario anónimo, comprador, vendedor dueño, producto sin stock, modalidad coordinada, cantidad inválida, carga, error y compra exitosa.
- [ ] **Paso 2: Ejecutar las pruebas específicas.** Deben fallar antes de extraer el panel.
- [ ] **Paso 3: Reorganizar el detalle.** Priorizar foto, nombre, precio, ahorro y CTA; agrupar vencimiento/stock; colocar vendedor, zona, modalidad y descripción en una sección secundaria legible.
- [ ] **Paso 4: Implementar `PurchasePanel`.** Mantener una acción principal visible en móvil, deshabilitarla con explicación textual y mostrar el total calculado antes de comprar.
- [ ] **Paso 5: Añadir estados completos.** Skeleton equivalente al diseño, error con reintento y reemplazo de imagen defectuosa.
- [ ] **Paso 6: Verificar.** Ejecutar pruebas, suite completa y revisión móvil/escritorio.
- [ ] **Paso 7: Commit opcional.** `git add frontend && git commit -m "feat: improve product decision and purchase experience"`.

### Tarea 6: Paneles diferenciados para comprador y vendedor

**Archivos:**

- Modificar: `frontend/src/pages/MyOrders.jsx`
- Crear: `frontend/src/pages/MyOrders.test.jsx`
- Crear: `frontend/src/components/orders/BuyerOrdersView.jsx`
- Crear: `frontend/src/components/orders/SellerOrdersView.jsx`
- Crear: `frontend/src/components/orders/OrderCard.jsx`
- Crear: `frontend/src/components/orders/OrderSummary.jsx`
- Modificar: `frontend/src/components/OrderActions.jsx`

**Interfaces:**

- Produce: `BuyerOrdersView({ orders, onRefresh })`.
- Produce: `SellerOrdersView({ orders, onRefresh })`.
- Produce: `OrderSummary({ orders, role })` con métricas derivadas, sin nuevas llamadas a la API.
- Produce: `OrderCard({ order, role, onRefresh })`.

- [ ] **Paso 1: Escribir pruebas que fallen.** Verificar títulos, métricas y acciones distintas por rol; estados vacío/error/carga; pedido con datos parciales; y ausencia de panel equivocado mientras carga el perfil.
- [ ] **Paso 2: Ejecutar la prueba.** Debe fallar con el panel único actual.
- [ ] **Paso 3: Crear la vista de comprador.** Priorizar seguimiento, producto, total, modalidad y calificación; incluir resumen de compras activas y ahorro acumulado si puede derivarse de los datos presentes.
- [ ] **Paso 4: Crear la vista de vendedor.** Priorizar pedidos que requieren acción, ingresos derivados, unidades y transición de estado; no presentar métricas que el endpoint no pueda calcular correctamente.
- [ ] **Paso 5: Crear `OrderCard` compartida.** Mostrar estado con texto e indicador, información relevante según rol y acciones con áreas táctiles adecuadas.
- [ ] **Paso 6: Integrar skeletons y paneles de estado.** Mantener el refresco actual después de cada acción.
- [ ] **Paso 7: Verificar.** Ejecutar pruebas, suite y recorrido manual con las dos cuentas demo.
- [ ] **Paso 8: Commit opcional.** `git add frontend && git commit -m "feat: differentiate buyer and seller dashboards"`.

### Tarea 7: Modales accesibles y eliminación de `alert`/`prompt`

**Archivos:**

- Crear: `frontend/src/components/ui/Modal.jsx`
- Crear: `frontend/src/components/ui/Modal.test.jsx`
- Crear: `frontend/src/components/ui/ConfirmDialog.jsx`
- Crear: `frontend/src/components/orders/CancelOrderDialog.jsx`
- Modificar: `frontend/src/components/OrderActions.jsx`
- Modificar: `frontend/src/pages/ProductDetail.jsx`
- Revisar: `frontend/src/**/*.{js,jsx}`

**Interfaces:**

- Produce: `Modal({ open, title, description, onClose, initialFocusRef, children })`.
- Produce: `ConfirmDialog({ open, title, description, confirmLabel, tone, busy, onConfirm, onClose })`.
- Produce: `CancelOrderDialog({ order, open, busy, error, onConfirm, onClose })`, cuyo `onConfirm(reason)` exige un motivo no vacío.

- [ ] **Paso 1: Escribir pruebas que fallen del modal.** Verificar foco inicial, ciclo de `Tab`, cierre con `Escape`, bloqueo de cierre mientras está ocupado y devolución del foco.
- [ ] **Paso 2: Ejecutar la prueba específica.** Debe fallar porque el modal aún no existe.
- [ ] **Paso 3: Implementar `Modal` y `ConfirmDialog`.** Usar `role="dialog"`, `aria-modal`, título/descripción vinculados, portal y bloqueo de desplazamiento del documento.
- [ ] **Paso 4: Reemplazar `window.prompt`.** Mover la cancelación a `CancelOrderDialog`, con textarea, validación visible y conservación del error de la API.
- [ ] **Paso 5: Añadir confirmación de compra.** Mostrar producto, cantidad, modalidad y total antes de enviar; conservar la llamada actual al confirmar.
- [ ] **Paso 6: Buscar APIs nativas restantes.** Ejecutar `rg "window\.(alert|confirm|prompt)|\b(alert|confirm|prompt)\(" frontend/src`; el resultado esperado es vacío.
- [ ] **Paso 7: Verificar.** Ejecutar pruebas del modal, pedidos, detalle y suite completa.
- [ ] **Paso 8: Commit opcional.** `git add frontend && git commit -m "feat: replace native dialogs with accessible modals"`.

### Tarea 8: Accesibilidad, consistencia y verificación final

**Archivos:**

- Modificar según hallazgos: `frontend/src/**/*.jsx`
- Modificar según hallazgos: `frontend/src/index.css`
- Crear: `frontend/src/App.test.jsx`
- Modificar: `README.md`

**Interfaces:**

- No crea interfaces nuevas; valida el producto integrado.

- [ ] **Paso 1: Escribir pruebas integradas que fallen.** Cubrir salto al contenido principal, navegación por teclado, títulos de página, regiones `aria-live`, menú móvil, apertura de filtros y un flujo principal por rol.
- [ ] **Paso 2: Ejecutar las pruebas.** Registrar los fallos reales antes de corregir.
- [ ] **Paso 3: Corregir semántica y teclado.** Añadir enlace “Saltar al contenido”, encabezados en orden, etiquetas, descripciones de errores, `aria-current`, foco al navegar y textos alternativos útiles.
- [ ] **Paso 4: Revisar contraste y movimiento.** Verificar texto normal con relación mínima 4.5:1, texto grande 3:1, foco perceptible y ausencia de transiciones problemáticas con reducción de movimiento.
- [ ] **Paso 5: Revisar tamaños adaptables.** Probar 320, 375, 768, 1024 y 1440 px en catálogo, detalle, autenticación, formulario y pedidos; corregir desbordes y botones demasiado pequeños.
- [ ] **Paso 6: Ejecutar toda la verificación automática.** En `frontend`: `npm test`, `npm run build` y `npm audit`; todo debe terminar correctamente y sin vulnerabilidades conocidas de severidad alta/crítica.
- [ ] **Paso 7: Recorrer los flujos demo.** Comprador: buscar, filtrar, ver, comprar, cancelar permitido y calificar. Vendedor: publicar/editar, revisar ventas y avanzar estados. Verificar carga, vacío y error en ambos.
- [ ] **Paso 8: Actualizar README.** Documentar componentes nuevos, comandos de prueba y lista corta de comprobación visual; no cambiar las instrucciones de migración existentes.
- [ ] **Paso 9: Commit opcional.** `git add frontend README.md && git commit -m "feat: complete visual and accessibility renewal"`.

## Resultado esperado

Al terminar las ocho tareas, ÓrbiKa tendrá una portada y catálogo modernos, tarjetas y detalle con información accionable, experiencia móvil completa, paneles adecuados por rol, estados de carga/vacío/error consistentes, confirmaciones accesibles y una base visual reutilizable. La lógica existente seguirá operando sobre los mismos endpoints y datos.

## Estrategia de ejecución recomendada

Ejecutar en modo **Native**, una tarea por vez, verificando antes de avanzar. Las tareas comparten componentes y estilos, por lo que mantener una sola sesión reduce duplicaciones. Si el presupuesto es limitado, detenerse después de la Tarea 5 deja una primera versión visual coherente; las Tareas 6–8 completan paneles, modales y accesibilidad.
