module.exports = {
  globDirectory: "dist",
  globPatterns: [
    "**/*.{html,png,woff,woff2,eot,ico,webmanifest,map}"
  ],
  swDest: "dist/service-worker.js",
  clientsClaim: true,
  skipWaiting: true
};