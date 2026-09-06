# Ritmo

Aplicación web progresiva para planificar y registrar entrenamientos con bandas de resistencia.

## Aviso importante de salud

Este proyecto es una **prueba de programación de software**. Los ejercicios, instrucciones y planes incluidos no han sido elaborados, revisados ni aprobados por un técnico especializado en ejercicio físico, profesional sanitario ni fisioterapeuta.

Seguir estas indicaciones puede ser dañino para la salud. No deben interpretarse como consejo médico, deportivo o de rehabilitación. Antes de realizar ejercicio, consulta con un profesional cualificado, especialmente si tienes una lesión, dolor, enfermedad o cualquier duda sobre tu capacidad física. Detén la actividad si sientes dolor o malestar.

## Funcionalidades

- Catálogo inicial de ejercicios con indicaciones técnicas desplegables.
- Plan semanal editable de 3 a 7 sesiones.
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

Los datos se almacenan en el `localStorage` del navegador. Desde la pestaña **Ejercicios** puedes elegir entre 3 y 7 días de entrenamiento semanales, descargar un Backup en formato JSON y recuperarlo con Restore. Al reducir el número de días, se eliminan los planes de los últimos días, pero se conserva el historial. El backup contiene la configuración semanal, el plan, el historial y los ajustes de la guía; los ejercicios personalizados no se incluyen.