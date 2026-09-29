# Agent Instructions

This repository contains reviewed public output for the professional portal. Read [PUBLISHING.md](PUBLISHING.md) before changing its workflow, provenance, release metadata or public files. The private source repository's `docs/operations.md` remains the single procedure for building, exporting and verifying the source site.

- Use English in repository files, release notes, issues and pull requests.
- Stage only reviewed public output under `public/`; never copy private source, credentials, dependencies or test evidence here.
- Use a review branch and pull request. Do not merge or publish a version without owner review.
- Publishing a tag/Release and every Pages deployment, including rollback, require a fresh owner decision naming the exact version and commit. Plan approval does not authorize either action.
- Keep `main` as the reviewed workflow control ref. The selected protected tag identifies the artifact commit; follow the checks and failure procedure in [PUBLISHING.md](PUBLISHING.md).
