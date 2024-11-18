import { join } from 'path';
import { skeleton } from '@skeletonlabs/tw-plugin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const skeletonPath = join(__dirname, 'node_modules/@skeletonlabs/skeleton');

export default {
    darkMode: 'class',
    content: ['./src/**/*.{html,js,svelte,ts}', `${skeletonPath}/**/*.{html,js,svelte,ts}`],
    theme: {
        extend: {},
    },
    plugins: [
        skeleton({
            themes: {
                preset: [
                    {
                        name: 'wintry',
                        enhancements: true,
                    },
                ],
            },
        }),
    ],
};