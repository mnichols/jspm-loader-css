import { Plugins } from './lib/plugins';
import { CSSLoader } from './lib/CSSLoader';

const { fetch, bundle } = new CSSLoader([
  Plugins.values,
  Plugins.localByDefault,
  Plugins.extractImports,
  Plugins.scope
]);

export { CSSLoader, Plugins, fetch, bundle };