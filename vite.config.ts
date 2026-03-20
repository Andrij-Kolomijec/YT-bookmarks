import { resolve } from "node:path";
import react from "@vitejs/plugin-react-swc";
import { build, defineConfig } from "vite";

const root = import.meta.dirname;

function buildScript(name: string, entry: string) {
	return build({
		configFile: false,
		build: {
			outDir: "dist",
			emptyOutDir: false,
			lib: {
				entry,
				name,
				formats: ["iife"],
				fileName: () => `${name}.js`,
			},
			rollupOptions: {
				output: {
					extend: true,
				},
			},
		},
	});
}

export default defineConfig({
	plugins: [
		react(),
		{
			name: "build-extension-scripts",
			async writeBundle() {
				await Promise.all([
					buildScript("background", resolve(root, "src/background/index.ts")),
					buildScript("content", resolve(root, "src/content/index.ts")),
				]);
			},
		},
	],
	build: {
		outDir: "dist",
		emptyOutDir: true,
		rollupOptions: {
			input: {
				popup: resolve(root, "popup.html"),
			},
			output: {
				entryFileNames: "[name].js",
				chunkFileNames: "assets/[name]-[hash].js",
				assetFileNames: "assets/[name].[ext]",
			},
		},
	},
});
