import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

const versionPattern = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
const shaPattern = /^[0-9a-f]{40}$/;
const hashPattern = /^[0-9a-f]{64}$/;

export function parseTag(raw, version) {
  assert.match(version, versionPattern, 'Invalid publishing version');
  const [header, ...messageLines] = raw.split(/\r?\n\r?\n/);
  const headerLines = header.split(/\r?\n/);
  const object = headerLines.find((line) => line.startsWith('object '))?.slice(7);
  const type = headerLines.find((line) => line.startsWith('type '))?.slice(5);
  const name = headerLines.find((line) => line.startsWith('tag '))?.slice(4);
  assert.match(object ?? '', shaPattern, 'Tag object must name a full commit SHA');
  assert.equal(type, 'commit', 'Publishing tag must point directly to a commit');
  assert.equal(name, version, 'Tag object name differs from selected version');

  const fields = new Map();
  for (const line of messageLines.join('\n\n').split(/\r?\n/)) {
    const match = /^(Source-Version|Source-SHA|Provenance-SHA256): (\S+)$/.exec(line);
    if (!match) continue;
    assert(!fields.has(match[1]), `Duplicate tag metadata: ${match[1]}`);
    fields.set(match[1], match[2]);
  }
  const sourceVersion = fields.get('Source-Version') ?? '';
  const sourceSha = fields.get('Source-SHA') ?? '';
  const provenanceSha256 = fields.get('Provenance-SHA256') ?? '';
  assert.match(sourceVersion, versionPattern, 'Annotated tag lacks a source version');
  assert.match(sourceSha, shaPattern, 'Annotated tag lacks a source commit');
  assert.match(provenanceSha256, hashPattern, 'Annotated tag lacks the provenance hash');
  return { publishingSha: object, sourceVersion, sourceSha, provenanceSha256 };
}

export function validateCandidate({ version, expectedSha, tag, release, provenanceBytes }) {
  assert.match(version, versionPattern, 'Invalid publishing version');
  assert.match(expectedSha, shaPattern, 'Expected SHA must be a full lowercase commit SHA');
  assert.equal(tag.publishingSha, expectedSha, 'Selected tag moved or names a different commit');
  assert.equal(release.tag_name, version, 'Release tag differs from selected version');
  assert.equal(release.draft, false, 'Draft release is not deployable');
  assert.equal(release.prerelease, false, 'Prerelease is not deployable');
  assert.equal(release.immutable, true, 'Release must be immutable');
  assert(release.published_at, 'Release must be published');
  const manifest = JSON.parse(provenanceBytes.toString('utf8'));
  assert.equal(manifest.sourceRepository, 'joseluisillana/jose-luis-illana-portfolio');
  assert.equal(manifest.sourceSha, tag.sourceSha, 'Source commit differs from the protected tag');
  if (manifest.sourceVersion !== undefined) assert.equal(manifest.sourceVersion, tag.sourceVersion, 'Source version differs from the protected tag');
  if (manifest.publishingVersion !== undefined) assert.equal(manifest.publishingVersion, version, 'Publishing version differs from the protected tag');
  const provenanceSha256 = createHash('sha256').update(provenanceBytes).digest('hex');
  assert.equal(provenanceSha256, tag.provenanceSha256, 'Provenance bytes differ from the protected tag');
  return { version, publishingSha: expectedSha, sourceVersion: tag.sourceVersion, sourceSha: tag.sourceSha, provenanceSha256 };
}
