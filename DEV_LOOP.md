# Development Loop

The task is given in the prompt. You complete it autonomously : loop until every item in "Done when" is true. Do not stop to ask for style or implementation preferences : the principles below are the answer. Work in small verified increments until done.

## Context

- Work within the existing repo : its architecture, conventions and stack are the spec. Read `CLAUDE.md` first, then the docs it points to (specs, plans, `MEMORY.md` if present), then the relevant code, before writing anything. When in doubt, do what the codebase already does.
- If this file and the repo's `CLAUDE.md` disagree, the prompt wins, then this file, then `CLAUDE.md`. Fix the outdated rule in `CLAUDE.md` in the same branch so the next run does not hit the conflict.
- If the task references an external source of truth (design export, feedback doc, issue, reference repo), study it fully before coding. Do not assume the scope : inventory what it asks, and turn that inventory into your checklist.
- Use the `superpowers` and `ponytail` plugins. Invoke their relevant skills (brainstorming, writing plans, TDD, debugging, verification) instead of improvising your own process. Check at the very start that both plugins are loaded in this session : if one is missing, stop and say so.

## Setup (first slice)

- If the task has more than 3 sub-items, produce `TASK_INVENTORY.md` : one line per item with its source, scope and acceptance check. This becomes the checklist for the loop : every item must end up done and checked off, or flagged.
- Store specs and plans where the repo already stores them (for example `docs/superpowers/specs` and `docs/superpowers/plans`).
- Create a branch named after the task (`feat/...`, `fix/...`) unless instructed to work on `main`. Never push to `main` directly unless the prompt says so : open a pull request.
- Reproduce first : for a bug, write the failing test that proves it BEFORE fixing. For a behavior change, capture the current behavior (annotated screenshot or test) before changing it.

## Principles

- Red/green TDD : write a failing test first, make it pass, refactor. No production code without a test that demanded it.
- Small vertical slices : one item, one screen or one fix at a time, fully working, committed, then next.
- Commit after every green state with a conventional commit message. Never batch a day of work into one commit. Push regularly : every push must produce a green deploy (Netlify or equivalent CI).
- No over-engineering : no abstractions for hypothetical future needs, no new libraries unless strictly necessary (justify in the commit message if so).
- Do not refactor, reformat or "improve" code unrelated to the task. Keep the diff minimal and reviewable.
- Keep the repo shippable at all times : the working branch must always build and pass every check the repo defines.
- Checks are the scripts in `package.json`. If the repo has no `typecheck` script, add `tsc --noEmit` as one. If it has no linter, do not add one : say so in the summary.
- Never report something as working on reasoning alone : run it, through the real handler, and show the output.
- Update `CLAUDE.md` when you discover a convention, gotcha or decision worth remembering. Improve the environment for the next run.
- If you repeat a fix twice, turn it into a test or a check so it cannot regress.

## Allowed work

- Read anything in this repo and in the inputs referenced by the prompt.
- Create, edit, refactor application code, tests and config within the task's scope.
- Run the dev server, tests, typecheck, builds and browser e2e locally. Follow the repo's own rules on when the e2e may run.
- Install dependencies consistent with the existing stack.
- Use sandbox/test modes only for external services (Plaid, Stripe...). For a service with no sandbox (HubSpot, Google Sheets, QuickBooks), read-only access to production is allowed only if the prompt says so. Secrets live in `.env.local` (gitignored) and in the host's env vars : never commit, log or hardcode one.

## Stop for human

- Any product decision not answerable from the prompt, its inputs, the codebase or this file (copy, business rule, edge-case behavior, ambiguous item).
- Any inventory item that seems out of scope, contradictory or already solved : flag it with a recommendation (do / adapt / drop) instead of silently deciding.
- Any required env var or credential with no known value, and any new env var to create on the host.
- Switching any external service from sandbox/test to production.
- Any write to a production system (HubSpot, QuickBooks, Google Sheets, n8n production workflows), direct or through a webhook, unless the prompt explicitly authorizes that exact write. An authorization covers only what it names.
- Any destructive or irreversible operation (data migration, deleting deployed resources, force push, dropping data).
- Structural architecture changes.
- When you stop, keep working on every item that does not depend on the answer, then list what is parked.

## Done when

- [ ] The goal stated in the prompt is met, verifiably.
- [ ] Every item in `TASK_INVENTORY.md` (if created) is done and checked off, or explicitly flagged with a recommendation.
- [ ] All unit and integration tests pass, including new tests covering every change made.
- [ ] `typecheck` and `build` pass with zero errors, plus `lint` if the repo has one.
- [ ] The e2e happy path still passes in the browser (Playwright), plus any path touched by the task.
- [ ] Annotated screenshots of the relevant e2e flow are saved to `evidence/[task]/` (see "Evidence").
- [ ] The branch is pushed with a green deploy (or deploy preview) reachable for testing, and a pull request is open.
- [ ] `CLAUDE.md` is updated if any convention or decision worth remembering emerged.
- [ ] A final `SUMMARY.md` (or PR description) lists : what was done, decisions taken, known limitations, and anything parked in "Stop for human".

## Evidence

- No video. The e2e takes a screenshot at every step that proves an inventory item.
- Annotated means : numbered markers on the elements that matter, drawn on the page by the test just before the capture and removed after, plus a one-line caption per marker. No new dependency for this.
- Files : `evidence/[task]/NN-step-name.png`, numbered in flow order, and `evidence/[task]/INDEX.md` with one line per screenshot : what it shows, which inventory item it proves, and the caption of each marker.
- For a behavior change : a before and an after screenshot of the same screen.
- Screenshots must not show secrets or full account numbers.

## Verification (evidence to return)

- The commit log, the pull request and the deploy/preview URL.
- `TASK_INVENTORY.md` checked off (if applicable).
- Test run output (final green run).
- `evidence/[task]/INDEX.md` and its screenshots.
- Typecheck/build output (and lint if present).
