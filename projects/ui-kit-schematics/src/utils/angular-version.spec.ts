import { HostTree, SchematicsException } from '@angular-devkit/schematics';
import type { SchematicContext } from '@angular-devkit/schematics';
import { describe, expect, it, vi } from 'vitest';
import { angularMismatch, checkAngularCompatibility, majorOf } from './angular-version';
import { readKitManifestInfo } from './kit-manifest';
import { ensureDependency, readPackageJson } from './package-json';

function projectTree(dependencies: Record<string, string>): HostTree {
  const tree = new HostTree();
  tree.create('/package.json', JSON.stringify({ name: 'test', dependencies }));
  return tree;
}

function fakeContext() {
  const warn = vi.fn();
  return { context: { logger: { warn } } as unknown as SchematicContext, warn };
}

describe('majorOf', () => {
  it.each([
    ['^20.3.0', 20],
    ['~20.3.0', 20],
    ['20.3.0', 20],
    ['>=20.0.0 <23', 20],
    ['20.x', 20],
    ['v22', 22],
    ['22.0.0-next.1', 22],
    ['^22.0.0 || ^23.0.0', 22],
  ])('%s → %i', (range, major) => {
    expect(majorOf(range)).toBe(major);
  });

  it.each(['latest', '*', 'workspace:*', 'file:../core', 'npm:@angular/core@22', undefined])(
    '%s → illisible',
    (range) => {
      expect(majorOf(range)).toBeUndefined();
    },
  );
});

describe('angularMismatch', () => {
  it("laisse passer le majeur du kit, quelle qu'en soit la mineure", () => {
    expect(angularMismatch('^22.2.0', '^22.0.0', '0.12.1')).toBeUndefined();
  });

  it('donne les montées de majeur une à une pour un projet en retard', () => {
    const message = angularMismatch('^20.3.0', '^22.0.0', '0.12.1');
    expect(message).toContain('Angular 22');
    expect(message).toContain('Angular 20');
    expect(message).toContain('ng update @angular/core@21 @angular/cli@21');
    expect(message).toContain('ng update @angular/core@22 @angular/cli@22');
    expect(message).toContain("n'a rien modifié");
  });

  it('refuse un majeur que le kit ne connaît pas encore, sans proposer de descendre', () => {
    const message = angularMismatch('^23.0.0', '^22.0.0', '0.12.1');
    expect(message).toContain('ne connaît pas encore Angular 23');
    expect(message).not.toContain('ng update');
  });
});

describe('checkAngularCompatibility', () => {
  const kitRange = readKitManifestInfo().peerDependencies['@angular/core'];
  const kitMajor = majorOf(kitRange)!;

  it('refuse un projet Angular 20 (ERESOLVE du ng add de la 0.12.0)', () => {
    const { context } = fakeContext();
    expect(() =>
      checkAngularCompatibility(projectTree({ '@angular/core': '^20.3.0' }), context),
    ).toThrow(SchematicsException);
  });

  it('accepte un projet du majeur du kit', () => {
    const { context, warn } = fakeContext();
    checkAngularCompatibility(projectTree({ '@angular/core': `^${kitMajor}.1.0` }), context);
    expect(warn).not.toHaveBeenCalled();
  });

  it('avertit sans refuser quand la plage ne se lit pas', () => {
    const { context, warn } = fakeContext();
    checkAngularCompatibility(projectTree({ '@angular/core': 'latest' }), context);
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('ensureDependency', () => {
  it("ne remplace jamais la plage d'un paquet déjà déclaré", () => {
    const tree = projectTree({ '@angular/core': '^20.3.0' });
    expect(ensureDependency(tree, '@angular/core', '^22.0.0')).toBe(false);
    expect(readPackageJson(tree).dependencies?.['@angular/core']).toBe('^20.3.0');
  });

  it('ne le recopie pas en dependencies quand il est en devDependencies', () => {
    const tree = new HostTree();
    tree.create('/package.json', JSON.stringify({ devDependencies: { rxjs: '~7.8.0' } }));
    expect(ensureDependency(tree, 'rxjs', '^7.8.0')).toBe(false);
    expect(readPackageJson(tree).dependencies).toBeUndefined();
  });

  it('ajoute un paquet absent', () => {
    const tree = projectTree({});
    expect(ensureDependency(tree, '@angular/cdk', '^22.1.0')).toBe(true);
    expect(readPackageJson(tree).dependencies?.['@angular/cdk']).toBe('^22.1.0');
  });
});
