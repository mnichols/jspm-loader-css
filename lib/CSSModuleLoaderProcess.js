import CssModulesLoaderCore from 'css-modules-loader-core';
import path from 'path';

export default class CSSModuleLoaderProcess {
  constructor(plugins) {
    this._cssModulesLoader = new CssModulesLoaderCore(plugins);

    // enforce this on exported functions
    this.fetch = this.fetch.bind(this);
  }

  fetch(load, systemFetch) {
    const sourcePath = load.address.replace(System.baseURL, '');

    return systemFetch(load)
      .then((source) =>
        this._cssModulesLoader.load(source, sourcePath, '', this._fetchDependencies.bind(this))
      )
      .then(({ injectableSource, exportTokens }) => {
        return {
          name: sourcePath,
          exportedTokens: `module.exports = ${JSON.stringify(exportTokens)}`,
          injectableSource
        };
      });
  }

  // Figure out the path that System will need to find the right file,
  // and trigger the import (which will instantiate this loader once more)
  _fetchDependencies(rawDependencyPath, relativeToPath) {
    const formattedDependencyPath = this._removeWrappingQuotes(rawDependencyPath);
    const canonicalParent = relativeToPath.replace(/^\//, '');

    return System.normalize(formattedDependencyPath, path.join(System.baseURL, canonicalParent))
      .then(System.import.bind(System))
      .then((exportedTokens) => exportedTokens.default || exportedTokens);
  }

  _removeWrappingQuotes(string) {
    return string.replace(/^["']|["']$/g, '');
  }
}
