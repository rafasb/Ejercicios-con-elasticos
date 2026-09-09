# Plan de Hashtags Musculares

## Alcance

Las etiquetas se limitaran inicialmente a grupos musculares. La interfaz las mostrara con `#`, pero el modelo de datos las guardara normalizadas, sin `#`, en singular y sin duplicados.

```js
tags: ["Gluteo", "Cuadriceps"]
```

El campo `muscle` se conserva como descripcion libre para mantener la compatibilidad con los ejercicios existentes. El nuevo campo `tags` sera la fuente para filtros y resumenes.

## Vocabulario controlado

- `Abdominal`
- `Biceps`
- `Cuadriceps`
- `Espalda`
- `Gluteo`
- `Hombro`
- `Lumbar`
- `Pectoral`
- `Triceps`

Se conserva `Abdominal` por coherencia con las etiquetas actuales de la rutina. La normalizacion eliminara `#` y espacios sobrantes, unificara variantes de mayusculas y minusculas, eliminara duplicados y descartara valores fuera de este vocabulario.

## Pasos de Implementacion

### 1. Definir la normalizacion de etiquetas

- Crear una constante unica con el vocabulario permitido.
- Crear utilidades para convertir una entrada textual o una lista antigua de etiquetas en un array valido de `tags`.
- Aceptar variantes habituales de entrada, como `#Gluteo` o `gluteo`, y almacenar siempre `Gluteo`.

Validacion: una entrada como `# Gluteo`, `gluteo` y `#Gluteo` termina como `["Gluteo"]`.

### 2. Normalizar la rutina inicial

- Corregir todos los encabezados `#### Hastags` a `#### Hashtags`.
- Revisar los ejercicios de los dias 1, 2 y 3 para que solo incluyan etiquetas del vocabulario controlado.
- Mantener varios grupos cuando el ejercicio los trabaje de forma relevante, por ejemplo `#Lumbar` y `#Gluteo` en buenos dias con banda.

Validacion: el cargador extrae etiquetas validas para los 15 ejercicios de la rutina, sin depender de una errata del encabezado.

### 3. Migrar el modelo de datos

- Incorporar `tags` al objeto `Ejercicio`.
- Adaptar el analisis de la rutina para obtener `tags` desde la seccion `Hashtags`.
- Migrar en el arranque los datos existentes que aun guarden `hashtags` como texto Markdown.
- Mantener una lectura de respaldo de `hashtags` durante la migracion para no perder datos ya almacenados en `localStorage`.

Validacion: una instalacion con datos previos conserva sus ejercicios y les asigna las etiquetas correctas al iniciar la aplicacion.

### 4. Actualizar el formulario de ejercicios

- Sustituir el campo de texto libre de hashtags por un control de seleccion multiple con los grupos musculares permitidos.
- Precargar las etiquetas al editar un ejercicio.
- Guardar siempre arrays de etiquetas normalizados.
- Corregir el texto visible a "Etiquetas musculares".

Validacion: crear o editar un ejercicio permite elegir varios grupos y las elecciones se conservan tras recargar la pagina.

### 5. Mostrar etiquetas en el catalogo

- Mostrar las etiquetas como insignias compactas junto al nombre o resumen de cada ejercicio.
- Aplicar estilos consistentes con la interfaz actual y legibles en movil.
- Omitir la seccion cuando un ejercicio no tenga etiquetas.

Validacion: todos los ejercicios iniciales muestran sus grupos y el catalogo conserva un diseno correcto desde 320 px de ancho.

### 6. Filtrar catalogo y planificacion

- Anadir un filtro de seleccion multiple por grupos musculares en la pestana `Ejercicios`.
- Aplicar coincidencia acumulativa: elegir `#Gluteo` y `#Cuadriceps` mostrara ejercicios que contengan ambos grupos.
- Reutilizar el filtro al seleccionar un ejercicio en `Plan`, limitando las opciones visibles a las etiquetas elegidas.
- Anadir una accion para limpiar todos los filtros.

Validacion: las combinaciones de filtros muestran el subconjunto esperado y sigue siendo posible anadir, editar y eliminar lineas del plan.

### 7. Anadir el resumen muscular semanal

- Calcular los ejercicios planificados por etiqueta muscular en todos los dias configurados.
- Mostrar un resumen compacto en `Plan` o `Ejercicios`, por ejemplo `Gluteo: 4 | Espalda: 2 | Pectoral: 2`.
- Usar exclusivamente `tags` para el calculo, no el campo libre `muscle`.
- No incluir recomendaciones automaticas en esta fase.

Validacion: al modificar el plan, el resumen se actualiza de inmediato; un ejercicio con dos grupos suma una vez en cada grupo.

### 8. Documentar y verificar

- Actualizar el modelo `Ejercicio` en las especificaciones y documentar el uso de etiquetas musculares en el README.
- Verificar carga inicial, migracion de `localStorage`, creacion y edicion, filtros combinados, planificacion y resumen semanal.
- Verificar la aplicacion mediante el servidor local y actualizar las versiones de recursos y cache de la PWA si fuese necesario.

## Orden de Ejecucion

1. Pasos 1 a 3: modelo, datos iniciales y compatibilidad.
2. Pasos 4 y 5: captura y visualizacion de etiquetas.
3. Paso 6: filtros de catalogo y planificacion.
4. Paso 7: resumen semanal.
5. Paso 8: documentacion y verificacion final.