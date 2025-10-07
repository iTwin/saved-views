/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/
import fs from "fs";
import path from "path";

const relativeDir = process.argv[2];
if (!relativeDir) {
  console.error("Usage: node postBuild.mjs <relative directory>");
  process.exit(1);
}

// This creates a dummy package.json file.
// Without this, all cjs files would need the .cjs extension
// because .js files are treated as ESM according to the main package.json's "type".
try {
  const filePath = path.join(process.cwd(), relativeDir, "package.json");
  fs.writeFileSync(filePath, '{ "type": "commonjs" }', {});
} catch (e) {
  console.error("Cannot create package.json", e);
  process.exit(1);
}
