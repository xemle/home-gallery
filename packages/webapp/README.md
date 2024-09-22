# Web App Development

The web app can be stared in in development mode with hot reloading.
By default the api requests are proxied to the default local server
http://localhost:3000.

Use `API_PROXY` environment variable to change the api proxy url.

```
cd packages/webapp
API_PROXY=https://demo.home-gallery.org npm run dev
```
