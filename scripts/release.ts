/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/**
 * This script's purpose is to automate the process of publishing a branch containing new version of a package to the
 * remote repository. It was written with the goal to maintain a good balance of code brevity, features, and resilience
 * to errors.
 *
 * If you had to perform the release manually, you would have to successfully execute the following steps.
 *   * Create a release branch or merge code into an already existing one
 *   * Edit CHANGELOG.md to update the release title
 *   * Bump version field in package.json
 *   * Commit the changes
 *   * Push release branch to remote repository
 *
 * The steps above, except for editing the changelog, could be performed with following commands.
 *   ```console
 *   git switch -c release/1.2.x
 *   <edit CHANGELOG.md>
 *   npm version minor
 *   git commit -m "Release my-package@1.2.0" package.json CHANGELOG.md
 *   git push origin HEAD
 *   ```
 *
 * That's not a lot. But to account for various (valid and invalid) local repository states, we need to perform
 * additional checks and actions so that the desirable result is achieved more consistently and problems are detected
 * and reported preemptively.
 *
 * When extending this script, please maintain a couple of core design guidelines.
 *   * Seek confirmation from the user before making changes to existing repository state. Changes in branches that this
 *     script has just created are exempt because there's no chance of messing up user's repository.
 *   * Report all observable repository state changes (file writes, commits, branch operations, etc.)
 *   * Use `throw new RuntimeError(message)` to report error and terminate script with non-zero status code
 */

import { confirm, select, input } from "@inquirer/prompts";
import chalk from "chalk";
import child_process, { ExecOptions } from "child_process";
import fs from "fs/promises";
import { globIterate } from "glob";
import path from "path";
import semver from "semver";
import { promisify } from "util";

class RuntimeError extends Error { }

try {
  await main();
  process.exit(0);
} catch (error) {
  if (error instanceof RuntimeError) {
    console.error(`${chalk.red("Error")}: ${error.message}`);
    process.exit(1);
  }

  console.error(error);
  process.exit(2);
}

async function main(): Promise<void> {
  const packageToPublish = await selectPackageToPublish();
  await validateChangelog(packageToPublish);
  const versionBump = await selectVersionBump(packageToPublish);
  const newVersion = semver.inc(packageToPublish.version, versionBump) ?? "";
  const releaseBranchName = await prepareReleaseBranch(packageToPublish, newVersion);
  await mergeToReleaseBranch(releaseBranchName);

  await confirmToProceed(
    `Will bump ${highlight(packageToPublish.name)} to ${highlight(`v${newVersion}`)}, update ${highlight("CHANGELOG.md")}, and commit changes. Proceed?`,
  );
  const releaseInfo = await bumpPackageVersion(packageToPublish, versionBump);
  await updateChangelog(packageToPublish, releaseInfo);
  await commitChanges(packageToPublish, releaseInfo);

  await confirmToProceed(`Push ${highlight(releaseBranchName)} to remote?`);
  await pushReleaseBranch(releaseBranchName);
  console.log(`Release tag: ${highlight(releaseInfo.releaseTag)}`);
}

interface PackageInfo {
  name: string;
  version: semver.SemVer;
  directory: string;
  repositoryUrl: string;
  mostRecent: boolean;
  prefix: string;
}

/** Prompts to choose a target package to publish. */
async function selectPackageToPublish(): Promise<PackageInfo> {
  const tagPrefixesPromise = queryValidReleaseTagPrefixes();
  const packages = await findEligiblePackages();
  if (packages.length === 0) {
    throw new RuntimeError(
      `Could not find any eligible packages for publishing within ${highlight(process.cwd())} directory.`,
    );
  }

  if (packages.length === 1) {
    return packages[0];
  }

  const selectedPackage = await select({
    message: "Package to publish:",
    choices: packages.map((value) => ({
      value,
      name: value.name,
      description: chalk.dim(`\n${value.directory}/package.json`),
    })),
    default: packages.find(({ mostRecent }) => mostRecent),
  });

  const validPrefixes = await tagPrefixesPromise;
  const eligiblePrefixes = validPrefixes.filter((prefix) => selectedPackage.name.endsWith(`-${prefix}`));
  if (eligiblePrefixes.length === 0) {
    if (validPrefixes.length > 0) {
      console.log(
        `Could not match package name ${highlight(selectedPackage.name)} with a valid prefix. None of the following matched:`
        + highlight(validPrefixes.map((prefix) => `\n\t*-${prefix}`).join("")),
      );
    } else {
      console.log(
        "Could not obtain any valid release tag prefix to differentiate releases of different packages.",
      );
    }

    const selectedPrefix = await input({
      message: "Pick a new release prefix:",
      validate: (value) => {
        if (value.split("-").filter((str) => str).length === 0) {
          return "Prefix must be non-empty";
        }

        if (!/-$/.test(value)) {
          return "Prefix must end with a hyphen (-)";
        }

        if (validPrefixes.indexOf(value) !== -1) {
          return `Prefix ${value} already exists`;
        }

        return true;
      }
    });
    eligiblePrefixes.push(selectedPrefix.slice(0, -1));
  }

  if (eligiblePrefixes.length > 1) {
    throw new RuntimeError("Multiple matching prefixes found. This case is not supported yet.");
  }

  selectedPackage.prefix = eligiblePrefixes[0].length > 0 ? `${eligiblePrefixes[0]}` : "";
  return selectedPackage;
}

/** Queries remote repository to obtain release tag prefixes. */
async function queryValidReleaseTagPrefixes(): Promise<string[]> {
  const tags = await exec("git ls-remote --tags origin *-v*.*.*");
  const matches = findAllOccurences("\trefs\\/tags\\/(?<prefix>.+)-v\\d+\\.\\d+\\.\\d+(-.+)?", tags);
  return Array.from(new Set(matches.map(({ groups }) => groups.prefix)));
}

/**
 * Collects a list of packages that are eligible for publishing. Package selection criteria:
 *   * Root directory contains package.json file
 *   * package.json contains valid name and version fields
 *   * package.json is not marked private
 */
async function findEligiblePackages(): Promise<PackageInfo[]> {
  interface PackageCandidate {
    packageJson: { private?: boolean; name?: string; version?: string; repository?: { url?: string; }; };
    directory: string;
    lastEditTimestamp: number;
  }

  // Search and read files in parallel so that user is not waiting too long for the first prompt to appear
  const filePromises: Array<Promise<PackageCandidate>> = [];
  for await (const filepath of globIterate("**/package.json", { nodir: true, ignore: "**/node_modules/**" })) {
    const directory = path.dirname(filepath);
    filePromises.push(
      Promise.all([fs.readFile(filepath, { encoding: "utf8" }), getMostRecentCommitTimestamp(directory)])
        .then(([file, lastEditTimestamp]) => ({ packageJson: JSON.parse(file), directory, lastEditTimestamp })),
    );
  }

  let mostRecentEditTimestamp = -1;
  let mostRecentEditIndex = -1;
  const packages: PackageInfo[] = [];
  for (const { packageJson, directory, lastEditTimestamp } of await Promise.all(filePromises)) {
    if (packageJson.private || typeof packageJson.name !== "string") {
      continue;
    }

    const version = typeof packageJson.version === "string" ? new semver.SemVer(packageJson.version) : undefined;
    if (!version) {
      continue;
    }

    if (
      mostRecentEditTimestamp < lastEditTimestamp ||
      (
        mostRecentEditTimestamp === lastEditTimestamp &&
        directory.localeCompare(packages[mostRecentEditIndex].directory) < 0
      )
    ) {
      mostRecentEditTimestamp = lastEditTimestamp;
      mostRecentEditIndex = packages.length;
    }

    packages.push({
      name: packageJson.name,
      version,
      directory,
      repositoryUrl: packageJson.repository?.url ?? "",
      prefix: "",
      mostRecent: false,
    });
  }

  if (mostRecentEditIndex !== -1) {
    packages[mostRecentEditIndex].mostRecent = true;
  }

  return packages.sort((a, b) => a.directory.localeCompare(b.directory));
}

/** Obtains UNIX timestamp of the most recent git commit that edited given directory. */
async function getMostRecentCommitTimestamp(directory: string): Promise<number> {
  const result = await exec(`git log --max-count=1 --pretty=format:%ct -- ${directory}`);
  return Number(result || 0);
}

/** Prompts to choose the kind of release to perform (e.g. minor or patch). */
async function selectVersionBump(packageToPublish: PackageInfo): Promise<semver.ReleaseType> {
  return select({
    message: "Version bump kind:",
    choices: (["major", "minor", "patch"] as const).map((kind) => ({
      value: kind,
      description: makeVersionBumpDescription(packageToPublish.version, kind),
    })),
    default: "minor",
    loop: false,
    theme: { helpMode: "never" },
  });
}

function makeVersionBumpDescription(version: semver.SemVer, bumpKind: semver.ReleaseType): string {
  return `\n${chalk.gray(`${version} -> ${highlightVersionDifference(version, bumpKind)}`)}`;
}

function highlightVersionDifference(version: semver.SemVer, bumpKind: semver.ReleaseType): string {
  const digitHighlight = chalk.yellow.underline.yellow;
  const futureVersion = new semver.SemVer(version.toString()).inc(bumpKind);

  if (bumpKind === "major") {
    return digitHighlight(futureVersion.toString());
  }

  if (bumpKind === "minor") {
    return `${futureVersion.major}.${digitHighlight(`${futureVersion.minor}.${futureVersion.patch}`)}`;
  }

  return `${futureVersion.major}.${futureVersion.minor}.${digitHighlight(futureVersion.patch.toString())}`;
}

/** Syncs or creates a release branch for the new package version. */
async function prepareReleaseBranch(packageToPublish: PackageInfo, newVersion: string): Promise<string> {
  // We are going to be switching and merging branches. Local changes may interfere with this process.
  const workingDirectoryStatus = await exec("git status --porcelain");
  if (workingDirectoryStatus) {
    await confirmToProceed("Your git working directory is not clean. Stash changes and proceed?");
    await exec(
      `git stash push --include-untracked --message "Working directory before running release script for ${highlight(`${packageToPublish.name}@${newVersion}`)}"`,
    );
  }

  const currentBranchName = await getCurrentBranchName();
  const releaseBranchName = getReleaseBranchName(packageToPublish, newVersion);
  const localReleaseBranchHash = await exec(`git show-ref --hash --verify refs/heads/${releaseBranchName}`)
    .catch(() => "");

  // Update our information about remote release branch state. It may or may not exists, or we may not be aware of the
  // latest commits.
  const remoteBranchHash = await exec(`git fetch --porcelain origin ${releaseBranchName}`)
    .then((output) => output.split(" ")[2])
    .catch(() => "");
  if (remoteBranchHash) {
    if (localReleaseBranchHash) {
      await confirmToProceed(
        `Local branch ${highlight(releaseBranchName)} may be out of date. Proceed to sync with remote?`,
      );
      const { behind, ahead } = await getBranchDivergence(
        `refs/remotes/origin/${releaseBranchName}`,
        `refs/heads/${currentBranchName}`,
      );
      if (behind) {
        throw new RuntimeError(
          `Current branch ${highlight(currentBranchName)} is out of sync and is ${behind} commit(s) behind and ${ahead} commit(s) ahead of remote ${releaseBranchName}.`,
        );
      }
    }

    try {
      const output = await exec(`git fetch --porcelain origin ${releaseBranchName}:${releaseBranchName}`);
      const updateType = output.split(" ")[0];
      if (updateType === "=") {
        console.log(`Local release branch ${highlight(releaseBranchName)} is up-to-date with remote`);
      } else if (updateType === "*") {
        console.log(`Obtained existing release branch ${highlight(releaseBranchName)} from remote`);
      } else {
        console.log(`Synced local release branch ${highlight(releaseBranchName)} with remote`);
      }
    } catch (error) {
      console.error(error);
      const { behind, ahead } = await getBranchDivergence(
        `refs/remotes/origin/${releaseBranchName}`,
        `refs/heads/${releaseBranchName}`,
      );
      throw new RuntimeError(
        `Failed to fetch and merge release branch ${highlight(releaseBranchName)}. Local branch is ${behind} commit(s) behind and ${ahead} commit(s) ahead of remote.`,
      );
    }

    return releaseBranchName;
  }

  const versionBump = semver.diff(packageToPublish.version, newVersion);
  if (versionBump === "patch" || versionBump === "prepatch") {
    throw new RuntimeError(
      `Remote does not have an existing release branch ${highlight(releaseBranchName)} for patch release ${highlight(newVersion)}`,
    );
  }

  if (currentBranchName === releaseBranchName) {
    // There's nothing left to prepare, user started this script from the release branch
    return releaseBranchName;
  }

  if (localReleaseBranchHash) {
    const { behind } = await getBranchDivergence(releaseBranchName, currentBranchName);
    if (!behind) {
      // Good, merge into release branch will not create a conflict
      return releaseBranchName;
    }

    throw new RuntimeError(
      `Current branch ${highlight(currentBranchName)} is ${behind} commit(s) behind local ${highlight(releaseBranchName)}.`,
    );
  }

  await confirmToProceed(`Create new branch ${highlight(releaseBranchName)}?`);
  await exec(`git branch ${releaseBranchName}`);
  console.log(`Created new release branch ${highlight(releaseBranchName)}`);
  return releaseBranchName;
}

/** Merges current branch into release branch. Switches to the release branch. */
async function mergeToReleaseBranch(releaseBranchName: string): Promise<void> {
  const originalBranchName = await getCurrentBranchName();
  if (releaseBranchName === originalBranchName) {
    return;
  }

  await exec(`git switch ${releaseBranchName}`);
  console.log(`Switched to branch ${highlight(releaseBranchName)}`);
  try {
    await exec(`git merge ${originalBranchName}`);
    console.log(`Merged branch ${highlight(originalBranchName)} into ${highlight(releaseBranchName)}`);
  } catch (error) {
    console.error(error);
    const { behind, ahead } = await getBranchDivergence(
      `refs/heads/${releaseBranchName}`,
      `refs/heads/${originalBranchName}`,
    );
    throw new RuntimeError(
      `Merge failed. ${highlight(originalBranchName)} is ${behind} commit(s) behind and ${ahead} commit(s) ahead of ${highlight(releaseBranchName)}`,
    );
  }
}

async function getCurrentBranchName(): Promise<string> {
  return exec("git rev-parse --abbrev-ref HEAD");
}

function getReleaseBranchName(packageToPublish: PackageInfo, newVersion: string): string {
  const versionString = `${semver.major(newVersion)}.${semver.minor(newVersion)}.x`;
  return packageToPublish.prefix ? `release/${packageToPublish.prefix}/${versionString}` : `release/${versionString}`;
}

/**
 * Obtains the amount of commits that the two branches do not have in common.
 *
 * @example
 * const { behind, ahead } = await getBranchDivergence("main", "side-quest");
 * // This tells us that branch "main" has received 4 new commits since the fork, and "side-quest" got 11
 * console.log({ behind, ahead }); // { 4, 11 }
 */
async function getBranchDivergence(
  leftBranchRef: string,
  rightBranchRef: string,
): Promise<{ behind: number; ahead: number; }> {
  const [behind, ahead] = await exec(`git rev-list --left-right --count ${leftBranchRef}...${rightBranchRef}`)
    .then((output) => output.split("\t"));
  return { behind: Number(behind), ahead: Number(ahead) };
}

/** Parses CHANEGLOG.md file and looks for obvious errors, e.g. duplicate release titles. */
async function validateChangelog(packageToPublish: PackageInfo): Promise<void> {
  const changelog = await parseChangelog(packageToPublish);
  const changelogFilepath = changelog.filepath;

  const seenTitles = new Set<string>();
  for (const { title } of changelog.headings) {
    if (seenTitles.has(title)) {
      throw new RuntimeError(
        `${highlightPath(changelogFilepath)} contains duplicate release title: ${highlight(title)}.`,
      );
    }

    seenTitles.add(title);
  }

  if (!seenTitles.has("Unreleased")) {
    throw new RuntimeError(
      `${highlightPath(changelogFilepath)} does not contain ${highlight("## Unreleased")} section.`,
    );
  }

  if (!seenTitles.has(packageToPublish.version.toString())) {
    throw new RuntimeError(
      `${highlightPath(changelogFilepath)} does not contain entry for current package version (${highlight(packageToPublish.version.toString())})`,
    );
  }

  if (changelog.headings[0].title !== "Unreleased") {
    throw new RuntimeError(
      `${highlightPath(changelogFilepath)} does not start with ${highlight("## Unreleased")} section.`,
    );
  }

  const changesInThisVersion = changelog.content
    .substring(changelog.headings[0].offset + changelog.headings[0].value.length, changelog.headings[1]?.offset)
    .trim();
  if (changesInThisVersion.length === 0) {
    throw new RuntimeError(
      `${highlightPath(changelogFilepath)} does not explain what has changed since the last version.`,
    );
  }
}

interface ReleaseInfo {
  version: string;
  releaseTag: string;
}

/** Modifies version field of package.json file. */
async function bumpPackageVersion(
  packageToPublish: PackageInfo,
  versionBump: semver.ReleaseType,
): Promise<ReleaseInfo> {
  // By default, `npm version` creates a tagged commit, however it only works when package is placed in repository root
  // where .git directory is located. To avoid trouble with supporting various repository layouts, tell npm not to
  // commit and instead do this step manually.
  const output = await exec(`npm version ${versionBump} --no-git-tag-version`, { cwd: packageToPublish.directory });
  const newVersion = semver.clean(output) ?? "";
  console.log(
    `Bumped ${highlightPath(path.join(packageToPublish.directory, "package.json"))} to version ${highlight(newVersion)} (up from ${packageToPublish.version})`,
  );
  return {
    version: newVersion,
    releaseTag: packageToPublish.prefix ? `${packageToPublish.prefix}-v${newVersion}` : `v${newVersion}`,
  };
}

/** Changes the first CHANGELOG.md title from Unreleased to new version number and updates relevant information. */
async function updateChangelog(packageToPublish: PackageInfo, releaseInfo: ReleaseInfo): Promise<void> {
  const changelog = await parseChangelog(packageToPublish);
  if (changelog.headings.some((heading) => heading.value.includes(`[${releaseInfo.version}]`))) {
    throw new RuntimeError(
      `${highlightPath(changelog.filepath)} already contains changelog entry for future version (${releaseInfo.version})`,
    );
  }

  const uniqueHeadings = new Set(changelog.headings.map(({ title }) => title));
  const difference = changelog.headings.length - uniqueHeadings.size;

  // Due to a bad merge, the first two headings may be duplicated
  if (difference === 0 || (difference === 1 && changelog.headings[0].value === changelog.headings[1].value)) {
    const relativePath = await exec("git rev-parse --show-prefix", { cwd: path.dirname(changelog.filepath) });
    const releaseUrl = `${packageToPublish.repositoryUrl.replace(".git", "")}/tree/${releaseInfo.releaseTag}/${relativePath}`;
    const releaseHeading = `## [${releaseInfo.version}](${releaseUrl}) - ${formatDate(new Date())}\n`;
    const updatedChangelogContent = changelog.content.replace(changelog.headings[0].value, releaseHeading);
    await fs.writeFile(changelog.filepath, updatedChangelogContent);
    console.log(`Updated ${highlightPath(changelog.filepath)}`);
    return;
  }

  throw new RuntimeError(`Could not update ${highlightPath(changelog.filepath)}. File contains duplicate titles.`);
}

function formatDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function pad(component: number): string {
  return String(component).padStart(2, "0");
}

/** Commits package.json and CHANGELOG.md changes to the current branch. */
async function commitChanges(packageToPublish: PackageInfo, releaseInfo: ReleaseInfo): Promise<void> {
  const packageJsonFilepath = path.join(packageToPublish.directory, "package.json");
  const changelogFilepath = path.join(packageToPublish.directory, "CHANGELOG.md");

  try {
    const commitMessage = `Release ${packageToPublish.name}@${releaseInfo.version}`;
    await exec(`git commit --message="${commitMessage}" --only ${packageJsonFilepath} ${changelogFilepath}`);
    const commitHash = await exec("git rev-parse HEAD");
    console.log(`Committed changes

${chalk.yellow(`commit ${commitHash}`)}
\t${commitMessage}
Files:
\t${highlightPath(changelogFilepath)}
\t${highlightPath(packageJsonFilepath)}
`);
  } catch (error) {
    console.error(error);
    throw new RuntimeError("Could not commit file changes.");
  }
}

interface ChangelogInfo {
  filepath: string;
  content: string;
  headings: ChangelogHeading[];
}

interface ChangelogHeading {
  value: string;
  title: string;
  offset: number;
}

async function parseChangelog(packageToPublish: PackageInfo): Promise<ChangelogInfo> {
  const filepath = path.join(packageToPublish.directory, "CHANGELOG.md");
  const content = await fs.readFile(filepath, { encoding: "utf8" });
  const headings = findAllOccurences("## \\[(?<title>.+)\\]\\(.+\\).*\\n", content);
  return {
    filepath,
    content,
    headings: headings.map(({ match, groups, offset }) => ({ value: match, title: groups.title, offset })),
  };
}

/** Executes `git push` on the release branch. */
async function pushReleaseBranch(releaseBranchName: string): Promise<void> {
  await exec(`git push origin ${releaseBranchName}`);
  // We have mutated remote repository, it's critical to inform the user
  const originUrl = await exec("git remote get-url origin").catch(() => "the remote repository");
  console.log(`Branch ${highlight(releaseBranchName)} has been pushed to ${highlight(originUrl)}`);
}

/** Executes a CLI command. */
async function exec(command: string, options: ExecOptions = {}): Promise<string> {
  const result = await promisify(child_process.exec)(command, options);
  return result.stdout.trim();
}

/** Prints a message and waits for user to press Enter. Throws if user refuses. */
async function confirmToProceed(message: string): Promise<void> {
  const yes = await confirm({ message });
  if (!yes) {
    throw new RuntimeError("Operation cancelled by user.");
  }
}

interface MatchedOccurence<T extends string> {
  match: string;
  groups: NamedCapturingGroups<T>;
  offset: number;
}

/** Converts regex capturing group names into object properties. Does not support nested capturing groups. */
type NamedCapturingGroups<T extends string> = T extends `${infer _A}(?<${infer B}>${infer _B})${infer C}`
  ? { [P in B]: string; } & NamedCapturingGroups<C>
  : unknown;

/** Finds all occurences of regex `pattern` in `input`. */
function findAllOccurences<T extends string>(pattern: T, input: string): MatchedOccurence<T>[] {
  const result: MatchedOccurence<T>[] = [];
  const regex = new RegExp(pattern, "gm");
  while (true) {
    const match = regex.exec(input);
    if (!match) {
      return result;
    }

    // This is necessary to avoid infinite loops with zero-width matches
    if (match.index === regex.lastIndex) {
      ++regex.lastIndex;
    }

    result.push({ match: match[0], groups: match.groups as NamedCapturingGroups<T>, offset: match.index });
  }
}

/** Converts to relative path from CWD and highlights the file name. */
function highlightPath(filepath: string): string {
  const relativePath = path.relative(".", filepath);
  return `${chalk.gray(`${path.dirname(relativePath)}/`)}${highlight(path.basename(filepath))}`;
}

/** General-purpose text highlight. */
function highlight(string: string): string {
  return chalk.cyan(string);
}
