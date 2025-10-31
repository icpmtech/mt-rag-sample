import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        preserveSymlinks: true
    },
    build: {
        outDir: "../backend/static",
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: id => {
                    if (id.includes("@fluentui/react-icons")) {
                        return "fluentui-icons";
                    } else if (id.includes("@fluentui/react")) {
                        return "fluentui-react";
                    } else if (id.includes("node_modules")) {
                        return "vendor";
                    }
                }
            }
        },
        target: "esnext"
    },
    server: {
        proxy: {
            "/content/": "http://localhost:7000",
            "/auth_setup": "http://localhost:7000",
            "/.auth/me": "http://localhost:7000",
            "/ask": "http://localhost:7000",
            "/chat": "http://localhost:7000",
            "/speech": "http://localhost:7000",
            "/config": "http://localhost:7000",
            "/upload": "http://localhost:7000",
            "/delete_uploaded": "http://localhost:7000",
            "/list_uploaded": "http://localhost:7000",
            "/chat_history": "http://localhost:7000",
            "/sharepoint/": "http://localhost:7000"
        }
    }
});
