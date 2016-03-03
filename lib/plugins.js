import Core from 'css-modules-loader-core';
import cssnano from 'cssnano';

export const Plugins = {
  values: Core.values,
  localByDefault: Core.localByDefault,
  extractImports: Core.extractImports,
  scope: Core.scope,
  cssnano
};