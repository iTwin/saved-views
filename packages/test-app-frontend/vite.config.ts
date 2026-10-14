/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { cpSync, existsSync, mkdirSync, rmSync } from "fs";
import react from "@vitejs/plugin-react-swc";
import * as path from "path";
import { defineConfig, Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const generatedPublicDir = preparePublicDir();

// https://vitejs.dev/config/
export default defineConfig(() => ({
  publicDir: generatedPublicDir,
  plugins: [tsconfigPaths(), stringReplacePlugin(), react()],
  resolve: {
    alias: [
      {
        find: /^~(.*)(?!\.scss)$/,
        replacement: path.resolve(__dirname, "./node_modules/$1.scss"),
      },
    ],
  },
  server: {
    port: 7948,
  },
}));

function stringReplacePlugin(): Plugin {
  return {
    name: stringReplacePlugin.name,
    enforce: "pre",
    transform: (code: string) => {
      // iTwin.js by default injects a font that is incorrect and lacks some required font weights
      return code.replace("document.head.prepend(openSans);", "// document.head.prepend(openSans);");
    },
  };
}

function preparePublicDir(): string {
  const target = path.resolve(__dirname, ".vite-public");
  rmSync(target, { recursive: true, force: true });
  mkdirSync(target, { recursive: true });

  const copy = (from: string, to: string) => {
    if (existsSync(from))
      cpSync(from, to, { recursive: true });
  };

  copy(path.resolve(__dirname, "public"), target);
  copy(path.resolve(__dirname, "node_modules/@itwin/core-frontend/lib/public"), target);
  copy(path.resolve(__dirname, "node_modules/@itwin/core-react/lib/public/locales"), path.join(target, "locales"));
  copy(path.resolve(__dirname, "node_modules/@itwin/imodel-components-react/lib/public/locales"), path.join(target, "locales"));

  return target;
}
