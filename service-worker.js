/* =========================================================
   CreaTicket v6.7 — Service Worker Offline
   GitHub Pages / PWA / iOS
   ========================================================= */

const CACHE_VERSION = 'creaticket-v6.7-offline-v1';
const APP_CACHE = `${CACHE_VERSION}-app`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

/*
   En GitHub el archivo principal se llama index.html.
   "./" permite que funcione correctamente dentro de la
   dirección del repositorio de GitHub Pages.
*/
const APP_SHELL = [
  './',
  './index.html'
];


/* =========================================================
   INSTALACIÓN
   Guarda CreaTicket para poder arrancar sin Internet.
   ========================================================= */

self.addEventListener('install', event => {

  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );

});


/* =========================================================
   ACTIVACIÓN
   Elimina cachés antiguas al cambiar de versión.
   ========================================================= */

self.addEventListener('activate', event => {

  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(

        keys
          .filter(key =>
            key !== APP_CACHE &&
            key !== RUNTIME_CACHE
          )
          .map(key => caches.delete(key))

      ))
      .then(() => self.clients.claim())
  );

});


/* =========================================================
   FETCH
   Control de funcionamiento Online / Offline
   ========================================================= */

self.addEventListener('fetch', event => {

  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }


  /* ---------------------------------------------------------
     HTML / NAVEGACIÓN

     ONLINE:
     Obtiene la versión más reciente de CreaTicket y actualiza
     la copia almacenada.

     OFFLINE:
     Abre la última versión almacenada.
     --------------------------------------------------------- */

  if (request.mode === 'navigate') {

    event.respondWith(

      fetch(request)

        .then(response => {

          if (response && response.ok) {

            const copy = response.clone();

            caches.open(APP_CACHE)
              .then(cache => cache.put(request, copy));

          }

          return response;

        })

        .catch(async () => {

          const exact = await caches.match(request);

          if (exact) {
            return exact;
          }


          const index = await caches.match('./index.html');

          if (index) {
            return index;
          }


          const root = await caches.match('./');

          if (root) {
            return root;
          }


          return new Response(

            `<!doctype html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport"
                    content="width=device-width,initial-scale=1">
              <title>CreaTicket</title>
            </head>
            <body>
              <h2>Sin conexión</h2>
              <p>
                Abre CreaTicket una vez con Internet
                para guardar la aplicación.
              </p>
            </body>
            </html>`,

            {
              headers: {
                'Content-Type':
                  'text/html; charset=utf-8'
              }
            }

          );

        })

    );

    return;

  }


  /* ---------------------------------------------------------
     RECURSOS

     Aquí se almacenarán automáticamente:

     • Google Fonts
     • Poppins
     • Inter
     • Font Awesome
     • Fuentes de Font Awesome
     • html2canvas
     • Otros recursos utilizados por CreaTicket

     Una vez descargados con Internet quedarán disponibles
     posteriormente sin conexión.
     --------------------------------------------------------- */

  event.respondWith(

    caches.match(request)

      .then(cached => {

        if (cached) {
          return cached;
        }


        return fetch(request)

          .then(response => {

            if (!response) {
              return response;
            }


            /*
               "opaque" permite almacenar recursos procedentes
               de dominios externos/CDN.
            */

            if (
              response.ok ||
              response.type === 'opaque'
            ) {

              const copy = response.clone();

              caches.open(RUNTIME_CACHE)
                .then(cache =>
                  cache.put(request, copy)
                );

            }


            return response;

          })

          .catch(() => cached);

      })

  );

});


/* =========================================================
   ACTUALIZACIONES
   ========================================================= */

self.addEventListener('message', event => {

  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

});
