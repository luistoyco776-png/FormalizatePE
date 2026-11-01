# FormalízatePE · versión Supabase modular

Esta entrega parte de los archivos actuales `index(3).html` y `script(2).js` que compartiste, conserva el flujo y catálogo de etapas y separa responsabilidades en módulos ES.

## Arquitectura
- `src/config/supabaseClient.js`: configuración del cliente.
- `src/data/appData.js`: preguntas, etapas, requisitos, estados y guías.
- `src/state/appState.js`: estado de interfaz.
- `src/utils/dom.js`: utilidades DOM.
- `src/services/authService.js`: registro, login, sesión y logout.
- `src/services/profileService.js`: lectura del perfil.
- `src/services/progressService.js`: persistencia de figura legal, etapas y checklist.
- `src/services/documentService.js`: carga de archivos y consulta de documentos privados.
- `src/app.js`: coordinación de interfaz y eventos.

## Puesta en marcha
1. Ejecuta `supabase-setup.sql` en Supabase SQL Editor.
2. Verifica que ya estén creadas `profiles`, `etapas_usuario`, `requisitos_usuario` y el trigger `handle_new_user()` del esquema anterior.
3. En Authentication → URL Configuration, registra tu URL local y la URL de despliegue.
4. Abre la carpeta con VS Code y ejecuta `index.html` mediante Live Server. No uses `file://`.
5. Registra una cuenta; si Supabase exige confirmación de correo, confirma el mensaje antes de iniciar sesión.

## Funciones
- Registro e inicio de sesión con Supabase Auth.
- Restauración de sesión.
- Modo invitado independiente, sin escrituras en Supabase.
- Perfil, figura legal, estados de etapas y checklist persistentes.
- Archivos PDF/JPG/PNG hasta 10 MB en bucket privado, con metadatos y enlaces firmados.

## Sprints sugeridos
1. Sprint 1 – Acceso y perfil: Auth, sesión y datos del emprendimiento.
2. Sprint 2 – Seguimiento: etapas, estados y checklist con RLS.
3. Sprint 3 – Expediente: Storage privado, metadatos y recuperación de archivos.
4. Sprint 4 – Validación: pruebas, accesibilidad, errores y despliegue.

La publishable key se encuentra en `src/config/supabaseClient.js`. Es una clave pública para cliente; no añadas una `service_role key` al frontend. RLS debe permanecer habilitado.
