/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import path from "path";
import { defineConfig } from "vitest/config";

import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@itwin/saved-views-client": path.resolve(
        __dirname,
        "../saved-views-client/src/index.ts",
      ),
    },
  },
  test: {
    environment: "happy-dom",
  },
});
