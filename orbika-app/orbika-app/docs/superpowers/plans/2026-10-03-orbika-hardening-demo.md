# ÓrbiKa Hardening and Demo Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir los errores de seguridad y funcionamiento de ÓrbiKa, completar los flujos de comprador y vendedor y cargar datos de demostración reproducibles.

**Architecture:** Se mantiene React -> Express -> Supabase. Las reglas puras se separan en módulos testeables, la autorización permanece en el backend y las operaciones concurrentes se concentran en funciones PostgreSQL transaccionales con ejecución restringida.

**Tech Stack:** React 18, Vite, Tailwind CSS, React Router, Axios, Node.js, Express, Supabase/PostgreSQL y Vitest.

**Spec:** `docs/superpowers/specs/2026-10-03-orbika-hardening-demo-design.md`

## Global Constraints

- No inicializar Git, crear ramas ni commits.
- No usar `npm audit fix --force`.
- Mantener la interfaz y los mensajes en español.
- Mantener el patrón ruta -> controlador -> servicio.
- No añadir pagos, chat, panel administrativo ni almacenamiento propio de imágenes.
- Desarrollar cada corrección con prueba fallida, implementación mínima y prueba aprobada.

## Review Focus

- Dos cancelaciones concurrentes deben restituir el stock exactamente una vez; se cubre en Task 4.
- Un usuario autenticado que adivine un pedido ajeno debe recibir `403` o `404`; se cubre en Task 4.
- Fechas ISO interpretadas en distintas zonas horarias no deben convertir un producto válido en vencido; se cubre en Task 2.
- Un producto con modalidad `recojo` debe rechazar `coordinada`; se cubre en Task 4.
- Una segunda ejecución del seeder debe mantener las mismas cantidades de registros demo; se cubre en Task 8.

---

### Task 1: Infraestructura de pruebas y errores HTTP

**Files:**
- Modify: `backend/package.json`
- Modify: `backend/package-lock.json`
- Create: `backend/src/app.js`
- Create: `backend/src/errors/AppError.js`
- Create: `backend/src/middlewares/error.middleware.js`
- Modify: `backend/src/server.js`
- Test: `backend/test/errors.test.js`

**Interfaces:**
- Produces: `AppError(status, code, message)` y `errorHandler(err, req, res, next)`.

- [ ] Añadir Vitest, Supertest y el script `test`; crear pruebas fallidas para respuestas 400/403/404/409 y ocultamiento de errores internos.
- [ ] Ejecutar `npm test -- errors.test.js` y confirmar que falla por módulos ausentes.
- [ ] Implementar `AppError` y `errorHandler`; exportar la aplicación sin escuchar desde `app.js` y dejar `server.js` solo como punto de arranque.
- [ ] Ejecutar la prueba focal y luego `npm test` hasta obtener cero fallos.

### Task 2: Validación reutilizable de productos y pedidos

**Files:**
- Create: `backend/src/validation/common.validation.js`
- Create: `backend/src/validation/producto.validation.js`
- Create: `backend/src/validation/pedido.validation.js`
- Test: `backend/test/validation/producto.validation.test.js`
- Test: `backend/test/validation/pedido.validation.test.js`

**Interfaces:**
- Produces: `validarProductoNuevo(input, hoy)`, `validarEdicionProducto(input, hoy)`, `validarCompra(input)`, `validarCancelacion(input)`, `validarCambioEstado(input)` y `TRANSICIONES_PEDIDO`.

- [ ] Escribir pruebas fallidas para IDs, precios, stock, fechas locales, textos, modalidades, cantidad, motivo, puntaje y transiciones.
- [ ] Ejecutar las pruebas y confirmar fallos por funciones ausentes.
- [ ] Implementar validadores que devuelvan datos normalizados o lancen `AppError(400, ...)`.
- [ ] Ejecutar pruebas focales y suite completa hasta cero fallos.

### Task 3: Migración de seguridad y perfiles

**Files:**
- Create: `supabase/migrations/002_security_and_order_transactions.sql`
- Test: `backend/test/sql/security-migration.test.js`

**Interfaces:**
- Produces: trigger de perfiles seguro; funciones `crear_pedido_transaccion(...)` y `cancelar_pedido_transaccion(...)`; permisos SQL restringidos.

- [ ] Escribir una prueba estática fallida que exija `set search_path`, normalización de rol, `revoke execute ... from public, anon, authenticated`, bloqueo de filas y cancelación atómica.
- [ ] Ejecutar la prueba y confirmar que falla porque la migración no existe.
- [ ] Crear la migración sin modificar `001_init_schema.sql`; conservar compatibilidad con instalaciones existentes.
- [ ] Ejecutar la prueba focal y suite completa hasta cero fallos.

### Task 4: Servicios y rutas de pedidos autorizados

**Files:**
- Modify: `backend/src/routes/pedido.routes.js`
- Modify: `backend/src/controllers/pedido.controller.js`
- Modify: `backend/src/services/pedido.service.js`
- Test: `backend/test/services/pedido.service.test.js`
- Test: `backend/test/routes/pedido.routes.test.js`

**Interfaces:**
- Consumes: validadores de Task 2 y RPC de Task 3.
- Produces: `crearPedido(actor, datos, db)`, `cancelarPedido(id, actor, motivo, db)`, `actualizarEstadoPedido(id, actor, estado, db)`, `calificarPedido(id, actor, puntaje, comentario, db)` y listado por rol sin filtraciones.

- [ ] Escribir pruebas fallidas para rol comprador, propiedad, pedido ajeno, modalidad incompatible, producto propio, transiciones, calificación y filtro `!inner` del vendedor.
- [ ] Ejecutar pruebas y confirmar fallos sobre el comportamiento inseguro actual.
- [ ] Inyectar el cliente de datos, usar errores seguros y aplicar autorización explícita en servicios y rutas.
- [ ] Sustituir cancelación en dos pasos por la RPC atómica y limitar estados válidos.
- [ ] Ejecutar pruebas focales y suite completa hasta cero fallos.

### Task 5: Productos seguros y catálogo correcto

**Files:**
- Modify: `backend/src/controllers/producto.controller.js`
- Modify: `backend/src/services/producto.service.js`
- Test: `backend/test/services/producto.service.test.js`
- Test: `backend/test/routes/producto.routes.test.js`

**Interfaces:**
- Consumes: validadores de Task 2.
- Produces: `buscarProductos(filtros, db)`, `publicarProducto(actor, datos, db)` y `editarProducto(id, actor, cambios, db)` con lista blanca.

- [ ] Escribir pruebas fallidas para búsqueda textual, filtros, exclusión de vencidos/vendidos, propiedad y rechazo de columnas internas.
- [ ] Ejecutar pruebas y confirmar fallos esperados.
- [ ] Implementar filtros normalizados, selección de productos comprables y edición mediante lista blanca.
- [ ] Ejecutar pruebas focales y suite completa hasta cero fallos.

### Task 6: Autenticación y recuperación completa en React

**Files:**
- Modify: `frontend/src/context/AuthContext.jsx`
- Create: `frontend/src/context/auth.helpers.js`
- Modify: `frontend/src/pages/Register.jsx`
- Modify: `frontend/src/pages/RecoverPassword.jsx`
- Create: `frontend/src/pages/UpdatePassword.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Test: `frontend/src/context/auth.helpers.test.js`

**Interfaces:**
- Produces: `actualizarContrasena(nuevaContrasena)`, ruta `/actualizar-contrasena` y normalización de rol público.

- [ ] Añadir Vitest y escribir pruebas fallidas para roles permitidos, redirección de recuperación y actualización de contraseña.
- [ ] Ejecutar pruebas y confirmar los fallos esperados.
- [ ] Implementar helpers testeables, `UpdatePassword` y `redirectTo` en la recuperación.
- [ ] Ejecutar pruebas focales, suite y `npm run build` hasta cero fallos.

### Task 7: Catálogo, detalle y edición de productos

**Files:**
- Modify: `frontend/src/pages/ProductList.jsx`
- Modify: `frontend/src/pages/ProductDetail.jsx`
- Modify: `frontend/src/pages/PublishProduct.jsx`
- Create: `frontend/src/pages/product.helpers.js`
- Create: `frontend/src/pages/EditProduct.jsx`
- Modify: `frontend/src/App.jsx`
- Modify: `frontend/src/components/ProductCard.jsx`
- Test: `frontend/src/pages/product.helpers.test.js`

**Interfaces:**
- Produces: filtros enviados a `/productos`, `modalidadesDisponibles(producto)`, ruta `/productos/:id/editar` y mensajes de error explícitos.

- [ ] Escribir pruebas fallidas para serialización de filtros, modalidades `recojo/coordinada/ambas`, cantidades y fecha visible.
- [ ] Ejecutar pruebas y confirmar fallos esperados.
- [ ] Implementar controles de búsqueda/categoría/zona/precio/orden, manejo de errores y modalidades correctas.
- [ ] Implementar formulario compartido de publicación/edición o reutilización equivalente sin duplicar reglas.
- [ ] Ejecutar pruebas focales, suite y compilación hasta cero fallos.

### Task 8: Compras, ventas, estados y calificaciones en React

**Files:**
- Modify: `frontend/src/pages/MyOrders.jsx`
- Create: `frontend/src/pages/order.helpers.js`
- Modify: `frontend/src/components/Navbar.jsx`
- Create: `frontend/src/components/OrderActions.jsx`
- Test: `frontend/src/pages/order.helpers.test.js`

**Interfaces:**
- Produces: `accionesPermitidas(rol, estado)`, actualización de estado, cancelación y calificación desde la interfaz.

- [ ] Escribir pruebas fallidas para acciones de comprador y vendedor en cada estado.
- [ ] Ejecutar pruebas y confirmar fallos esperados.
- [ ] Implementar textos “Mis compras”/“Mis ventas”, controles de transición y formulario de calificación.
- [ ] Añadir manejo visible de errores y recarga segura de pedidos.
- [ ] Ejecutar pruebas focales, suite y compilación hasta cero fallos.

### Task 9: Seeder idempotente de demostración

**Files:**
- Create: `backend/scripts/seed-demo.js`
- Create: `backend/src/demo/demo-data.js`
- Modify: `backend/package.json`
- Modify: `README.md`
- Test: `backend/test/demo/seed-demo.test.js`

**Interfaces:**
- Produces: `seedDemo({ db, authAdmin, now })` y script `npm run seed:demo`.

- [ ] Escribir pruebas fallidas con un adaptador de datos en memoria para usuarios, perfiles, categorías, ocho productos, cinco pedidos, calificación y notificaciones.
- [ ] Añadir una prueba que ejecute `seedDemo` dos veces y compare conteos e identificadores.
- [ ] Ejecutar pruebas y confirmar fallos por módulos ausentes.
- [ ] Implementar datos deterministas, creación/actualización de usuarios Auth y upserts de registros demo.
- [ ] Documentar credenciales, orden de migraciones y comando de carga.
- [ ] Ejecutar prueba focal, suite completa y luego `npm run seed:demo` dos veces contra Supabase configurado.

### Task 10: Dependencias, limpieza y verificación integral

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`
- Modify: `backend/package.json`
- Modify: `backend/package-lock.json`
- Modify: `README.md`
- Remove: directorio accidental `{frontend` únicamente después de verificar que contiene solo carpetas vacías.

**Interfaces:**
- Consumes: entregables de Tasks 1-9.
- Produces: instalación reproducible, documentación coherente y evidencia final.

- [ ] Ejecutar `npm outdated` y actualizar a versiones seguras compatibles; migrar código solo cuando una versión mayor sea necesaria.
- [ ] Ejecutar `npm audit --omit=dev` y `npm audit`; documentar cualquier riesgo residual.
- [ ] Ejecutar `npm test` en backend y frontend.
- [ ] Ejecutar `npm run build` en frontend y comprobación de arranque/salud/catálogo del backend.
- [ ] Verificar manualmente registro, inicio de sesión, catálogo, compra, cancelación, cambio de estado, calificación, edición y recuperación con las cuentas demo.
- [ ] Confirmar que no se inicializó ni modificó Git y resumir archivos y resultados.
