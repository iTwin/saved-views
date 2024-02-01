/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import fs from "fs/promises";
import postcssModules from "postcss-modules";
import recursiveReaddir from "recursive-readdir";
import packageJson from "./package.json";

const replacements = new Map<string, string>();
const majorVersion = packageJson.version.substring(0, packageJson.version.indexOf("."));

module.exports = {
  plugins: [
    postcssModules({
      scopeBehaviour: "local",
      getJSON(_, json) {
        for (const [key, value] of Object.entries(json)) {
          if (key !== value) {
            replacements.set(key, value);
          }
        }
      },
      generateScopedName(name) {
        return name.replace(/^svr-/, `itwin-svr${majorVersion}__`);
      },
    }),
  ],
};

// postcss-cli doesn't tell us when its procesing is done so we wait until Node.js is about to exit
process.once("beforeExit", async (code: number) => {
  if (code !== 0) {
    return;
  }

  const dirIndex = process.argv.indexOf("--dir");
  if (dirIndex === -1 || dirIndex === process.argv.length - 1) {
    throw new Error("--dir option is not set");
  }

  const dir = process.argv[dirIndex + 1];
  const files = await recursiveReaddir(dir);

  for (const filename of files) {
    if (!filename.endsWith(".js")) {
      continue;
    }

    const file = await fs.readFile(filename, { encoding: "utf-8" });
    let updatedFile = file;
    for (const [key, value] of replacements) {
      // Add negative lookahead and lookbehind to account for class names that are substrings of other class names
      const pattern = `(?<![_a-zA-Z0-9-])${key}(?![_a-zA-Z0-9-])`;
      updatedFile = updatedFile.replace(new RegExp(pattern, "g"), value);
    }

    if (updatedFile !== file) {
      // eslint-disable-next-line no-console
      console.log(`Rewriting CSS class names - ${filename}`);
      await fs.writeFile(filename, updatedFile);
    }
  }
});
