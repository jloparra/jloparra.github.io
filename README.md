# TrackIU MVP · demo navegable

Demo funcional para validar con coaches el ciclo:

`contexto → entrenamiento → filtro → propuesta explicable → decisión del coach → sesión individual → feedback`

## URL

La publicación se sirve desde `https://jloparra.github.io/`.

## Qué permite probar

- Vistas y permisos diferenciados de `super_admin`, `manager`, `trainer` y `athlete`.
- N gimnasios y cupo máximo de 3 atletas activos por gimnasio.
- Grants de acceso explícitos y revocables.
- Lesiones y molestias por zona corporal.
- Catálogo global etiquetado con alternativas dirigidas.
- Entrenamientos construidos desde catálogo.
- Motor determinista de propuestas y cockpit de decisión.
- Pre-check-in, sesión individual y feedback posterior.
- Fake doors honestos de Programación y Tracks.

## Alcance técnico

Es una demo estática de validación con persistencia en `localStorage`. No implementa autenticación real, backend, cifrado, RLS ni garantías de aislamiento de producción. No debe utilizarse con datos reales de salud.

## Repositorios

- Especificaciones y prompt de construcción: `jloparra/trackiu-mvp-build-pack`.
- Fuente canónica consultada en solo lectura: `TrackIU/web`, PR #1.
