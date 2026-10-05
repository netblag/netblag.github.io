import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

function duplicateForToolsSubdir() {
  return {
    name: 'duplicate-tools-subdir',
    closeBundle() {
      try {
        const outDir = path.resolve(__dirname, 'dist');
        const toolsDir = path.resolve(outDir, 'tools');
        if (!fs.existsSync(toolsDir)) {
          fs.mkdirSync(toolsDir, { recursive: true });
        }
        const filesToCopy = ['index.html', 'manifest.json', 'icon.svg', 'sql-wasm.wasm', 'sw.js'];
        for (const file of filesToCopy) {
          const src = path.resolve(outDir, file);
          if (fs.existsSync(src)) {
            fs.copyFileSync(src, path.resolve(toolsDir, file));
          }
        }
        if (fs.existsSync(path.resolve(outDir, 'assets'))) {
          fs.cpSync(path.resolve(outDir, 'assets'), path.resolve(toolsDir, 'assets'), { recursive: true });
        }
      } catch (err) {
        console.warn('Could not duplicate to tools dir', err);
      }
    }
  };
}

export default defineConfig(() => {
  return {
    base: './',
    plugins: [react(), tailwindcss(), duplicateForToolsSubdir()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
