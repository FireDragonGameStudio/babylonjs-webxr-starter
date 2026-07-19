import basicSsl from '@vitejs/plugin-basic-ssl'

export default {
  plugins: [
    basicSsl(),
  ],
  server: {
    // Expose the dev server on the local network so the Quest 3 browser
    // can open it via https://<your-pc-ip>:5173 (WebXR requires HTTPS).
    host: true,
  },
  optimizeDeps: {
    // Havok ships as a WASM module — Vite's dependency pre-bundling would
    // break the .wasm file resolution, so it must be excluded.
    exclude: ['@babylonjs/havok'],
  },
}