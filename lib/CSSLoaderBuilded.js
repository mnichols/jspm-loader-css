import { CSSModuleLoaderProcess } from './CSSModuleLoaderProcess';

const CSS_INJECT_FUNCTION = "(function(c){if (typeof document == 'undefined') return; var d=document,a='appendChild',i='styleSheet',s=d.createElement('style');s.type='text/css';d.getElementsByTagName('head')[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})";
const EMPTY_SYSTEM_REGISTER = (system, name) => `${system}.register('${name}', [], function() { return { setters: [], execute: function() {}}});`;

var that;

function escape(source) {
  return source
    .replace(/(["\\])/g, '\\$1')
    .replace(/[\f]/g, "\\f")
    .replace(/[\b]/g, "\\b")
    .replace(/[\n]/g, "\\n")
    .replace(/[\t]/g, "\\t")
    .replace(/[\r]/g, "\\r")
    .replace(/[\']/g, "\\'")
    .replace(/[\u2028]/g, "\\u2028")
    .replace(/[\u2029]/g, "\\u2029");
}

export class CSSLoaderBuilded extends CSSModuleLoaderProcess {
  constructor (plugins) {
    super(plugins);

    // keep a reference to the class instance
    that = this;
  }

  fetch (load, systemFetch) {
    return super.fetch(load, systemFetch)
      // Return the export tokens to the js files
      .then((styleSheet) => styleSheet.exportedTokens);
  }

  bundle (loads, compileOpts, outputOpts) {
    var loader = this;
    if (loader.buildCSS === false)
      return '';

    return loader['import']('cssnano').then(function(cssnano) {
      var rootURL = loader.rootURL;
      var outFile = loader.separateCSS ? outputOpts.outFile.replace(/\.js$/, '.css') : rootURL;

      return cssnano.process(that._getAllSources(), {safe: true}).then(function (result) {
        var cssOutput = result.css;

        const fileDefinitions = loads
          .map((load) => EMPTY_SYSTEM_REGISTER(compileOpts.systemGlobal || 'System', load.name))
          .join('\n');

        // write a separate CSS file if necessary
        if (loader.separateCSS) {
          // it's bad to do this in general, as code is now heavily environment specific
          var fs = System._nodeRequire('fs');
          if (outputOpts.sourceMaps) {
            fs.writeFileSync(outFile + '.map', result.map);
            cssOutput += '/*# sourceMappingURL=' + outFile.split(/[\\/]/).pop() + '.map*/'
          }

          fs.writeFileSync(outFile, cssOutput);

          return fileDefinitions;
        }

        // Fake file definitions and inject all the css
        return `
        // Fake file definitions
        ${fileDefinitions}
        // Inject all the css
        ${CSS_INJECT_FUNCTION}
        ('${escape(cssOutput)}');`
      });
    }, function(err) {
      if (err.toString().indexOf('ENOENT') != -1)
        throw new Error('Install cssnano via `jspm install npm:cssnano --dev` for CSS build support. Set System.buildCSS = false to skip CSS builds.');
      throw err
    });
  }

  _getAllSources () {
    const sortedDependencies = this._getSortedStylesDependencies();

    return sortedDependencies
      .map((depName) => this._styleMeta.get(depName).injectableSource)
      .join('\n');
  }
};
