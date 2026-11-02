import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@wepo/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
  },
  worker: {
    format: 'es',
  },
  preview: {
    // Mirror public/_headers so the production preview exercises the same
    // cross-origin isolation and CSP as the static host. The deploy-only
    // `upgrade-insecure-requests` directive is omitted because it would force
    // this local HTTP preview to HTTPS.
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Resource-Policy': 'same-origin',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://www.highrevenueformat.com https://pl32158799.profitableratecpmnetwork.com https://pl32158800.profitableratecpmnetwork.com; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: blob: https:; font-src 'self' data: https:; connect-src 'self' blob: https:; media-src 'self' blob: https:; worker-src 'self' blob:; child-src 'self' blob: https:; frame-src 'self' blob: https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'",
    },
  },
});
