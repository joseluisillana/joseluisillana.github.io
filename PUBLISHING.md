# Versioned Pages publication

This repository is the public output of the private `joseluisillana/jose-luis-illana-portfolio` source repository. The public site remains at `https://joseluisillana.github.io/jose-luis-illana-portfolio/`. Only `public/` is uploaded to GitHub Pages. The private repository's `docs/operations.md` is the authoritative procedure for source build, export and live verification; this document governs the publishing repository's version and deployment steps.

## Version and provenance contract

- Publishing versions use an independent `vMAJOR.MINOR.PATCH` sequence. A matching number in the private source repository is coincidence, not an automatic mapping. The owner assigns each publishing version after reviewing the candidate.
- A deployable version has an annotated Git tag pointing directly to the exact publishing commit and a published, non-prerelease, immutable GitHub Release for that same tag. A tag alone, draft, prerelease or mutable Release is ineligible.
- The annotated tag message binds the public artifact to `Source-Version`, the private source `Source-SHA`, and the SHA-256 of the exact publishing `provenance.json` bytes. `provenance.json` binds the source SHA to every public file's byte count and SHA-256. Future manifests may also include `sourceVersion` and `publishingVersion`; the historical first candidate does not, so the protected tag carries its version mapping without rewriting the already deployed commit.
- The public repository never reads the private repository or receives cross-repository credentials. Before tagging, a human checks that the stated source version resolves to the stated private source commit and that the staged files match its reviewed export.
- The owner reviews and publishes release notes on the GitHub Release. Corrections use a new version; do not move or delete a published tag or modify its release assets.

## Repository controls

Before the first version is published, the owner must approve the concrete configuration and enable **release immutability** in Settings → General → Releases. Configure an active tag ruleset for the chosen publishing version pattern that prevents tag updates and deletion, with no broad bypass. Confirm the actual ruleset and the `github-pages` environment still allows only workflow runs from `main`. If the required controls cannot be established, stop and revise the plan before publication. The deployment workflow also rejects an API Release whose `immutable` property is not `true`.

## Prepare and publish a version

1. In the private source checkout at the exact proposed source revision, follow its `docs/operations.md`: run the shared `doctor`, `deps` and `ci` tasks, review the resulting manifest and every public file, and confirm the corresponding source tag/release. Do not invent a source version from a SHA.
2. Stage the reviewed export in this repository under `public/jose-luis-illana-portfolio/` and the root redirect at `public/index.html`. Record `sourceRepository`, `sourceSha`, `sourceManifestSha256`, base path and complete public inventory in `provenance.json`. For a new export, also record `sourceVersion` and the proposed independent `publishingVersion`. Review the full diff in a PR, run `node scripts/check-output.mjs` and the validation workflow, and merge only after owner review.
3. For the first version only, review the commit already deployed under spec 005. Verify its public bytes, source mapping and complete provenance; tag that exact historical commit rather than changing its tree. The earlier Pages run remains an exact-commit deployment, not a release-based run.
4. Present the concrete publishing version and full commit SHA, source version and full SHA, provenance hash, complete public inventory and hashes, release notes, ruleset/immutability state and any limits. Obtain an explicit owner decision for the exact tag and Release. Prepare an annotated tag whose message contains exactly one line of each form below (the heading is free text):

   ```text
   Portal publishing release vX.Y.Z
   Source-Version: vA.B.C
   Source-SHA: <40 lowercase hex characters>
   Provenance-SHA256: <64 lowercase hex characters>
   ```

5. Create the approved annotated tag on the exact publishing commit and push that tag. Create the GitHub Release from it with the approved public notes, publish it, and confirm the Release API reports it immutable. Do not use GitHub's automatic tag creation from a branch.

## Deploy, redeploy or roll back

1. Present the exact published publishing version and full commit SHA, mapped source version and SHA, current live version, intended action and verification plan. Obtain fresh explicit owner approval for **this deployment**, even if the version was approved or deployed before. Record the decision with the version and commit.
2. In Actions → **Publish approved portal to Pages**, select `main`, supply `publishing_version` and the approved full `expected_sha`, and dispatch as the repository owner. The workflow code runs from `main`; it fetches the selected annotated tag, checks the exact SHA, requires the published immutable Release, validates the tag's source/provenance mapping, checks the selected commit's complete `public/` inventory and hashes, then uploads only that commit's `public/`. It does not substitute the current `main` files for an older selected version.
3. Record the workflow control SHA, publishing version and artifact SHA, source version and SHA, provenance hash, Pages run and reported URL. From a matching private source checkout, use its documented `doctor`, `deps`, `build`, `artifact` and `verify-pages` tasks to compare live public files. Also inspect the root redirect, Spanish and English Profile/CV routes, direct reload and both PDF downloads in a real browser. Record the observed result and limits; a passing workflow alone is not owner acceptance.

If a tag, Release, SHA, source mapping, provenance hash or inventory check fails, do not weaken an input or bypass a control. Review a new candidate or restore the required repository setting. A rollback selects a previously published immutable Release with a fresh deployment decision; it does not require the selected commit to be `main`. Public caches may retain previously served bytes. If live verification fails, compare the selected tag and commit, manifest, Pages run and live file hashes before another owner-approved deployment.
