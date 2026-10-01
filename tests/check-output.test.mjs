import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('accepts a complete larger inventory and rejects a missing required route', async () => {
  const candidate = await mkdtemp(join(tmpdir(), 'publishing-output-'));
  try {
    await cp('public', join(candidate, 'public'), { recursive: true });
    const manifest = JSON.parse(await readFile('provenance.json', 'utf8'));
    const extra = Buffer.from('additional reviewed public file\n');
    await writeFile(join(candidate, 'public', 'jose-luis-illana-portfolio', 'extra.txt'), extra);
    manifest.files.push({
      path: 'extra.txt',
      bytes: extra.length,
      sha256: createHash('sha256').update(extra).digest('hex'),
    });
    const check = () => spawnSync(process.execPath, ['scripts/check-output.mjs', candidate], { encoding: 'utf8' });
    await writeFile(join(candidate, 'provenance.json'), JSON.stringify(manifest));
    const valid = check();
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /Validated 12 public files/);

    manifest.files = manifest.files.filter((file) => file.path !== 'en/index.html');
    await writeFile(join(candidate, 'provenance.json'), JSON.stringify(manifest));
    const invalid = check();
    assert.notEqual(invalid.status, 0);
    assert.match(invalid.stderr, /Missing required public paths: en\/index\.html/);
  } finally {
    await rm(candidate, { recursive: true, force: true });
  }
});
