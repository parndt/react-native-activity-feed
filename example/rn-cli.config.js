/* eslint-env node */

const fs = require('fs');
const path = require('path');
const blacklist = require('metro/src/blacklist');
const repoDir = path.dirname(__dirname);

module.exports = {
  getBlacklistRE() {
    return blacklist([
      new RegExp(repoDir + '/example/'),
      new RegExp(repoDir + '/native-example/(.*)'),
      new RegExp(repoDir + '/native-package/(.*)'),
      new RegExp(repoDir + '/expo-package/node_modules/(.*)'),
      new RegExp(repoDir + '/node_modules/(.*)'),
    ]);
  },
  extraNodeModules: getNodeModulesForDirectory(path.resolve('.')),
};

function getNodeModulesForDirectory(rootPath) {
  const nodeModulePath = path.join(rootPath, 'node_modules');
  const folders = fs.readdirSync(nodeModulePath);
  return folders.reduce((modules, folderName) => {
    const folderPath = path.join(nodeModulePath, folderName);
    if (folderName.startsWith('@')) {
      const scopedModuleFolders = fs.readdirSync(folderPath);
      const scopedModules = scopedModuleFolders.reduce(
        (scopedModules, scopedFolderName) => {
          scopedModules[
            `${folderName}/${scopedFolderName}`
          ] = maybeResolveSymlink(path.join(folderPath, scopedFolderName));
          return scopedModules;
        },
        {},
      );
      return Object.assign({}, modules, scopedModules);
    }
    modules[folderName] = maybeResolveSymlink(folderPath);
    return modules;
  }, {});
}

function maybeResolveSymlink(maybeSymlinkPath) {
  if (fs.lstatSync(maybeSymlinkPath).isSymbolicLink()) {
    const resolved = path.resolve(
      path.dirname(maybeSymlinkPath),
      fs.readlinkSync(maybeSymlinkPath),
    );
    return resolved;
  }
  return maybeSymlinkPath;
}
