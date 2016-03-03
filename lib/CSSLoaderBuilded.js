import CSSModuleLoaderProcess from './CSSModuleLoaderProcess';

const cssInjectFunction = '(function(c){if (typeof document == "undefined") return; var d=document,a="appendChild",i="styleSheet",s=d.createElement("style");s.type="text/css";d.getElementsByTagName("head")[0][a](s);s[i]?s[i].cssText=c:s[a](d.createTextNode(c));})';

let that;

// TODO: What is being sanitized here?
const escape = (source) => {
  return source
    .replace(/(["\\])/g, '\\$1')
    .replace(/[\f]/g, '\\f')
    .replace(/[\b]/g, '\\b')
    .replace(/[\n]/g, '\\n')
    .replace(/[\t]/g, '\\t')
    .replace(/[\r]/g, '\\r')
    .replace(/[\']/g, '\\\'')
    .replace(/[\u2028]/g, '\\u2028')
    .replace(/[\u2029]/g, '\\u2029');
};

const emptySystemRegister = (system, name) => {
  return `${system}.register('${name}', [], function() { return { setters: [], execute: function() {}}});`;
};

export default class CSSLoaderBuilded extends CSSModuleLoaderProcess {
  constructor(plugins) {
    super(plugins);

    this._injectableSources = [];

    // keep a reference to the class instance
    that = this;
  }

  fetch(load, systemFetch) {
    return super.fetch(load, systemFetch)
      .then((styleSheet) => {
        that._injectableSources.add(styleSheet.injectableSource);
        return styleSheet;
      })
      // Return the export tokens to the js files
      .then((styleSheet) => styleSheet.exportedTokens);
  }

  bundle(loads, compileOpts, outputOpts) {
    if (this.buildCSS === false) {
      return '';
    }

    return this.import('cssnano').then((cssnano) => {
      const rootURL = this.rootURL;
      const outFile = this.separateCSS ? outputOpts.outFile.replace(/\.js$/, '.css') : rootURL;

      return cssnano.process(that._injectableSources.join('\n'), {
        safe: true
      }).then((result) => {
        let cssOutput = result.css;

        const fileDefinitions = loads
          .map((load) => emptySystemRegister(compileOpts.systemGlobal || 'System', load.name))
          .join('\n');

        // write a separate CSS file if necessary
        if (this.separateCSS) {
          // it's bad to do this in general, as code is now heavily environment specific
          const fs = System._nodeRequire('fs');

          if (outputOpts.sourceMaps) {
            fs.writeFileSync(`${outFile}.map`, result.map);
            cssOutput += `/*# sourceMappingURL=${outFile.split(/[\\/]/).pop()}.map*/`;
          }

          fs.writeFileSync(outFile, cssOutput);

          return fileDefinitions;
        }

        return `${fileDefinitions}${cssInjectFunction}('${escape(cssOutput)}');`;
      });
    }, (error) => {
      if (error.toString().indexOf('ENOENT') !== -1) {
        throw new Error('Install cssnano via `jspm install npm:cssnano --dev` for CSS build support. Set System.buildCSS = false to skip CSS builds.');
      }

      throw error;
    });
  }
}