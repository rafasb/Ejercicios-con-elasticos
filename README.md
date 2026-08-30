# Ritmo

Aplicación web progresiva para planificar y registrar entrenamientos con bandas de resistencia.

## Aviso importante de salud

Este proyecto es una **prueba de programación de software**. Los ejercicios, instrucciones y planes incluidos no han sido elaborados, revisados ni aprobados por un técnico especializado en ejercicio físico, profesional sanitario ni fisioterapeuta.

Seguir estas indicaciones puede ser dañino para la salud. No deben interpretarse como consejo médico, deportivo o de rehabilitación. Antes de realizar ejercicio, consulta con un profesional cualificado, especialmente si tienes una lesión, dolor, enfermedad o cualquier duda sobre tu capacidad física. Detén la actividad si sientes dolor o malestar.

## Funcionalidades

- Catálogo inicial de ejercicios con indicaciones técnicas desplegables.
- Plan semanal editable de tres sesiones.
- Registro de repeticiones, resistencia/peso y valoración tras cada sesión.
- Historial reutilizable para ajustar sesiones posteriores.
- Persistencia local en el navegador y funcionamiento PWA sin conexión tras la primera carga.

## Ejecutar con Docker

```bash
docker compose up --build
```

Abre [http://localhost:8080](http://localhost:8080).

Para detener el servicio:

```bash
docker compose down
```

## Desarrollo local

Puedes servir los archivos estáticos con cualquier servidor HTTP. Por ejemplo:

```bash
python3 -m http.server 4173
```

Abre [http://localhost:4173](http://localhost:4173).

## Datos

Los datos se almacenan únicamente en el `localStorage` del navegador. Al borrar los datos del sitio se eliminarán los ejercicios personalizados, planes e historial guardados.