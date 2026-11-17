# closing-form

## Agent workflow

- **Follow `DEV_LOOP.md`** for every task. The org source of truth is `soundcheck-capital/.github/DEV_LOOP.md`; this repo keeps a copy (see "DEV_LOOP.md is a copy" below).
- **CI is the gate.** `.github/workflows/ci.yml` runs on every pull request and push to `main`: `npm ci`, then `lint`, `typecheck`, `test`, `build` (each only if the script exists in `package.json`). Nothing is done until CI is green.
- **`npm ci` needs the lockfile in sync.** After any dependency change run `npm install` and commit `package-lock.json`, or CI fails at install.
- **Evidence is annotated screenshots**: `evidence/[task]/NN-step.png` + `INDEX.md`, numbered markers drawn by the test (see `DEV_LOOP.md` "Evidence").
- **Plugins**: superpowers and ponytail are enabled at project scope in `.claude/settings.json`, so local and cloud sessions load the same tools.
- **Merge rule**: the org is on GitHub Free, so private repos have no branch protection and nothing technically blocks a merge. Agents never merge application changes: a human (Sami) merges after CI and the deploy preview are green.
- **DEV_LOOP.md is a copy**: a pointer to the org repo is not enough, because a cloud session only has this repo checked out and cannot read the private `.github` repo. When `DEV_LOOP.md` changes, update it in `soundcheck-capital/.github` first, then copy it here.
