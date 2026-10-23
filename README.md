# F.I.R.E. countdown

Retirement countdown to **May 18, 2033, at midnight in Toronto**. The ten-year
journey begins May 18, 2023. This is a static website: no package installation,
framework build, database, API key, or server-side service is required.

- Repository: https://github.com/gjanos85/fire-date-countdown
- Live website: https://gjanos85.github.io/fire-date-countdown/
- Published entry point: `index.html` (inline styles and countdown code).
- Aircraft: `aircraft-3d.js` (WebGL), `aircraft-fallback-3d.js` (software 3D).
- Scene: `hungary-sun.js`; the Hungarian flag's snowcap is inline SVG/CSS.
- `fire-countdown.html` is an older, retained standalone file, not the Pages entry point.

Read [AGENTS.md](AGENTS.md) before making changes. The full source, generated
aircraft geometry, vector sun, and flag snow are in Git; there are no required files
outside this repository. Google Fonts is the only external visual resource
(`fonts.googleapis.com` and `fonts.gstatic.com`); fallback fonts remain available.

## Preview and checks

Use Python 3 for the preview and Node.js 18+ for the dependency-free checks:

```sh
node scripts/check.cjs
python3 -m http.server 8766 --bind 0.0.0.0
```

Open the environment's port-8766 browser preview. Locally, use
http://127.0.0.1:8766/. Serve only this project directory, not a home directory.
There is no install or build step. Stop the server when finished.

The automated checks cover JavaScript syntax, referenced local scripts, and the
sun's timeline/pause/reduced-motion states. They do **not** replace visual checks:
review both flight directions and airport turns, absence of ground crew, flag snow, the
faceless pre-arrival sun and post-touchdown smile, pause/resume, reduced motion,
and desktop plus narrow (for example 390px) layouts. Check browser errors. Test
both aircraft renderers when possible; disclose if only one was exercised.

## Git history, baseline, and deployment

`main` is the source for GitHub Pages at repository root `/`. An authorized push
to `main` triggers the existing Pages deployment; do not introduce a new hosting
service or build system as part of cloud-development setup. Verify the Pages
build's commit/status and the actual public files before saying an update is live.
GitHub authentication for publishing is separate from static-site preview.

The saved design is tagged `baseline-blue` at
`24a16bbf54688810888a4d92abaf547fce2b8381`. It is retained in remote history.
Inspect it without replacing current files:

```sh
git fetch origin tag baseline-blue
git show baseline-blue:index.html
```

Do not delete or move that tag, rewrite history, force-push, or reset current work
to the baseline. Keep the current design and full history unless explicitly asked
to change them. Mac desktop shortcuts and old local preview copies are conveniences,
not cloud dependencies; do not delete the local project during handoff.

## Start real cloud development

GitHub Pages hosts the website; it is **not** a cloud coding environment.
Publishing these notes prepares the repository but does not create an environment
or migrate this local chat. Use the supported Codex Cloud setup:

1. In a new task, choose **Work in > Cloud > Select environment > Create environment**
   (or **Settings > Codex Cloud > Environments > Create environment**).
2. Select **gjanos85/fire-date-countdown** and choose **Get started**. Connect GitHub
   if prompted; do not grant unrelated repositories or services access.
3. Ask setup to read `AGENTS.md` and this README, provide Python 3 and Node.js 18+,
   run `node scripts/check.cjs`, and test the static preview on port 8766. No app
   secrets or paid hosting are needed. Use the environment's supported preview
   forwarding and network policy, not ad-hoc public tunnels.
4. Review the preparation/test results and configuration, resolve failures, save,
   then **Publish**. Wait for **Environment published**.
5. Choose **Start a new task** in that published repository environment. Suggested
   first prompt: “Read AGENTS.md and README.md. Verify the F.I.R.E countdown project,
   run the checks and preview without redesigning or deploying it, and report
   cloud readiness. Respect the included-usage/paid-credit consent rule.”

Only report cloud development active after verifying the actual published
environment and repository-backed task. Do not substitute a blank cloud chat or
simulated setup. A CLI that supports `codex cloud exec --env` can start a task
only after a real, verified environment identifier is available; never invent one.

Official setup: https://learn.chatgpt.com/docs/environments/cloud-environments
