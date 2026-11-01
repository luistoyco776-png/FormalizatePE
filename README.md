# FormalízatePE · versión completa integrada con Supabase

Esta versión reconstruye la interfaz original del prototipo: pantalla de acceso, sidebar de escritorio, navegación móvil, pestañas Mi Progreso / Bóveda de Documentos / Guías Oficiales, diagnóstico, tarjetas de etapas y modal guiado de tres fases.

## Estructura

- `index.html`, `styles.css`: interfaz y estilos originales.
- `src/app.js`: coordinación de eventos y renderizado de la interfaz.
- `src/data/appData.js`: contenido de preguntas, rutas, etapas y guías.
- `src/state/appState.js`: estado de la aplicación y modo invitado/cuenta.
- `src/config/supabaseClient.js`: cliente Supabase.
- `src/services/`: autenticación, perfil, progreso y documentos.
- `supabase-setup.sql`: tablas, RLS, trigger y bucket privado.

## Configuración

1. Ejecuta `supabase-setup.sql` completo en Supabase SQL Editor.
2. Verifica en Authentication > URL Configuration que la URL local y la URL de despliegue estén autorizadas.
3. Abre la carpeta con VS Code y usa Live Server o un servidor estático local. No abras el HTML con `file://`.
4. Crea una cuenta desde el botón `Crear una cuenta`. Si Supabase requiere confirmación por correo, confirma y luego inicia sesión.
5. También puedes entrar como invitado: ese modo es local y no escribe en Supabase.

## Persistencia

- Perfil: `profiles` (figura legal y respuestas del diagnóstico).
- Etapas: `etapas_usuario`.
- Checklist: `requisitos_usuario`.
- Archivos: bucket privado `documentos` y metadatos en `documentos_usuario`.

La publishable key está diseñada para el cliente web; RLS protege las filas y las políticas de Storage limitan el acceso a carpetas cuyo primer segmento es el UUID autenticado. Nunca publiques una `service_role` key.

## Nota

Los costos, plazos y requisitos mostrados son orientativos y deben verificarse con la entidad correspondiente. La aplicación no consulta el estado real de SUNARP, SUNAT ni municipalidades.
