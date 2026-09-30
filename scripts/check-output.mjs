import { readFile, readdir, lstat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, sep } from 'node:path';
import assert from 'node:assert/strict';

const candidateRoot = process.argv[2] ?? '.';
const publicRoot = join(candidateRoot, 'public');
const siteRoot = join(publicRoot, 'jose-luis-illana-portfolio');
const manifest = JSON.parse(await readFile(join(candidateRoot, 'provenance.json'), 'utf8'));

assert.equal(manifest.sourceRepository, 'joseluisillana/jose-luis-illana-portfolio');
assert.match(manifest.sourceSha, /^[0-9a-f]{40}$/);
if (manifest.sourceVersion !== undefined) assert.match(manifest.sourceVersion, /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/);
if (manifest.publishingVersion !== undefined) assert.match(manifest.publishingVersion, /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/);
assert.match(manifest.sourceManifestSha256, /^[0-9a-f]{64}$/);
assert.equal(manifest.base, '/jose-luis-illana-portfolio');
assert(Array.isArray(manifest.files) && manifest.files.length > 0, 'Public manifest must list files');

const requiredPaths = new Set([
  'index.html',
  'es/index.html',
  'en/index.html',
  'es/cv/index.html',
  'en/cv/index.html',
  'assets/jose-luis-illana-cv-es.pdf',
  'assets/jose-luis-illana-cv-en.pdf',
]);

async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const info = await lstat(path);
    assert(!info.isSymbolicLink(), `Symlink in public output: ${path}`);
    if (info.isDirectory()) files.push(...await filesUnder(path));
    else {
      assert(info.isFile(), `Non-file in public output: ${path}`);
      files.push(relative(publicRoot, path).split(sep).join('/'));
    }
  }
  return files;
}

const expected = new Set(['index.html']);
for (const file of manifest.files) {
  assert.match(file.path, /^[a-zA-Z0-9_./-]+$/);
  assert(!file.path.startsWith('/') && !file.path.split('/').includes('..'));
  assert(!expected.has(`jose-luis-illana-portfolio/${file.path}`), `Duplicate: ${file.path}`);
  assert(Number.isSafeInteger(file.bytes) && file.bytes > 0);
  assert.match(file.sha256, /^[0-9a-f]{64}$/);
  const target = `jose-luis-illana-portfolio/${file.path}`;
  expected.add(target);
  requiredPaths.delete(file.path);
  const data = await readFile(join(siteRoot, file.path));
  assert.equal(data.length, file.bytes, `Byte count: ${target}`);
  assert.equal(createHash('sha256').update(data).digest('hex'), file.sha256, `SHA-256: ${target}`);
}
assert.equal(requiredPaths.size, 0, `Missing required public paths: ${[...requiredPaths].join(', ')}`);

const actual = (await filesUnder(publicRoot)).sort();
assert.deepEqual(actual, [...expected].sort(), 'Public inventory differs from provenance');
assert.deepEqual(await readFile(join(publicRoot, 'index.html')), await readFile(join(siteRoot, 'index.html')), 'Root redirect differs from approved export');
assert((await readFile(join(publicRoot, 'index.html'), 'utf8')).includes('/jose-luis-illana-portfolio/'), 'Root entry does not target the portal');
console.log(`Validated ${actual.length} public files from source ${manifest.sourceSha}.`);
