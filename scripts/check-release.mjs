import assert from 'node:assert/strict';
import { readFile, appendFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { parseTag, validateCandidate } from './release-policy.mjs';

const candidateRoot = process.argv[2];
const version = process.env.PUBLISHING_VERSION;
const expectedSha = process.env.EXPECTED_SHA;
const repository = process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;
assert(candidateRoot && version && expectedSha && token, 'Candidate, version, expected SHA and GitHub token are required');
assert.equal(repository, 'joseluisillana/joseluisillana.github.io', 'Unexpected publishing repository');

const tagType = execFileSync('git', ['cat-file', '-t', `refs/tags/${version}`], { encoding: 'utf8' }).trim();
assert.equal(tagType, 'tag', 'A protected annotated tag is required');
const tag = parseTag(execFileSync('git', ['cat-file', '-p', `refs/tags/${version}`], { encoding: 'utf8' }), version);
const selectedSha = execFileSync('git', ['rev-parse', `refs/tags/${version}^{commit}`], { encoding: 'utf8' }).trim();
assert.equal(selectedSha, expectedSha, 'Selected tag no longer matches the approved SHA');

const response = await fetch(`https://api.github.com/repos/${repository}/releases/tags/${encodeURIComponent(version)}`, {
  headers: {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  },
});
assert(response.ok, `Published Release lookup failed: HTTP ${response.status}`);
const release = await response.json();
assert.equal(release.author?.login, 'joseluisillana', 'Release must be published by the owner');
const provenanceBytes = await readFile(join(candidateRoot, 'provenance.json'));
const result = validateCandidate({ version, expectedSha, tag, release, provenanceBytes });

const controlSha = process.env.GITHUB_SHA;
const summary = `### Approved publishing candidate\n\n` +
  `- Publishing release: ${result.version}\n` +
  `- Publishing commit: ${result.publishingSha}\n` +
  `- Source version: ${result.sourceVersion}\n` +
  `- Source commit: ${result.sourceSha}\n` +
  `- Provenance SHA-256: ${result.provenanceSha256}\n` +
  `- Workflow control commit: ${controlSha}\n`;
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
console.log(summary);
