import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { configureEcho } from '@laravel/echo-react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './context/ToastContext';

const isDev = import.meta.env.DEV;
const isHttps = window.location.protocol === 'https:';
const pagePort = Number(window.location.port || (isHttps ? 443 : 80));

configureEcho({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: isDev ? import.meta.env.VITE_REVERB_HOST : window.location.hostname,
    wsPort: isDev ? Number(import.meta.env.VITE_REVERB_PORT) : pagePort,
    wssPort: isDev ? Number(import.meta.env.VITE_REVERB_PORT) : pagePort,
    forceTLS: isDev ? (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https' : isHttps,
    enabledTransports: ['ws', 'wss'],
});

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <ToastProvider>
                <App {...props} />
            </ToastProvider>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
