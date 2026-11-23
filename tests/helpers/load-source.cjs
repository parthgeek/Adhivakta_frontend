const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

// Use the project's existing compiler to load source ESM/TS in Node's test runner.
// This keeps the application bundle and module configuration unchanged.
module.exports = function loadSource(relativePath) {
  const filename = path.resolve(__dirname, '../..', relativePath);
  const source = fs.readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    fileName: filename,
  }).outputText;
  const loaded = new Module(filename, module);
  loaded.filename = filename;
  loaded.paths = Module._nodeModulePaths(path.dirname(filename));
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = (id) => {
    if (id.startsWith('.') && !path.extname(id)) {
      const target = path.resolve(path.dirname(filename), `${id}.ts`);
      if (fs.existsSync(target)) return module.exports(path.relative(path.resolve(__dirname, '../..'), target));
    }
    return originalRequire(id);
  };
  loaded._compile(compiled, filename);
  return loaded.exports;
};
