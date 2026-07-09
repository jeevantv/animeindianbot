import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { devvit } from "@devvit/start/vite";

export default defineConfig({
    plugins: [
        react(),
        tailwind(),
        devvit({
            server: {
                build: {
                    sourcemap: false,
                }
            }
        }),
    ],
    build: {
        chunkSizeWarningLimit: 1000,
        rolldownOptions: {
            output: {
                codeSplitting: true,
            }
        }
    }
}); ``