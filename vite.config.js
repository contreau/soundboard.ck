import { defineConfig } from "vite";
import path from "node:path";

function watchJsonPlugin() {
  const jsonPath = path.resolve(__dirname, "sound-config.json");
  return {
    name: "watch-json-hmr",
    configureServer(server) {
      server.watcher.add(jsonPath);
      server.watcher.on("change", (file) => {
        if (file === jsonPath) {
          server.ws.send({ type: "full-reload" });
        }
      });
    },
  };
}

export default defineConfig({
  base: "/soundboard.ck/",
  plugins: [watchJsonPlugin()],
});
