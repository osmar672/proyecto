# Prompts utilizados durante el desarrollo

Este documento evidencia el uso responsable de inteligencia artificial, la revisión crítica y la mejora progresiva de los prompts.

## Iteración 1 — Análisis del alcance

### Planeación
Se necesitaba convertir el enunciado en una lista verificable y separar el trabajo por módulos sin omitir login, dashboard, los tres CRUD, LocalStorage, Git y documentación.

### Prompt
> Actúa como analista de requisitos de desarrollo web. Revisa el enunciado de un sistema administrativo académico construido con HTML, CSS y JavaScript. Convierte cada requisito en una checklist verificable. Separa requisitos funcionales, técnicos, de interfaz, Git, IA y entregables. No inventes funciones fuera del documento y señala dependencias entre módulos.

### Revisión de la respuesta
La primera salida agrupaba productos y proveedores como un solo módulo. Se detectó que cada CRUD debía evaluarse por separado.

### Corrección aplicada
Se pidió separar clientes, productos y proveedores, y agregar criterios concretos para Create, Read, Update y Delete.

### Resultado
Se creó `CHECKLIST_REQUISITOS.md` con trazabilidad entre el enunciado y la implementación.

---

## Iteración 2 — Autenticación y roles

### Planeación
El login debía validar credenciales, mostrar errores, guardar la sesión y restringir acciones según el rol usando LocalStorage.

### Prompt
> Actúa como desarrollador JavaScript. Diseña la lógica de autenticación de un proyecto académico sin backend. Usa LocalStorage, objetos, arreglos, funciones, condicionales y eventos del DOM. Debe existir un administrador y un cliente. El administrador tiene acceso completo a Dashboard, Clientes, Productos y Proveedores. El cliente solo puede acceder a Productos en modo de solo lectura: puede consultar, buscar, filtrar y ver detalles, pero no crear, editar ni eliminar. Evita guardar la contraseña escrita directamente: compara un hash SHA-256 con Web Crypto. Devuelve código modular, validaciones y explicación de límites de seguridad.

### Revisión de la respuesta
La primera versión redirigía al dashboard sin comprobar si el usuario seguía activo.

### Corrección aplicada
Se agregó validación de cuenta activa, sesión mínima sin contraseña y una función `requireAuth()` para proteger las páginas internas.

### Resultado
Login funcional, control por roles, protección de rutas y cierre de sesión con actividad registrada. El Cliente queda limitado al catálogo de Productos.

---

## Iteración 3 — CRUD reutilizable

### Planeación
Los tres módulos debían compartir comportamiento sin duplicar toda la lógica, pero conservar validaciones específicas.

### Prompt
> Actúa como desarrollador frontend senior. Propón un controlador CRUD reutilizable en JavaScript puro para clientes, productos y proveedores. Debe trabajar con LocalStorage, eventos delegados, formularios, validaciones, modales, búsqueda, filtros, paginación, renderizado dinámico y permisos por rol. Cada entidad debe aportar su serialización, validación, plantilla de fila y detalle. No uses frameworks ni librerías externas.

### Revisión de la respuesta
La primera propuesta permitía borrar proveedores con productos relacionados, dejando referencias inválidas.

### Corrección aplicada
Se agregó una validación `beforeDelete` que impide eliminar proveedores asociados a productos.

### Resultado
Controlador genérico `crud.js` y scripts específicos para cada entidad.

---

## Iteración 4 — Interfaz, accesibilidad y experiencia

### Planeación
La interfaz debía ser moderna, responsive y fácil de explicar, con animaciones, iconos, imágenes y sonidos sin depender de Internet.

### Prompt
> Diseña una interfaz administrativa profesional y responsive en CSS3 puro. Incluye sidebar, encabezado, tarjetas, tablas, modales, estados vacíos, tema oscuro, animaciones discretas, enfoque visible y adaptación móvil. Usa imágenes SVG locales, iconos simples y sonidos generados con Web Audio API. Respeta `prefers-reduced-motion` y evita recursos externos para que funcione sin conexión.

### Revisión de la respuesta
Algunas animaciones eran excesivas y podían dificultar la presentación.

### Corrección aplicada
Se redujo la duración, se agregó soporte para `prefers-reduced-motion` y se incluyó un botón para desactivar sonidos.

### Resultado
Diseño responsive, accesible y autónomo, sin CDN ni dependencias.

---

## Prompt final reutilizable para revisión

> Actúa como revisor técnico de un sistema administrativo web académico. Verifica HTML semántico, CSS responsive, JavaScript sin errores, eventos del DOM, objetos, arreglos, condicionales, ciclos, métodos de arreglos, LocalStorage, formularios, validaciones, login, dashboard y CRUD de clientes, productos y proveedores. Revisa también rutas relativas, nombres de archivo sensibles a mayúsculas, accesibilidad básica y ausencia de dependencias externas. Devuelve: 1) errores bloqueantes, 2) requisitos faltantes, 3) riesgos, 4) pruebas manuales sugeridas. No inventes resultados de pruebas.

## Conclusión sobre el uso de IA

La IA fue utilizada como apoyo para analizar, proponer estructuras y revisar código. Cada respuesta fue comparada con el enunciado, corregida y adaptada. El equipo debe comprender la lógica porque el docente puede solicitar explicaciones o modificaciones en tiempo real.


## Iteración adicional — Catálogo visual y compra simulada
**Objetivo:** mejorar Productos sin romper el CRUD existente ni los permisos por rol.

**Contexto dado a la IA:** aplicación académica HTML/CSS/JavaScript sin backend, persistencia mediante LocalStorage, administrador con CRUD completo y cliente limitado al catálogo.

**Prompt resumido:** agregar carga de varias imágenes comprimidas por producto, galería en modal, catálogo visual para clientes, carrito persistente con cantidades, flujo de compra simulada con contado/cuotas sin interés y una herramienta de vista móvil desde el Dashboard. Mantener la lógica existente y no usar emojis como iconos.

**Revisión:** se limitó la cantidad y tamaño de imágenes para evitar saturar LocalStorage, se mantuvo la autorización del cliente y se aclaró que los planes financieros son solamente datos de demostración.

---

## Iteración adicional — Moneda de pago y tipo de cambio BCCR

**Planeación:** antes de confirmar la compra, el cliente debía poder escoger CRC o USD. Si escogía USD, el sistema debía usar una tasa actual y aplicar un margen de cambio del 5% sin alterar los precios base almacenados en colones.

**Prompt utilizado:**
> Actúa como desarrollador JavaScript frontend. En el checkout de una aplicación académica HTML/CSS/JS agrega selección de moneda CRC/USD. Para USD consulta una API pública que permita obtener la referencia USD/CRC del Banco Central de Costa Rica, muestra la tasa al usuario y calcula `totalUSD = (totalCRC / tasaUSDCRC) * 1.05`. Expón por separado conversión base y margen del 5%. Usa `fetch`, valida errores, cachea una tasa reciente en LocalStorage y bloquea el pago en USD si no existe una tasa válida. Mantén contado y cuotas, y guarda en la orden la tasa y moneda usadas.

**Revisión:** se evitó incrementar directamente la tasa usada como divisor, porque eso habría reducido el monto en USD y sería contrario al objetivo de obtener un margen del 5%. El margen se aplica al monto ya convertido.

**Corrección e iteración:** se añadió manejo de error de red, uso limitado de una tasa reciente almacenada, botón de actualización y transparencia del cálculo en el resumen del checkout.

**Resultado:** checkout con CRC/USD, consulta USD/CRC del BCCR mediante Frankfurter API, margen del 5% y persistencia de los datos de conversión dentro de cada orden.


---

## Iteración adicional — Usuarios, registro público, solicitudes y reportes

**Planeación:** se necesitaba mover la vista móvil al login, permitir auto-registro de clientes, recibir solicitudes de proveedores sujetas a aprobación, reemplazar el módulo Clientes por Usuarios sin perder el requisito de gestión de clientes y permitir reportes imprimibles.

**Prompt utilizado:**
> Mantén el proyecto en HTML, CSS y JavaScript puro con LocalStorage. En el inicio de sesión agrega una vista móvil conmutable, registro de clientes y un formulario “Quiero ser proveedor” que quede pendiente de aprobación. En el panel administrador reemplaza “Clientes” por “Usuarios”, permite filtrar cuentas por usuario/cliente, administrador y proveedor, editar el rol y el estado, y revisar/aprobar/rechazar solicitudes de proveedores. Al aprobar, crea el proveedor y su cuenta. Agrega reportes imprimibles de usuarios, productos y proveedores que puedan guardarse como PDF desde el navegador. Conserva compatibilidad con datos existentes y no modifiques Git.

**Revisión:** se detectó que crear la cuenta del proveedor antes de la aprobación permitiría iniciar sesión sin revisión administrativa.

**Corrección aplicada:** la solicitud guarda el hash de contraseña de forma temporal en LocalStorage, pero la cuenta de usuario y el registro de proveedor se crean únicamente cuando el administrador aprueba la solicitud.

**Resultado:** flujo de registro completo, administración de roles, solicitudes pendientes, navegación actualizada a Usuarios y reportes imprimibles sin dependencias externas.

---

## Iteración adicional — Retroalimentación sonora confiable

**Planeación:** algunos navegadores podían bloquear o hacer casi imperceptible el sonido sintetizado con Web Audio.

**Prompt utilizado:**
> Mejora la retroalimentación sonora de la interfaz sin usar servicios externos. Usa archivos WAV pequeños y locales para clic, éxito, advertencia y error, y conserva Web Audio como fallback. El sonido debe respetar la preferencia guardada en LocalStorage.

**Resultado:** sonidos locales reproducidos desde interacciones del usuario y fallback sintetizado si la reproducción del archivo falla.


---

## Iteración adicional — Asistente IA contextual por rol

**Planeación:** se quería incorporar una interfaz de asistente similar a un chat sin romper la autenticación real del proyecto ni permitir que una persona cambiara de rol desde la interfaz. También se necesitaba reutilizar los datos reales de LocalStorage para compras, devoluciones, perfil y permisos.

**Prompt utilizado:**
> Integra en NovaAdmin CR un módulo de Asistente IA usando HTML, CSS y JavaScript puro. Adapta un diseño de chat con navegación, sugerencias, perfil, cambio de contraseña, consulta de compras, devoluciones y prueba de permisos. No uses un selector que permita cambiar roles: usa la sesión autenticada del sistema. Un administrador puede consultar usuarios globales; un cliente solo sus compras y devoluciones; un proveedor no puede ver datos privados de clientes. Reutiliza LocalStorage, sonidos e iconos SVG locales, mantén responsive y no agregues dependencias CDN.

**Revisión:** el ejemplo de referencia indicaba “JWT” y permitía simular el rol desde un selector. Eso no correspondía con la implementación real del proyecto, que usa LocalStorage, y habría debilitado el control de acceso.

**Corrección aplicada:** se sustituyó el selector de rol por el contexto de la sesión real, se rotuló correctamente el mecanismo como sesión LocalStorage y se agregó una verificación de permisos antes de consultar información global.

**Resultado:** nuevo módulo `AsistenteIA.html` con chat contextual, sugerencias, compras, devoluciones, actualización del perfil, cambio de contraseña, sonidos, modales y control de permisos por rol.


## Iteración: Garantías v9

**Objetivo:** agregar un flujo de garantía ligado a compras reales guardadas en LocalStorage.

**Prompt usado:** diseñar un módulo donde el cliente pueda solicitar garantía sobre un producto comprado y el administrador valide el historial de compra, revise requisitos y responda mediante un ticket persistente.

**Revisión:** se verificó que un cliente solo vea sus propias compras y tickets; el administrador puede ver el historial global; el proveedor no tiene acceso; la aprobación exige que la orden exista, corresponda al cliente, contenga el producto, tenga cantidad suficiente y esté dentro de 12 meses.

**Corrección aplicada:** se guardan datos de producto en cada nueva orden para conservar evidencia histórica aun si el catálogo cambia después.
