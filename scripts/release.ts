/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

// This script's purpose is to automate the process of publishing a branch containing new version of a package to the
// remote repository. It was written with the goal to maintain a good balance of code brevity, features, and resilience
// to errors.
//
// If you had to perform the release manually, you would have to successfully execute the following steps.
//   * Create a release branch or merge code into an already existing one
//   * Edit `CHANGELOG.md` to update the release title
//   * Bump `version` field in `package.json`
//   * Commit the changes
//   * Push release branch to remote repository
//
// The steps above, except for editing the changelog, could be performed with following commands.
//   ```console
//   $ git switch -c release/1.2.x
//   <edit CHANGELOG.md>
//   $ npm version minor
//   $ git commit -m "Release my-package@1.2.0" package.json CHANGELOG.md
//   $ git push origin HEAD
//   ```
//
// That's not a lot. But to account for various (valid and invalid) local repository states, we need to perform
// additional checks and actions so that the desirable result is achieved more consistently and problems are detected
// and reported preemptively.
//
// When extending this script, please maintain a couple of core design guidelines.
//   * Seek confirmation from the user before making changes to existing repository state. Changes in branches that this
//     script has just created are exempt because there's no chance of messing up user's repository.
//   * Report all observable repository state changes (file writes, commits, branch operations, etc.)
//   * Use `throw new RuntimeError(message)` to report error and terminate script with non-zero status code

import { confirm, input, select } from "@inquirer/prompts";
import chalk from "chalk";
import child_process, { ExecOptions } from "child_process";
import fs from "fs/promises";
import { globIterate } from "glob";
import path from "path";
import semver from "semver";
import { promisify } from "util";
import { Command } from "@commander-js/extra-typings";

const program = new Command()
  .command("release")
  .version("1.0.0")
  .option("-v, --verbose", "enable verbose output")
  .action(release);

program.addCommand(
  new Command()
    .command("post-release [release-branch]")
    .description("Perform post-release step on branch <release-branch>")
    .action(postRelease),
);

class RuntimeError extends Error {
  soft: boolean;

  constructor(message: string, { soft = false } = {}) {
    super(message);
    this.soft = soft;
  }
}

try {
  await program.parseAsync();
  process.exit(0);
} catch (error) {
  if (error instanceof RuntimeError) {
    if (error.soft) {
      console.log(error.message);
    } else {
      console.error(`${chalk.red("Error")}: ${error.message}`);
    }

    process.exit(1);
  }

  console.error(error);
  process.exit(2);
}

async function release(): Promise<void> {
  // Manual steps:
  // ```console
  // $ git switch -c release/1.2.x
  // <edit CHANGELOG.md>
  // $ npm version minor
  // $ git commit -m "Release my-package@1.2.0" package.json CHANGELOG.md
  // $ git push origin HEAD
  // ```

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

  await confirmToProceed(`Push branch ${highlight(releaseBranchName)} to remote ${packageToPublish.repositoryUrl}?`);
  await pushBranch(releaseBranchName);
  console.log(`Release tag: ${highlight(releaseInfo.releaseTag)}`);
}

async function postRelease(releaseBranchOpt: string | undefined): Promise<void> {
  // Manual steps:
  // ```console
  // $ git branch -c master post-release
  // $ git merge release/1.2.x
  // <Ensure "## Unreleased" header from master branch is still present in CHANGELOG.md, automatic merge tends to do the
  // wrong thing and duplicate the first release header>
  // $ git commit --amend --no-edit
  // $ git push origin HEAD
  // ```

  const originalBranchName = await getCurrentBranchName();
  const { releaseBranchName, postReleaseBranchName } = await selectReleaseBranch(releaseBranchOpt);

  const postReleaseBranchExists = await checkBranchExists(postReleaseBranchName);
  if (postReleaseBranchExists) {
    throw new RuntimeError(`Branch ${highlight(postReleaseBranchName)} already exists.`);
  }

  const releasedPackage = await findReleasedPackage(releaseBranchName);
  await confirmToProceed(`Run post-release step for ${highlight(releasedPackage.name)} package?`);

  // We are going to be switching branches. Local changes may interfere with this process.
  await stashLocalChanges(
    `Working directory before executing post-release step for ${highlight(releasedPackage.name)} package`,
  );

  await exec(`git fetch origin ${releaseBranchName}`);
  await switchAndPullBranch(releaseBranchName);
  await validateChangelog(releasedPackage, { expectAbsentUnreleasedHeader: true });

  await switchAndPullBranch("master");
  await exec(`git switch -c ${postReleaseBranchName}`);
  await mergeBranch(releaseBranchName);
  await fixChangelog(releasedPackage);
  const changelog = await validateChangelog(releasedPackage, { expectEmptyReleaseNotes: true });
  await exec(`git commit --amend --no-edit ${changelog.filepath}`);
  await confirmToProceed(`Push branch ${highlight(postReleaseBranchName)} to remote ${releasedPackage.repositoryUrl}?`);
  await pushBranch(postReleaseBranchName);
  await switchBranch(originalBranchName);
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
  const selectedPackage = await selectEligiblePackage();
  const validPrefixes = await tagPrefixesPromise;
  const eligiblePrefixes = validPrefixes.filter((prefix) => selectedPackage.name.endsWith(`-${prefix}`));
  if (eligiblePrefixes.length === 0) {
    if (validPrefixes.length > 0) {
      console.log(
        `Could not match package name ${highlight(selectedPackage.name)} with a valid prefix. None of the following matched:`
        + highlight(validPrefixes.map((prefix) => `\n\t${prefix}-v*.*.*`).join("")),
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
      },
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

async function selectEligiblePackage(): Promise<PackageInfo> {
  const packages = await findEligiblePackages();
  if (packages.length === 0) {
    throw new RuntimeError(
      `Could not find any eligible packages for publishing within ${highlight(process.cwd())} directory.`,
    );
  }

  if (packages.length === 1) {
    return packages[0];
  }

  return select({
    message: "Package to publish:",
    choices: packages.map((value) => ({
      value,
      name: value.name,
      description: chalk.dim(`\n${value.directory}/package.json`),
    })),
    default: packages.find(({ mostRecent }) => mostRecent),
  });
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
  return `\n${chalk.gray(`${version.toString()} -> ${highlightVersionDifference(version, bumpKind)}`)}`;
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
  await stashLocalChanges(
    `Working directory before running release script for ${highlight(`${packageToPublish.name}@${newVersion}`)}`,
  );

  const currentBranchName = await getCurrentBranchName();
  const releaseBranchName = getReleaseBranchName(packageToPublish, newVersion);
  const localReleaseBranchExists = await checkBranchExists(releaseBranchName);

  // Update our information about remote release branch state. It may or may not exists, or we may not be aware of the
  // latest commits.
  const remoteBranchHash = await exec(`git fetch --porcelain origin ${releaseBranchName}`)
    .then((output) => output.split(" ")[2])
    .catch(() => "");
  if (remoteBranchHash) {
    if (localReleaseBranchExists) {
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

  if (localReleaseBranchExists) {
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

async function stashLocalChanges(stashMessage: string): Promise<void> {
  const workingDirectoryStatus = await exec("git status --porcelain");
  if (workingDirectoryStatus) {
    await confirmToProceed("Your git working directory is not clean. Stash changes and proceed?");
    await exec(`git stash push --include-untracked --message "${stashMessage}"`);
  }
}

async function checkBranchExists(branchName: string): Promise<boolean> {
  const branchHash = await exec(`git show-ref --hash --verify refs/heads/${branchName}`).catch(() => "");
  return !!branchHash;
}

/** Merges current branch into release branch. Switches to the release branch. */
async function mergeToReleaseBranch(releaseBranchName: string): Promise<void> {
  const originalBranchName = await getCurrentBranchName();
  if (releaseBranchName === originalBranchName) {
    return;
  }

  await confirmToProceed(
    `Will switch to branch ${highlight(releaseBranchName)} and merge ${highlight(originalBranchName)}. Proceed?`,
  );
  await exec(`git switch ${releaseBranchName}`);
  console.log(`Switched to branch ${highlight(releaseBranchName)}`);
  await mergeBranch(originalBranchName);
}

/** Merges source branch into current one. Inform the user about this action beforehand. */
async function mergeBranch(otherBranchName: string): Promise<void> {
  const currentBranchName = await getCurrentBranchName();

  try {
    await exec(`git merge ${otherBranchName}`);
    console.log(`Merged branch ${highlight(otherBranchName)} into ${highlight(currentBranchName)}`);
  } catch (error) {
    console.error(error);
    await exec("git merge --abort");
    const { behind, ahead } = await getBranchDivergence(
      `refs/heads/${otherBranchName}`,
      `refs/heads/${currentBranchName}`,
    );
    throw new RuntimeError(
      `Merge failed. ${highlight(currentBranchName)} is ${behind} commit(s) behind and ${ahead} commit(s) ahead of ${highlight(otherBranchName)}`,
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

interface ValidateChangelogConfig {
  expectAbsentUnreleasedHeader?: boolean;
  expectEmptyReleaseNotes?: boolean;
}

/** Parses CHANEGLOG.md file and looks for obvious errors, e.g. duplicate release titles. */
async function validateChangelog(
  packageToPublish: PackageInfo,
  config?: ValidateChangelogConfig,
): Promise<ChangelogInfo> {
  const changelog = await parseChangelog(packageToPublish);
  const changelogFilepath = changelog.filepath;
  const firstHeadingTitle = changelog.headings[0].title;

  const seenTitles = new Set<string>();
  for (const { title } of changelog.headings) {
    if (seenTitles.has(title)) {
      throw new RuntimeError(
        `${highlightPath(changelogFilepath)} contains duplicate release title: ${highlight(title)}.`,
      );
    }

    seenTitles.add(title);
  }

  if (config?.expectAbsentUnreleasedHeader) {
    if (seenTitles.has("Unreleased")) {
      throw new RuntimeError(
        `${highlightPath(changelogFilepath)} should not contain ${highlight("## Unreleased")} section.`,
      );
    }
  } else if (firstHeadingTitle !== "Unreleased") {
    throw new RuntimeError(
      `${highlightPath(changelogFilepath)} does not start with ${highlight("## Unreleased")} section.`,
    );
  }

  if (!seenTitles.has(packageToPublish.version.toString())) {
    throw new RuntimeError(
      `${highlightPath(changelogFilepath)} does not contain entry for current package version (${highlight(packageToPublish.version.toString())})`,
    );
  }

  const changesInThisVersion = changelog.content
    .substring(changelog.headings[0].offset + changelog.headings[0].value.length, changelog.headings[1]?.offset)
    .trim();
  if (config?.expectEmptyReleaseNotes) {
    if (changesInThisVersion.length > 0) {
      throw new RuntimeError(
        `${highlightPath(changelogFilepath)} ${`## ${firstHeadingTitle}`} section should have no release notes.`,
      );
    }
  } else if (changesInThisVersion.length === 0) {
    throw new RuntimeError(
      `${highlightPath(changelogFilepath)} does not explain what has changed since the last version.`,
    );
  }

  return changelog;
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
    `Bumped ${highlightPath(path.join(packageToPublish.directory, "package.json"))} to version ${highlight(newVersion)} (up from ${packageToPublish.version.toString()})`,
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

/**
 * After merging release branch into post-release, the first changelog header usually gets duplicated. This function
 * will attempt to detect such bad merges and automatically fix the changelog.
 */
async function fixChangelog(publishedPackage: PackageInfo): Promise<void> {
  const changelog = await parseChangelog(publishedPackage);
  if (changelog.headings[0].title === "Unreleased") {
    return;
  }

  const unreleasedUrl = `${publishedPackage.repositoryUrl.replace(".git", "")}/tree/HEAD/${publishedPackage.directory}`;

  // We have observed the following types of merge failures where ## Unreleased header is missing:
  //   * The latest release header is duplicated and takes place of ## Unreleased header
  //   * The ## Unreleased header is just missing, no other anomalies
  const isDuplicated = changelog.headings[0].value === changelog.headings[1].value;
  const replacement = `## [Unreleased](${unreleasedUrl})\n${isDuplicated ? "" : `\n${changelog.headings[0].value}`}`;
  const fixedChangelog = changelog.content.replace(changelog.headings[0].value, replacement);
  await fs.writeFile(changelog.filepath, fixedChangelog);
  console.log(`Fixed ${highlightPath(changelog.filepath)} after a bad merge`);
}

/** Executes `git push` on the given branch. */
async function pushBranch(branchName: string): Promise<void> {
  await exec(`git push origin ${branchName}`);
  console.log(`Branch ${highlight(branchName)} has been pushed to remote`);
}

/** Determines the branch of a past release, prompting the user if required. */
async function selectReleaseBranch(
  releaseBranchOpt: string | undefined,
): Promise<{ releaseBranchName: string; postReleaseBranchName: string; }> {
  if (releaseBranchOpt) {
    const identifier = matchRegex("release\\/(?<identifier>.+)?\\/", releaseBranchOpt)?.groups.identifier;
    return {
      releaseBranchName: releaseBranchOpt,
      postReleaseBranchName: identifier ? `post-release-${identifier}` : "post-release",
    };
  }

  // Release branch looks like either "release/<version>" or "release/<identifier>/<version>"
  const branches = await exec("git ls-remote --heads origin release/*");
  const parsedBranches = branches
    .split("\n")
    .map((branch) => {
      const match = matchRegex(
        "refs\\/heads\\/release\\/((?<identifier>.+)\\/)?(?<version>\\d+\\.\\d+\\.x(?:-\\.+)?$)",
        branch,
      );
      return match ? { identifier: match.groups.identifier, version: match.groups.version } : undefined;
    });

  // Group branches by package identifier.
  const branchMap = new Map<string | undefined, string[]>();
  for (const branch of parsedBranches) {
    if (!branch) {
      continue;
    }

    const versions = branchMap.get(branch.identifier) ?? [];
    versions.push(branch.version ?? "");
    branchMap.set(branch.identifier, versions);
  }

  if (branchMap.size === 1 && branchMap.has(undefined)) {
    const packageVersions = branchMap.get(undefined);
    if (packageVersions?.length === 1) {
      return { releaseBranchName: `release/${packageVersions[0]}`, postReleaseBranchName: "post-release" };
    }

    const releaseBranchName = await select({
      message: "Select release branch:",
      choices: (packageVersions ?? []).map((version) => ({ value: `release/${version}` })),
    });
    return { releaseBranchName, postReleaseBranchName: "post-release" };
  }

  const packageIdentifier = await select({
    message: "Select release branch:",
    choices: Array.from(branchMap.keys()).filter((value) => value).map((identifier) => ({
      value: identifier,
      name: (branchMap.get(identifier) ?? []).length > 1
        ? `release/${identifier}/* ${chalk.magenta("->")}`
        : `release/${identifier}/${branchMap.get(identifier)?.[0]}`,
    })),
  });
  const packageVersions = branchMap.get(packageIdentifier) ?? [];
  if (packageVersions.length === 1) {
    return {
      releaseBranchName: `release/${packageIdentifier}/${packageVersions[0]}`,
      postReleaseBranchName: `post-release-${packageIdentifier}`,
    };
  }

  const releaseBranchName = await select({
    message: "Select release branch:",
    choices: packageVersions.reverse().map((version) => ({ value: `release/${packageIdentifier}/${version}` })),
  });
  return { releaseBranchName, postReleaseBranchName: `post-release-${packageIdentifier}` };
}

async function findReleasedPackage(releaseBranchName: string): Promise<PackageInfo> {
  const eligiblePackages = await findEligiblePackages();
  if (eligiblePackages.length === 0) {
    throw new RuntimeError(
      `Could not find any eligible packages for publishing within ${highlight(process.cwd())} directory.`,
    );
  }

  const releaseBranchRegex = "release(\\/(?<identifier>.+))?\\/\\d+\\.\\d+\\.x";
  const releaseIdentifier = matchRegex(releaseBranchRegex, releaseBranchName)?.groups.identifier ?? "";
  if (eligiblePackages.length === 1) {
    if (!releaseIdentifier) {
      return eligiblePackages[0];
    }

    throw new RuntimeError(
      `Unexpected release branch name ${highlight(releaseBranchName)}. There is only one package eligible for release.`,
    );
  }

  const releasedPackage = eligiblePackages.find((entry) => entry.name.endsWith(releaseIdentifier));
  if (!releasedPackage) {
    throw new RuntimeError(
      `None of the packages eligible for release match release identifier ${highlight(releaseIdentifier)}.`,
    );
  }

  return releasedPackage;
}

/** Switches to git branch `branchName` and performs git pull. */
async function switchAndPullBranch(branchName: string): Promise<void> {
  await confirmToProceed(`Will switch to branch ${highlight(branchName)} and do pull. Proceed?`);
  await switchBranch(branchName);
  await exec(`git pull --ff-only origin ${branchName}`);
  console.log("Successfully pulled latest changes");
}

/** Switches to git branch `branchName`. */
async function switchBranch(branchName: string): Promise<void> {
  await exec(`git switch ${branchName}`);
  console.log(`Switched to branch ${highlight(branchName)}`);
}

/** Executes a CLI command. */
async function exec(command: string, options: ExecOptions = {}): Promise<string> {
  logVerbose("exec", command);
  const output = await promisify(child_process.exec)(command, options);
  const result = output.stdout.trim();
  logVerbose("", result);
  return output.stdout.trim();
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type NamedCapturingGroups<T extends string> = T extends `${infer _A}(?<${infer B}>${infer _B})${infer C}`
  ? { [P in B]: string; } & NamedCapturingGroups<C>
  : unknown;

/** Returns first regex match, if any. */
function matchRegex<T extends string>(pattern: T, input: string): MatchedOccurence<T> | undefined {
  const match = new RegExp(pattern).exec(input);
  return match ? { match: match[0], groups: match.groups as NamedCapturingGroups<T>, offset: match.index } : undefined;
}

/** Finds all occurences of regex `pattern` in `input`. */
function findAllOccurences<T extends string>(pattern: T, input: string): MatchedOccurence<T>[] {
  const result: MatchedOccurence<T>[] = [];
  const regex = new RegExp(pattern, "gm");
  // eslint-disable-next-line no-constant-condition
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

/** Prints out given message when --verbose option is used. */
function logVerbose(scope: string, message: string): void {
  if (program.opts().verbose) {
    if (scope) {
      console.log(`${chalk.yellow(scope)}: ${message}`);
    } else {
      console.log(message);
    }
  }
}
