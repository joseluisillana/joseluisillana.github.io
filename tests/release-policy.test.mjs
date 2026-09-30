import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { parseTag, validateCandidate } from '../scripts/release-policy.mjs';

const version = 'v1.0.0';
const publishingSha = 'a'.repeat(40);
const sourceSha = 'b'.repeat(40);
const provenanceBytes = Buffer.from(JSON.stringify({
  sourceRepository: 'joseluisillana/jose-luis-illana-portfolio',
  sourceSha,
}));
const provenanceHash = createHash('sha256').update(provenanceBytes).digest('hex');
const rawTag = `object ${publishingSha}\ntype commit\ntag ${version}\ntagger Owner <owner@example.invalid> 0 +0000\n\nPortal publishing release ${version}\nSource-Version: v1.0.0\nSource-SHA: ${sourceSha}\nProvenance-SHA256: ${provenanceHash}\n`;
const release = { tag_name: version, draft: false, prerelease: false, immutable: true, published_at: '2026-09-29T00:00:00Z' };

test('accepts an immutable published release bound to an annotated tag and exact candidate', () => {
  const tag = parseTag(rawTag, version);
  assert.deepEqual(validateCandidate({ version, expectedSha: publishingSha, tag, release, provenanceBytes }), {
    version, publishingSha, sourceVersion: 'v1.0.0', sourceSha, provenanceSha256: provenanceHash,
  });
});

test('rejects a moved tag, ineligible release, or changed provenance', () => {
  const tag = parseTag(rawTag, version);
  assert.throws(() => validateCandidate({ version, expectedSha: 'c'.repeat(40), tag, release, provenanceBytes }), /different commit/);
  assert.throws(() => validateCandidate({ version, expectedSha: publishingSha, tag, release: { ...release, prerelease: true }, provenanceBytes }), /Prerelease/);
  assert.throws(() => validateCandidate({ version, expectedSha: publishingSha, tag, release: { ...release, immutable: false }, provenanceBytes }), /immutable/);
  const changedProvenance = Buffer.from(JSON.stringify({ sourceRepository: 'joseluisillana/jose-luis-illana-portfolio', sourceSha: 'c'.repeat(40) }));
  assert.throws(() => validateCandidate({ version, expectedSha: publishingSha, tag, release, provenanceBytes: changedProvenance }), /Source commit/);
});

test('rejects a lightweight or ambiguously annotated version', () => {
  assert.throws(() => parseTag(`object ${publishingSha}\ntype tree\ntag ${version}\n\n`, version), /directly to a commit/);
  assert.throws(() => parseTag(rawTag.replace('Source-SHA:', 'Source-SHA: invalid\nSource-SHA:'), version), /Duplicate tag metadata/);
});
