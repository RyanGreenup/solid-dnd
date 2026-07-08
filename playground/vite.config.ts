import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

// The playground imports the library directly from ../src (see ../src/index.tsx)
// so edits to the library hot-reload here. The "development"/"browser" resolve
// conditions match vitest.config.ts and select Solid's dev build.
export default defineConfig({
  root: __dirname,
  plugins: [solid()],
  resolve: {
    conditions: ["development", "browser"],
  },
  server: {
    host: true, // listen on the LAN too, so a real phone/iPad can connect
  },
});
