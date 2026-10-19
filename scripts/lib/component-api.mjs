/**
 * Public API of each `@4sh/ui-kit` entry point, read by the TypeScript compiler
 * rather than from story `argTypes`, which describe Storybook controls (inputs
 * without a control are missing, defaults are hand-written).
 *
 * Only classes exported by `src/public-api.ts` and decorated `@Component` or
 * `@Directive` are listed, with their signal inputs (`input()`, `model()`) and
 * outputs (`output()`), inherited ones included. A member tagged `@ignore` or
 * `@internal`, or not public, is left out.
 */

import { readdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const KIT = join(ROOT, 'projects/ui-kit');

const toPosix = (path) => path.split(sep).join('/');
const oneLine = (text) => text.replace(/\s+/g, ' ').trim();

export function firstParagraph(text) {
  return oneLine((text ?? '').split(/\n\s*\n/)[0]);
}

/** Every folder holding an `ng-package.json` with a `src/public-api.ts`. */
export function collectEntries(dir = KIT, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === 'node_modules') continue;
    const path = join(dir, entry.name);
    const publicApi = join(path, 'src/public-api.ts');
    if (existsSync(join(path, 'ng-package.json')) && existsSync(publicApi)) {
      const rel = toPosix(relative(KIT, path));
      out.push({ dir: toPosix(relative(ROOT, path)), import: `@4sh/ui-kit/${rel}`, publicApi });
    }
    collectEntries(path, out);
  }
  return out;
}

/**
 * The repo's tsconfig maps `@4sh/ui-kit/*` to `dist/` (ng-packagr needs it). Here
 * the sources are read directly, so a cross-entry import (`UiLevel` from
 * `@4sh/ui-kit/types`) resolves without a build.
 */
function createProgram(rootNames) {
  const configPath = join(ROOT, 'tsconfig.json');
  const { config, error } = ts.readConfigFile(configPath, ts.sys.readFile);
  if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
  const { options } = ts.parseJsonConfigFileContent(config, ts.sys, ROOT);
  options.paths = { ...options.paths, '@4sh/ui-kit/*': ['projects/ui-kit/*/src/public-api.ts'] };
  options.baseUrl = ROOT;
  options.noEmit = true;
  return ts.createProgram({ rootNames, options });
}

const isKitFile = (node) => toPosix(node.getSourceFile().fileName).startsWith(toPosix(KIT));

function jsDoc(node) {
  return ts
    .getJSDocCommentsAndTags(node)
    .filter(ts.isJSDoc)
    .map((doc) => ts.getTextOfJSDocComment(doc.comment) ?? '')
    .join('\n')
    .trim();
}

const hasTag = (node, ...names) =>
  ts.getJSDocTags(node).some((tag) => names.includes(tag.tagName.getText()));

/** `@Component({ selector: 'ui-button' })` → `{ kind: 'component', selector: 'ui-button' }`. */
function decoratorInfo(declaration) {
  for (const decorator of ts.getDecorators(declaration) ?? []) {
    const call = decorator.expression;
    if (!ts.isCallExpression(call)) continue;
    const name = call.expression.getText();
    if (name !== 'Component' && name !== 'Directive') continue;
    const options = call.arguments[0];
    let selector = null;
    if (options && ts.isObjectLiteralExpression(options)) {
      const prop = options.properties.find(
        (p) => ts.isPropertyAssignment(p) && p.name.getText() === 'selector',
      );
      if (prop && ts.isStringLiteralLike(prop.initializer)) selector = prop.initializer.text;
    }
    return { kind: name.toLowerCase(), selector };
  }
  return null;
}

/** `input`, `input.required`, `model`, `model.required` or `output`, else null. */
function signalKind(initializer) {
  if (!initializer || !ts.isCallExpression(initializer)) return null;
  const callee = initializer.expression.getText();
  return ['input', 'input.required', 'model', 'model.required', 'output'].includes(callee)
    ? callee
    : null;
}

function literalValues(type, checker) {
  const nonNullable = checker.getNonNullableType(type);
  const members = nonNullable.isUnion() ? nonNullable.types : [nonNullable];
  // `boolean` is the union `true | false`: not worth listing.
  if (members.every((m) => m.flags & ts.TypeFlags.BooleanLiteral)) return null;
  const values = [];
  for (const member of members) {
    if (member.isStringLiteral() || member.isNumberLiteral()) values.push(member.value);
    else return null;
  }
  return values.length ? values : null;
}

/** First type argument of `InputSignal<T>`, `ModelSignal<T>` or `OutputEmitterRef<T>`. */
function signalValueType(member, checker) {
  const type = checker.getTypeAtLocation(member);
  return type.aliasTypeArguments?.[0] ?? checker.getTypeArguments(type)?.[0] ?? null;
}

/** `{ alias: 'x' }` in the options argument, else the property name. */
function publicName(member, call) {
  const options = call.arguments.find(ts.isObjectLiteralExpression);
  const alias = options?.properties.find(
    (p) => ts.isPropertyAssignment(p) && p.name.getText() === 'alias',
  );
  return alias && ts.isStringLiteralLike(alias.initializer)
    ? alias.initializer.text
    : member.name.getText();
}

function isPublic(member) {
  if (ts.isPrivateIdentifier(member.name)) return false;
  const flags = ts.getCombinedModifierFlags(member);
  return !(flags & (ts.ModifierFlags.Private | ts.ModifierFlags.Protected));
}

function readMember(member, checker) {
  const call = member.initializer;
  const kind = signalKind(call);
  const typeArg = call.typeArguments?.[0];
  const valueType = typeArg
    ? checker.getTypeFromTypeNode(typeArg)
    : signalValueType(member, checker);
  const entry = {
    name: publicName(member, call),
    type: oneLine(typeArg?.getText() ?? (valueType ? checker.typeToString(valueType) : 'unknown')),
  };
  if (kind !== 'output') {
    entry.required = kind.endsWith('.required');
    const values = valueType && literalValues(valueType, checker);
    if (values) entry.values = values;
    // `input()` with no argument defaults to `undefined`; the options object of
    // `input.required({ … })` is not a default.
    if (!entry.required && call.arguments[0]) entry.default = oneLine(call.arguments[0].getText());
    if (kind.startsWith('model')) entry.model = true;
  }
  const description = jsDoc(member);
  if (description) entry.description = oneLine(description);
  if (ts.getJSDocDeprecatedTag(member)) entry.deprecated = true;
  return { kind: kind === 'output' ? 'output' : 'input', entry };
}

/** Own members first, then the base classes': a subclass redeclaring a name wins. */
function classMembers(declaration, checker, seen = new Set()) {
  if (seen.has(declaration)) return [];
  seen.add(declaration);
  const members = declaration.members.filter(
    (m) =>
      ts.isPropertyDeclaration(m) &&
      signalKind(m.initializer) &&
      isPublic(m) &&
      !hasTag(m, 'ignore', 'internal'),
  );
  for (const clause of declaration.heritageClauses ?? []) {
    if (clause.token !== ts.SyntaxKind.ExtendsKeyword) continue;
    for (const base of clause.types) {
      let symbol = checker.getSymbolAtLocation(base.expression);
      if (symbol && symbol.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
      const baseDecl = symbol?.declarations?.find(ts.isClassDeclaration);
      if (baseDecl && isKitFile(baseDecl)) members.push(...classMembers(baseDecl, checker, seen));
    }
  }
  return members;
}

function readClass(name, declaration, checker) {
  const info = decoratorInfo(declaration);
  if (!info) return null;
  const inputs = [];
  const outputs = [];
  const names = new Set();
  for (const member of classMembers(declaration, checker)) {
    const { kind, entry } = readMember(member, checker);
    const key = `${kind}:${entry.name}`;
    if (names.has(key)) continue;
    names.add(key);
    (kind === 'output' ? outputs : inputs).push(entry);
  }
  const description = firstParagraph(jsDoc(declaration));
  return {
    name,
    kind: info.kind,
    selector: info.selector,
    ...(description ? { description } : {}),
    inputs,
    outputs,
  };
}

/**
 * @returns {Record<string, { import: string, components: object[] }>} keyed by the
 *   entry point folder (`projects/ui-kit/actions/ui-button`), which is also where
 *   its doc page lives. Entry points exporting no component are left out.
 */
export function extractComponentApi(entries = collectEntries()) {
  const program = createProgram(entries.map((e) => e.publicApi));
  const checker = program.getTypeChecker();
  const api = {};

  for (const entry of entries) {
    const sourceFile = program.getSourceFile(entry.publicApi);
    const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
    if (!moduleSymbol) throw new Error(`Point d'entrée illisible : ${entry.dir}/src/public-api.ts`);

    const components = [];
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const symbol =
        exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      const declaration = symbol.declarations?.find(ts.isClassDeclaration);
      if (!declaration || !isKitFile(declaration)) continue;
      const component = readClass(exported.getName(), declaration, checker);
      if (component) components.push(component);
    }
    if (components.length) api[entry.dir] = { import: entry.import, components };
  }

  return api;
}
