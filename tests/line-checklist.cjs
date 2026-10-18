const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const filename = path.resolve(__dirname, '../src/App.tsx');
const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.React },
}).outputText;
const app = new Module(filename, module);
app.filename = filename;
app.paths = Module._nodeModulePaths(path.dirname(filename));
app._compile(compiled, filename);
const { formatLineText } = app.exports;
const ingredients = ['rice', 'oil'].map((id, index) => ({
  id, name: ['蓬萊米', '炒米油'][index], unit: 'g', calculatedGrams: 100,
  displayAmount: '100 g', householdAmount: '1 杯', prepInstruction: '原有工藝',
}));

for (const mode of ['metric', 'household']) {
  test(`${mode}: only prepared ingredients receive (V), using ingredient IDs`, () => {
    const text = formatLineText(10, '3.50', 3500, mode, ingredients, { oil: true });
    assert.match(text, /^1\. 蓬萊米：/m);
    assert.match(text, /^\(V\) 2\. 炒米油：/m);
    assert.match(text, /└ 工藝：原有工藝/);
  });
}

test('unchecking removes the mark and default calls preserve the original list', () => {
  const original = formatLineText(10, '3.50', 3500, 'metric', ingredients);
  assert.equal(formatLineText(10, '3.50', 3500, 'metric', ingredients, { rice: false }), original);
  assert.doesNotMatch(original, /\(V\)/);
});
