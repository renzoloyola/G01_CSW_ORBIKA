# Sprints 1 y 2 — Correcciones y aceptación

Fecha: 19/10/2026. Código local; pruebas automatizadas con Auth/API simuladas y
PostgreSQL en memoria. La aceptación con Supabase alojado continúa pendiente.

## Análisis

Sprint 1: RF-01 registro comprador/vendedor, RF-02 acceso y cierre, RF-13
recuperación y RNF-05 seguridad. La revisión reprodujo un anuncio de cuenta
creada ante respuesta obfuscada de correo existente y un mensaje de envío de
recuperación ante un rechazo HTTP 429.

Sprint 2: RF-03 publicar, RF-04 descuento, RF-19 editar y RNF-06 adaptación.
La publicación y edición ya tenían validación y autorización. El descuento
estaba redondeado a enteros, frente al decimal solicitado en la planificación.

## Diseño

- Supabase Auth conserva la responsabilidad de registro, sesiones y correo.
  AuthContext devuelve si el registro produjo una sesión. Sin sesión se ofrece
  una respuesta genérica que sirve tanto para confirmación pendiente como para
  una cuenta que el proveedor oculta; no se introduce una consulta pública de
  existencia de usuarios ni se afirma que se creó una cuenta.
- La recuperación separa la respuesta aceptada del fallo del proveedor. Cada
  intento limpia el estado anterior; el fallo se captura y permite reintentar.
- Catálogo, detalle y formulario calculan el descuento a partir de precios con
  un decimal, usando céntimos para coincidir con el redondeo monetario SQL.
- La migración 004 conserva la vista y sus dependencias: renombra el descuento
  entero anterior y añade el decimal como `descuento_pct`. La ordenación de la
  API sigue utilizando ese nombre. No se cambian las migraciones históricas.

## Implementación

| Parte | Archivos |
| --- | --- |
| Resultado del registro | `frontend/src/context/AuthContext.jsx`, `frontend/src/pages/Auth.jsx` |
| Error y reintento de recuperación | `frontend/src/pages/RecoverPassword.jsx` |
| Cálculo y visualización del descuento | `frontend/src/pages/product.helpers.js`, `frontend/src/components/ProductCard.jsx` |
| Descuento decimal en PostgreSQL | `supabase/migrations/004_discount_precision.sql` |

El registro confirmado sin sesión conserva las instrucciones en pantalla y ofrece
enlaces a inicio de sesión y recuperación. Con sesión permite continuar al
catálogo. Un rechazo explícito de correo duplicado mantiene su mensaje de error.

## Pruebas automatizadas

Comandos desde las respectivas carpetas:

```powershell
# orbika-app/backend
npm install
npm test

# orbika-app/frontend
npm install
npm test
npm run build
npm run test:browser
```

`npm install` restaura PGlite, que ya está declarado en el backend, y Playwright
en el frontend. El script de navegador utiliza Edge en Windows. Las pruebas
simulan API y Auth; no escriben datos remotos ni envían correos.

| Comprobación | Resultado local |
| --- | --- |
| Backend completo, incluidas migraciones SQL | 91 pruebas aprobadas |
| Frontend, incluidos descuentos no enteros y empates de redondeo | 49 pruebas aprobadas |
| Compilación frontend | Correcta |
| Navegador | Registro pendiente, respuesta obfuscada, cuenta con sesión, duplicado explícito, error de recuperación y reintento; rutas por rol y cierre local |
| Recorridos existentes | Compra, publicación e imágenes simuladas; rechazo visible y modo demo de solo lectura |

La prueba SQL verifica 42,9 % para precios 7 y 4; 50,1 % para 80 y 39,96;
preservación de una vista dependiente, permiso de lectura y `security_invoker`.
La prueba de interfaz verifica que una tarjeta no vuelva al porcentaje entero
aunque reciba ese dato de una versión antigua de la API.

## Aplicación en el entorno de pruebas

1. Comprobar qué migraciones están aplicadas. En una base nueva, ejecutar 001,
   002, 003 y 004 una vez y en ese orden. Si ya tiene 003, ejecutar solo 004.
2. Configurar en Supabase Auth el Site URL y la URL de retorno
   `/actualizar-contrasena` de la aplicación. Ajustar la expiración de correo a
   1800 segundos. Esa configuración alojada no cambia al hacer push del código.
3. Ejecutar la aplicación en modo real (`VITE_DEMO_MODE=false`) y usar cuentas
   exclusivas de pruebas. Registrar los siguientes resultados y evidencias.

| Caso de aceptación | Evidencia por adjuntar | Estado |
| --- | --- | --- |
| Registro comprador/vendedor y persistencia del perfil | Capturas sin claves, rol y datos de prueba | Pendiente |
| Credenciales incorrectas, rol incorrecto y cierre | Resultado esperado/obtenido y capturas | Pendiente |
| Correo duplicado con la configuración real | Respuesta de interfaz y ausencia de cuenta duplicada | Pendiente |
| Correo real de recuperación y cambio de contraseña | Correo anonimizado, nuevo acceso y rechazo de clave anterior | Pendiente |
| Caducidad de 30 minutos y enlace ya utilizado | Configuración y resultados de ambos intentos | Pendiente |
| Publicación, carga de foto y recarga desde otro navegador | Producto persistido, imagen y catálogo | Pendiente |
| Edición propia y rechazo de otro vendedor | Cambio persistido y respuesta de rechazo | Pendiente |
| Descuento decimal y adaptación móvil/escritorio | Precios de prueba y capturas | Pendiente |

El cierre global de Supabase revoca la renovación de sesiones; los tokens de
acceso existentes pueden seguir vigentes hasta su expiración. La aceptación
debe distinguir cierre de interfaz y revocación efectiva de tokens.

Para el repositorio, adjuntar aquí el commit o Pull Request del sprint después
de publicarlo. La evidencia local de estas correcciones no acredita por sí sola
correo real, TLS del despliegue, Storage alojado ni aceptación remota.
