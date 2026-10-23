# Project instructions

## Preserve the product

- This is the existing F.I.R.E. retirement countdown, not a new website design.
  Keep the blue layered background, gold accents, current typography/layout, and
  `F.I.R.E.` capitalization/punctuation unless the user requests a change.
- Target: May 18, 2033, midnight Toronto (`2033-05-18T00:00:00-04:00`). Journey start:
  May 18, 2023, ten years before the target. Preserve years/months/days/hours/
  minutes/seconds and the two-digit subsecond display, journey percentage, current
  date and weekday. Do not silently change date/timezone semantics during setup.
- Canada and Hungary flags stay at opposite flight endpoints. Keep the continuous
  solid 3D Air Canada-inspired plane, real intermediate turn angles, takeoff,
  landing and return flight. Never reintroduce a separate front-view overlay or
  a backward-flying plane. Preserve the software 3D fallback.
- Windows belong on the upper fuselage. Retain only the smaller wing-mounted
  engines; do not restore the oversized low-hanging engines.
- The articulated 3D worker enters from outside the relevant airport, approaches
  and braces/pushes during turnaround, turns naturally, then walks **forward** back
  outside before takeoff. Keep this choreography at both airports, including the
  Canada mirror. Preserve readable proportions, shaded clothing and safety gear.
- Sun stays in the Hungary area: polished warm disk, restrained luminous rays/
  glow/shimmer, no visual obstruction. The **entire face** (eyes, mouth, cheeks,
  etc.) must be hidden before Hungary touchdown, with no faint/ghost face or
  neutral expression. Reveal the friendly smile after touchdown and hide it again
  before the next arrival. Default/load and reduced-motion states are faceless.
- Flight, crew, sun motion and facial reveal share the same flight timeline.
  Current 40-second loop: Hungary touchdown 44%, turnaround 46–49%, crew exit
  complete 55.3%, departure 55.5%; Canada is offset by half a loop. Pause freezes
  the whole scene, including the sun/face and articulated poses. Reduced motion
  is stable. Preserve desktop window fit and narrow-screen responsiveness.

## Development, checks, and release

- See README.md for the source map and portable setup. No dependencies or build
  step are required. Never add secrets, local credentials, personal files, or
  hard-coded Mac runtime paths to this public repository.
- Run `node scripts/check.cjs`, then visual checks proportionate to the change.
  Check before/after landing, both endpoint crew sequences, pause/resume, reduced
  motion, desktop/narrow layout, and browser runtime errors. State what was not
  tested; automated checks alone do not prove visual correctness.
- Preserve unrelated work. Keep `baseline-blue` and Git history intact. No
  destructive reset, history rewrite, force push, or deletion of the local copy.
- Existing GitHub Pages publishes `main` at `/`; pushes can affect production.
  Cloud setup is not authorization for redesign or unrelated deployments. Verify
  the build/commit and live files for any authorized website update.
- GitHub repository access/Pages hosting is not proof of a published cloud coding
  environment. Never claim a migration from a simulated tool or generic blank
  chat; verify the actual environment and repository-backed cloud task.

## Included usage and paid-credit consent

Check available included usage before substantial work and periodically during
long runs. If included usage is exhausted or known to be insufficient, warn the
user and **stop before knowingly continuing on paid credits**. Obtain fresh,
explicit permission on each occasion; earlier consent is not standing consent.
Relay this rule to delegated workers. Do not buy credits, enable automatic
purchases, or redeem usage-reset credits without explicit authorization.
This is an assistant instruction, not an account-level billing block; do not
claim it guarantees zero spend. If usage cannot be inspected, disclose that
limitation rather than claiming available allowance or a hard spending cap.
