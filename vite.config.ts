import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [
    react()
  ].filter(Boolean);

  // Check if mkcert certificates exist
  const certPath = path.resolve(__dirname, '.certificates/localhost.pem');
  const keyPath = path.resolve(__dirname, '.certificates/localhost-key.pem');
  const hasCertificates = fs.existsSync(certPath) && fs.existsSync(keyPath);

  return {
    server: {
      port: 8080,
      https: hasCertificates ? {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      } : true, // Use Vite's built-in HTTPS
      host: '0.0.0.0', // Allow external connections
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
