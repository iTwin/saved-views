const fs = require('fs');
const path = require('path');

/**
 * Get the current package version
 * @param {"@itwin/saved-views-react" | "@itwin/saved-views-client"} packageName - The package name
 * @returns {Promise<string>} - The current package version
 */
async function getPackageVersion(packageName) {
  const packageJsonPath = path.resolve(__dirname,
      packageName === "@itwin/saved-views-react" ?
      '../packages/saved-views-react/package.json' :
      '../packages/saved-views-client/package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

/**
 * Increment the version based on the version type
 * @param {string} version - The current version
 * @param {import('@changesets/types').VersionType} versionType - The type of version increment (major, minor, patch)
 * @returns {string} - The incremented version
 */
function incrementVersion(version, versionType) {
  const [major, minor, patch] = version.split('.').map(Number);

  switch (versionType) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Unknown version type: ${versionType}`);
  }
}

/**
 * Get the release line for the changelog
 * @param {import('@changesets/types').NewChangesetWithCommit} changeset - The changeset object
 * @param {import('@changesets/types').VersionType} versionType - The type of version increment (major, minor, patch)
 * @param {null | Record<string, any>} changelogOpts - Changelog options
 * @returns {Promise<string>} - The release line for the changelog
 */
async function getReleaseLine(changeset, versionType, changelogOpts) {
  const packageName = changeset.releases[0].name === "@itwin/saved-views-react" ? "@itwin/saved-views-react" : "@itwin/saved-views-client";
  const newVersion = incrementVersion(await getPackageVersion(packageName), versionType);
  // Get the current date in yyyy-mm-dd format
  const date = new Date().toISOString().split('T')[0];
  const releaseDateAndLinkToRelease = packageName === "@itwin/saved-views-react" ?
    `#### [${newVersion}](https://github.com/iTwin/saved-views/tree/v${newVersion}-react/packages/saved-views-react) - ${date}` :
    `#### [${newVersion}](https://github.com/iTwin/saved-views/tree/v${newVersion}-client/packages/saved-views-client) - ${date}`;
  // Customize your release line here
  return `${releaseDateAndLinkToRelease}\n${changeset.summary}${changeset.releases[0].name}`;
}

/**
 * Get the dependency release line for the changelog
 * @param {import('@changesets/types').NewChangesetWithCommit[]} changesets - Array of changesets with commit
 * @param {import('@changesets/types').ModCompWithPackage[]} dependenciesUpdated - Array of updated dependencies
 * @param {any} changelogOpts - Changelog options
 * @returns {Promise<string>} - The dependency release line for the changelog
 */
async function getDependencyReleaseLine(changesets, dependenciesUpdated, changelogOpts) {
  // Implementation for dependency release line
}

/** @type {import('@changesets/types').ChangelogFunctions} */
const defaultChangelogFunctions = {
  getReleaseLine,
  getDependencyReleaseLine,
};

module.exports = defaultChangelogFunctions;
