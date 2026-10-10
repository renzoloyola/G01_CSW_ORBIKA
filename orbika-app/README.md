# ÓrbiKa

Mercado web de alimentos perecibles para Tacna. El repositorio contiene una
implementación parcial de 11 de los 21 casos de uso del SRS: acceso, catálogo,
publicación, edición, compra, pedidos, cancelación y calificación. Los otros diez
casos requieren desarrollo; no se declara cumplimiento total ni validación en producción.

La arquitectura implementada es React 18 + Vite + Tailwind, una API REST
Node.js/Express y Supabase Auth, PostgreSQL y Storage. No se utiliza Sequelize,
Cloudinary, bcrypt local ni un proveedor SMTP propio.

El registro técnico actualizado está en
[estado-implementacion.md](docs/estado-implementacion.md). Este registro y este
README describen el código actual; los documentos académicos anteriores
contienen afirmaciones de alcance que deben sustituirse en una próxima entrega.

## Instalación

1. Crear un proyecto Supabase para desarrollo o pruebas.
2. Ejecutar las migraciones **una sola vez y en este orden** desde SQL Editor:
   - `supabase/migrations/001_init_schema.sql`
   - `supabase/migrations/002_security_and_order_transactions.sql`
   - `supabase/migrations/003_srs_integrity_and_images.sql`
3. Ejecutar opcionalmente `supabase/seed.sql` para cargar categorías.
4. Copiar los archivos `.env.example` a `.env` en frontend y backend y completar
   las variables del proyecto. La clave `service_role` se usa solo en el backend.

En PowerShell, iniciar dos terminales:

```powershell
cd backend
Copy-Item .env.example .env
npm install
npm run dev
```

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

API: `http://localhost:4000/api`; frontend: `http://localhost:5173`.

Si la base ya tiene 001 y 002, aplicar solamente 003 antes de iniciar el código
actual. Esta migración cambia la relación producto/pedido y la firma de la RPC
de compra. Debe coordinarse con la actualización del backend y frontend.
En una base con datos importantes, obtener una copia de seguridad y comprobar
primero la migración en un entorno de pruebas. La migración es transaccional:
si encuentra más de un detalle para un pedido, la restricción de unicidad aborta
el cambio para que esos registros puedan revisarse sin eliminar historial.

## Operaciones reales y demostración

El valor predeterminado es `VITE_DEMO_MODE=false`. Un catálogo o historial vacío
permanece vacío, los errores de conexión son visibles y una compra o publicación
solo se confirma después de una respuesta exitosa de la API.

Para mostrar una demostración aislada, iniciar Vite con:

```powershell
$env:VITE_DEMO_MODE="true"
npm run dev
```

La demostración muestra un aviso visible y una cuenta ficticia de comprador.
Usa exclusivamente productos y pedidos locales de ejemplo. Compra, publicación,
calificación y cambios de estado están deshabilitados. No sustituye una prueba
de integración. Para volver al modo real, quitar la variable de entorno o ponerla
en `false` y reiniciar Vite; en una compilación, reconstruir el frontend.

## Imágenes

Se aceptan archivos JPG/PNG de hasta 5 MB. El frontend muestra una vista previa,
envía los bytes a `POST /api/imagenes` y guarda la URL devuelta por Supabase
Storage. La API exige un vendedor habilitado y valida tipo, firma y tamaño.
La migración 003 crea el bucket público `orbika-productos`; las escrituras solo
se realizan desde el backend. También se admite una URL HTTP/HTTPS externa.

## Reglas del flujo de pedidos

`creado → preparando → listo_para_entrega → entregado → completado`

El vendedor realiza los primeros tres avances; únicamente el comprador del pedido
confirma la recepción y lo completa. Solo se permite cancelar desde `creado` o
`preparando`; una cancelación repetida no devuelve stock nuevamente.

La compra lleva una clave UUID de confirmación, conservada ante un reintento con
los mismos datos. La función SQL crea pedido, detalle, descuento de stock y aviso
en la misma transacción. Reutilizar una clave con otros datos se rechaza.

La disponibilidad considera publicación, categoría y vendedor habilitados,
stock positivo y vencimiento posterior al día actual de Lima. No se vende desde
el inicio del día de vencimiento. Reponer stock no reactiva productos retirados
o vencidos. Categoría, vencimiento y peso originales no se editan: una oferta
diferente requiere una publicación nueva.

Cada pedido tiene un detalle con el producto y valores históricos de nombre,
precio original, precio de compra y peso. En pedidos anteriores a 003, el precio
original y peso históricos quedan desconocidos; no se reconstruyen con valores
actuales ni deben usarse para afirmar impacto medido. Los importes representan
el valor de los pedidos, no pagos electrónicos acreditados por ÓrbiKa.

## Recuperación de contraseña

Configurar en Supabase Auth el Site URL y la URL permitida
`http://localhost:5173/actualizar-contrasena` (o su equivalente del despliegue).
Configurar la expiración del enlace de recuperación en 1800 segundos para cumplir
RN-09. El frontend exige ocho caracteres y confirmación, actualiza la contraseña
y solicita el cierre global de sesiones antes de volver al inicio de sesión.
Debe comprobarse el correo, el enlace de un uso y las sesiones contra Auth real;
los tokens de acceso emitidos pueden seguir vigentes hasta su expiración.

## Datos de prueba persistidos

Después de las tres migraciones, únicamente en una base de desarrollo:

```powershell
cd backend
npm run seed:demo
```

Crea ocho productos, cinco pedidos y las cuentas:

- Vendedor: `vendedor@orbika.demo` / `DemoVendedor2026!`
- Comprador: `comprador@orbika.demo` / `DemoComprador2026!`

Estas cuentas son para desarrollo. Este comando sí escribe en la base configurada
y es distinto del modo de demostración de solo lectura. Los pedidos se identifican
con claves deterministas para evitar duplicados al repetir el seeder. Las fechas,
categorías y pesos de productos existentes se conservan; repetirlo no extiende
el vencimiento de las ofertas ya creadas.

## Pruebas

```powershell
cd backend
npm test
cd ../frontend
npm test
npm run build
```

El backend prueba servicios, validaciones, rutas HTTP y las migraciones en
PostgreSQL en memoria con PGlite, incluidos idempotencia, stock y RLS. Las tablas
externas de Auth y Storage tienen una estructura de prueba mínima; no se envían
correos ni se contacta con la base remota. PGlite tiene una sola conexión, por lo
que estas pruebas no certifican concurrencia entre conexiones reales.

La prueba de navegador levanta dos servidores Vite temporales, usa un navegador
aislado y simula API/Auth para verificar la interfaz sin datos remotos:

```powershell
# npm install incorpora Playwright. En Windows se usa Edge instalado.
npm run test:browser
```

Si Playwright se proporciona mediante un runtime externo, establecer
`ORBIKA_PLAYWRIGHT_ENTRYPOINT` con la ruta absoluta a su `index.mjs`.
`ORBIKA_BROWSER_CHANNEL` permite elegir el canal (predeterminado: `msedge`).

Antes del piloto se requiere aplicar 003 en Supabase de pruebas y validar allí
PostgREST, autenticación real, Storage, recuperación por correo y compras
simultáneas. Los resultados locales no acreditan rendimiento, disponibilidad
mensual, aceptación de usuarios ni cumplimiento de los 21 casos de uso.

## Funciones pendientes

CU-09 estadísticas completas; CU-10 gestión de usuarios; CU-11 moderación;
CU-12 reportes de impacto; CU-14 edición de perfil; CU-15 favoritos;
CU-16 mensajería; CU-18 reportes de productos; CU-20 gestión de categorías;
CU-21 suscripciones premium. Estas funciones necesitan pantallas, endpoints y,
según el caso, nuevas tablas y políticas; su modelo completo todavía no está migrado.
