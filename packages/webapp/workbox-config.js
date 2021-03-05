module.exports = {
  globDirectory: "dist",
  globPatterns: [
    "**/*.{html,js,css,svg,png,woff,woff2,eot,ico}"
  ],
  swDest: "dist/service-worker.js",
  clientsClaim: true,
  skipWaiting: true,
  runtimeCaching: [{
    urlPattern: /-preview-320\.jpg$/,
    handler: 'CacheFirst',
    options: {
      cacheName: 'images',
      expiration: {
        maxEntries: 50,
      },
    },
  }],

};