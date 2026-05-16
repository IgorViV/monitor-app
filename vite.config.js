// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/__tests__/setup.js'],
        mockReset: true,
        restoreMocks: true,
        css: true,
        testTimeout: 10000, // Увеличиваем таймаут до 10 секунд
        hookTimeout: 10000,
        deps: {
            inline: ['bootstrap']
        }
    },
    base: './',
});