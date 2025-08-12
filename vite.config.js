import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    base: '/bvh-data-viewer/',
    plugins: [react()],
});
