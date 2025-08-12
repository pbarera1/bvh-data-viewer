import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    // base: '/bvh-data-viewer/', only got github pages but no static asset hosting there
    plugins: [react()],
});
