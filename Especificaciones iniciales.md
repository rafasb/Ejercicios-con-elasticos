# Especificaciones

## Objetivo

Crear una aplicación web progresiva (PWA) para entrenar con bandas de resistencia. Debe permitir consultar la técnica de los ejercicios, planificar un ciclo semanal de tres sesiones y registrar el resultado de cada ejecución desde un móvil.

## Alcance de la primera versión

- Catálogo inicial cargado desde la rutina de bandas: ejercicios de los días 1, 2 y 3 con resumen, instrucciones, detalles técnicos y errores comunes.
- Alta de ejercicios propios con nombre, grupo muscular, resumen e indicaciones de técnica.
- Ciclo semanal editable de tres sesiones: Día 1, Día 2 y Día 3.
- Planificación de cada ejercicio con series, repeticiones objetivo y resistencia/peso previsto.
- Vista de entrenamiento que muestra solo la sesión seleccionada y permite desplegar u ocultar la técnica de cada ejercicio.
- Registro por ejercicio de repeticiones realizadas, resistencia/peso utilizado y valoración: fácil, aceptable o imposible.
- Historial de sesiones finalizadas y acción para copiar sus valores al plan, facilitando la modificación de sesiones repetidas.
- Persistencia local en el dispositivo mediante `localStorage`; no hay cuentas, servidor ni sincronización en esta versión.

## Usuarios y flujos

### Planificar el ciclo

La persona abre la pestaña **Plan**, elige uno de los tres días y añade ejercicios del catálogo. Puede editar o eliminar cada línea del plan. El ciclo se conserva para reutilizarlo cada semana.

### Realizar una sesión

En **Entrenar**, selecciona un día. Ve el objetivo de series, repeticiones y resistencia para cada ejercicio. Puede abrir el detalle técnico solo cuando lo necesita. Al terminar cada ejercicio, registra sus valores y una valoración. El botón de finalizar guarda una instantánea completa en el historial.

### Revisar y ajustar

En **Historial**, consulta las sesiones terminadas con fecha, resultados y valoración. Puede aplicar los resultados de una sesión al día correspondiente del plan y después ajustar los valores manualmente.

### Ampliar el catálogo

En **Ejercicios**, consulta los ejercicios existentes y despliega su técnica. Desde el botón de añadir crea ejercicios personalizados, que estarán disponibles al planificar.

## Modelo de datos

| Entidad | Campos principales |
| :--- | :--- |
| Ejercicio | id, nombre, grupo muscular, resumen, ejecución, detalles técnicos, errores comunes |
| Plan semanal | tres sesiones identificadas por Día 1, Día 2 y Día 3 |
| Línea planificada | id de ejercicio, series, repeticiones objetivo, resistencia/peso previsto |
| Sesión completada | fecha, día, líneas registradas |
| Registro | id de ejercicio, repeticiones realizadas, resistencia/peso usado, valoración |

## Requisitos no funcionales

- Diseño mobile-first, utilizable desde 320 px de ancho y con controles táctiles de al menos 44 px.
- Instalable como PWA mediante manifiesto y service worker, con funcionamiento sin conexión después de la primera visita.
- Interfaz minimalista: información secundaria desplegable y navegación por pestañas.
- Datos almacenados localmente, sin transmitir información fuera del dispositivo.
- Desarrollo y prueba reproducibles con Docker Compose.
- Accesibilidad básica: etiquetas de formulario, contraste suficiente, navegación por teclado y mensajes de estado.

## Criterios de aceptación

- La aplicación carga con las tres sesiones de la rutina inicial y permite modificar cada una.
- Se puede crear un ejercicio y añadirlo a cualquiera de los tres días.
- Una sesión muestra el plan y permite consultar la técnica sin abandonar el entrenamiento.
- Al finalizar una sesión, cada registro conserva repeticiones, resistencia/peso y valoración.
- El historial muestra los datos guardados y permite reutilizarlos en el plan del mismo día.
- La aplicación se puede instalar desde un navegador compatible y sigue mostrando los datos y recursos básicos sin conexión.
- `docker compose up --build` la sirve correctamente en el puerto documentado.

## Plan de desarrollo

1. Definir las entidades, los flujos y los criterios de aceptación de esta especificación.
2. Crear la PWA mobile-first, el catálogo inicial y la persistencia local.
3. Implementar la edición de planes, la ejecución de sesiones y el historial reutilizable.
4. Añadir manifiesto, service worker y la configuración de Docker Compose.
5. Verificar los flujos principales en navegador y la construcción/servicio del contenedor.
