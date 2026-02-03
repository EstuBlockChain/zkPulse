import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Esta línea es la MAGIA que hace funcionar Tailwind
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter()
	}
};

export default config;