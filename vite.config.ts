import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const networkHost = env.VITE_NETWORK_URL || 'localhost';

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                ssr: 'resources/js/ssr.tsx',
                refresh: true,
            }),
            react(),
            tailwindcss(),
        ],
        esbuild: {
            jsx: 'automatic',
        },
        resolve: {
            dedupe: ['react', 'react-dom'],
            alias: {
                'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
                react: resolve(__dirname, 'node_modules/react'),
                'react-dom': resolve(__dirname, 'node_modules/react-dom'),
            },
        },
        optimizeDeps: {
            include: ['react', 'react-dom', 'react/jsx-runtime'],
        },
        server: {
            host: true,
            port: 5173,
            hmr: {
                host: networkHost,
            },
        },
    };
});
