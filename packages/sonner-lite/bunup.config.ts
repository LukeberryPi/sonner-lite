import { defineConfig } from 'bunup';

export default defineConfig({
  entry: 'src/index.tsx',
  format: ['esm', 'cjs'],
  dts: true,
  css: { inject: true },
});
