# ÓrbiKa: corrección integral y datos de demostración

## Objetivo

Dejar ÓrbiKa como una aplicación demostrable de extremo a extremo, con los errores funcionales y de autorización conocidos corregidos, flujos de comprador y vendedor completos, pruebas automatizadas y datos de ejemplo reproducibles en Supabase.

No se inicializará Git, no se crearán commits y no se publicará la aplicación.

## Alcance

### Seguridad y autorización

- El registro público solo podrá crear perfiles `comprador` o `vendedor`; el rol `administrador` no se aceptará desde metadatos controlados por el navegador.
- Las funciones SQL con `security definer` tendrán `search_path` fijo y permisos de ejecución explícitos.
- La creación y cancelación de pedidos se realizará únicamente mediante el backend y será transaccional.
- Solo un comprador podrá comprar, cancelar o calificar sus propios pedidos.
- Solo el vendedor dueño del producto asociado podrá cambiar el estado de un pedido.
- Las transiciones válidas serán `creado -> preparando -> entregado -> completado`; la cancelación solo será posible desde `creado` o `preparando`.
- El backend continuará usando la clave `service_role`, pero cada operación aplicará autorización explícita antes de mutar datos.

### Validación y reglas de negocio

- Las rutas de productos y pedidos validarán identificadores, textos, números, fechas, modalidad de entrega y estados antes de llamar a Supabase.
- Solo se podrán editar campos públicos permitidos de un producto. No se aceptarán cambios de `id`, `vendedor_id`, `creado_en` ni otras columnas internas.
- No se podrán publicar productos vencidos, con precios o existencias inválidos, ni con precio actual superior al original.
- No se podrán comprar productos vencidos, agotados, no disponibles, propios ni con una modalidad de entrega incompatible.
- El catálogo público mostrará únicamente productos comprables y permitirá filtrar por búsqueda, categoría, zona y precio máximo, además de ordenar.
- La consulta de pedidos de vendedor devolverá exclusivamente pedidos de sus productos.

### Consistencia transaccional

- La función de compra comprobará comprador, vendedor, fecha, estado, stock y modalidad dentro de la misma transacción que crea el pedido y descuenta existencias.
- La cancelación bloqueará el pedido, cambiará su estado y restituirá el stock una sola vez dentro de una única función SQL.
- Las funciones privilegiadas dejarán de aceptar una identidad arbitraria del cliente; la identidad será validada por el backend y las funciones no serán ejecutables directamente por `anon` o `authenticated`.

### Interfaz

- El catálogo incorporará búsqueda y filtros visibles.
- Los estados de error, carga y ausencia de resultados serán explícitos.
- El detalle respetará las modalidades ofrecidas por el producto y validará la cantidad.
- Los compradores podrán cancelar pedidos permitidos y calificar pedidos completados.
- Los vendedores verán sus ventas y podrán avanzar sus estados mediante acciones válidas.
- Los vendedores podrán abrir una pantalla de edición para sus productos.
- El flujo de recuperación incluirá una pantalla para establecer la nueva contraseña al regresar desde el correo de Supabase.
- La navegación y los textos distinguirán entre “Mis compras” y “Mis ventas”.

### Datos de demostración

Se añadirá un comando idempotente `npm run seed:demo` en el backend. Utilizará la configuración administrativa existente para crear o actualizar:

- `vendedor@orbika.demo`, contraseña `DemoVendedor2026!`.
- `comprador@orbika.demo`, contraseña `DemoComprador2026!`.
- Perfiles completos para ambos usuarios.
- Categorías base.
- Al menos ocho productos con precios, zonas, modalidades, fechas y estados variados.
- Fotografías mediante URLs públicas estables; la demo no incluirá todavía un sistema propio de subida de imágenes.
- Pedidos en estados `creado`, `preparando`, `entregado`, `completado` y `cancelado`.
- Una calificación asociada a un pedido completado y notificaciones de ejemplo.

El comando podrá repetirse sin duplicar usuarios ni registros demo. Los datos quedarán identificados para poder actualizarlos de forma determinista.

## Arquitectura

### Base de datos

Una nueva migración corregirá funciones, permisos e índices sin reescribir la migración inicial ya aplicada. Las funciones transaccionales concentrarán las operaciones que deben ser atómicas.

### Backend

Se conservará el patrón ruta -> controlador -> servicio. Se incorporarán módulos pequeños para validación y reglas de transición. Los controladores convertirán errores esperados en respuestas HTTP coherentes y no expondrán mensajes internos de Supabase.

### Frontend

Se mantendrán React, React Router, Axios y Tailwind. Las páginas existentes se ampliarán y se agregarán páginas enfocadas para editar productos y actualizar contraseñas. No se añadirá un gestor de estado global adicional.

## Manejo de errores

- `400`: datos inválidos o transición no permitida.
- `401`: sesión ausente o expirada.
- `403`: rol o propiedad insuficiente.
- `404`: recurso inexistente o no visible para el usuario.
- `409`: conflicto de stock, duplicado o estado concurrente.
- `500`: fallo interno con mensaje seguro para el navegador y detalle solo en el servidor.

## Pruebas y verificación

- Se añadirá Vitest al backend para probar validaciones, autorización y reglas sin depender de una base remota.
- Los servicios aceptarán el cliente de datos de forma inyectable donde sea necesario para probar comportamiento real con dobles controlados.
- Se añadirán pruebas de componentes o lógica del frontend para filtros, modalidades, transiciones y recuperación de contraseña cuando aporten cobertura útil.
- Cada corrección se desarrollará con ciclo prueba fallida -> implementación mínima -> prueba aprobada.
- Verificación final: pruebas completas, compilación del frontend, comprobación de sintaxis/arranque del backend, auditoría de dependencias y ejecución idempotente del seeder.

## Dependencias y compatibilidad

- Se actualizarán dependencias vulnerables a versiones seguras compatibles.
- Si una actualización mayor exige migración de código, se preferirá la versión segura más cercana que preserve la arquitectura actual.
- No se ejecutará `npm audit fix --force` de forma automática.

## Fuera de alcance

- Inicializar Git, crear ramas o commits.
- Despliegue en producción.
- Pagos reales.
- Chat entre comprador y vendedor.
- Panel administrativo completo.
- Almacenamiento propio de imágenes en Supabase Storage.

## Criterios de aceptación

1. Ningún usuario puede otorgarse rol administrador ni modificar recursos ajenos.
2. Compra, cancelación y cambio de estado respetan propiedad, transición y concurrencia.
3. El frontend permite recorrer los flujos completos de comprador y vendedor.
4. `npm run seed:demo` deja una demo poblada y puede repetirse sin duplicados.
5. Las pruebas y la compilación terminan correctamente.
6. La auditoría final no conserva vulnerabilidades corregibles dentro de las versiones compatibles elegidas; cualquier riesgo residual queda documentado.
