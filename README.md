# Professional portal publication output

This repository stages the reviewed static export from the private source repository. `public/` is the only Pages artifact. The provenance manifest records the exact private source revision and public file hashes. A pull request validates the complete file inventory. The publication procedure and release policy are in [PUBLISHING.md](PUBLISHING.md).

The portal URL is `https://joseluisillana.github.io/jose-luis-illana-portfolio/`. Publishing versions are independent of private source versions and carry an explicit mapping in protected annotated tags. Deployment selects an immutable published Release and its exact commit, including for rollback after `main` advances. Each run requires a fresh owner decision and live verification.
