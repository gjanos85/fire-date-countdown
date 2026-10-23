/* Portable smoke checks: Node built-ins only; no browser or package install. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
assert(scripts.length > 0, 'Entry page must contain scripts');
for (const [index, [, attributes, body]] of scripts.entries()) {
  const source = attributes.match(/\bsrc="([^"]+)"/);
  const name = source ? source[1] : `index.html:inline-${index}`;
  assert(!source || !/^(?:https?:|\/\/|\/)/.test(name), 'Runtime scripts must be repository-local');
  const code = source ? fs.readFileSync(path.join(root, name), 'utf8') : body;
  new vm.Script(code, { filename: name });
}
assert(!html.includes('id="local-animation-review"'), 'Remove temporary animation review overrides');
assert(html.includes('.sun-expression { visibility: hidden; opacity: 0;'), 'Face must be hidden before the sun script runs');
assert(!/ground-crew|crew-walker|crew-canvas|crew-approach|crew-depth/.test(html), 'No crew markup, styles, or script hooks');
assert(!fs.existsSync(path.join(root, 'ground-crew-3d.js')), 'Obsolete crew renderer was removed');
assert.equal([...html.matchAll(/class="flag-snow"/g)].length, 1, 'One decorative flag snowcap');
assert.match(html, /side-flag-hungary[\s\S]*?class="flag-snow"/, 'Snow sits on Hungary only');
assert(!html.includes('aircraft-front'), 'No separate front-view overlay');

let phase = 0, nextFrame, time = 0, updates = 0;
const values = {};
const sun = { dataset: {}, style: { setProperty(key, value) { values[key] = value; updates++; } } };
const motion = { matches: false, addEventListener(_, callback) { this.change = callback; } };
const flight = { animationName: 'flight-position', effect: { getComputedTiming: () => ({ progress: phase / 100 }) } };
vm.runInNewContext(fs.readFileSync(path.join(root, 'hungary-sun.js'), 'utf8'), {
  document: { hidden: false, querySelector: selector => selector === '.hungary-sun' ? sun : { getAnimations: () => [flight] } },
  matchMedia: () => motion,
  requestAnimationFrame: callback => { nextFrame = callback; },
});
function sample(percent) { phase = percent; nextFrame(time += 100); return Number(values['--sun-smile']); }
for (const percent of [0, 5, 25, 43, 43.999]) {
  assert.equal(sample(percent), 0);
  assert.equal(sun.dataset.welcoming, 'false', 'No pre-touchdown face');
}
assert(sample(44.5) > 0 && sample(44.5) < 1, 'Smooth post-touchdown reveal');
assert.equal(sample(45), 1);
assert.equal(sun.dataset.welcoming, 'true');
assert.equal(sample(50), 1);
assert(sample(51) > 0 && sample(51) < 1, 'Smile fades with the earlier departure');
assert.equal(sample(52), 0);
assert.equal(sun.dataset.welcoming, 'false');
assert.equal(sample(94), 0);
sample(45); sample(0);
assert.equal(sun.dataset.welcoming, 'false', 'Face resets on the next loop');
sample(47);
const paused = JSON.stringify(values), pausedUpdates = updates;
sample(47);
assert.equal(JSON.stringify(values), paused);
assert.equal(updates, pausedUpdates, 'Unchanged master timeline holds the sun state');
motion.matches = true; motion.change(); sample(47);
const reduced = JSON.stringify(values);
sample(88);
assert.equal(JSON.stringify(values), reduced, 'Reduced-motion sunshine is stable');
assert.equal(sun.dataset.welcoming, 'false');
motion.matches = false; motion.change();
assert.equal(sample(45), 1, 'Preference changes restore timeline-driven expressions');
console.log('PASS: script syntax/assets; no crew/overlay remnants; Hungary snowcap; faceless CSS; sun arrival/reset, pause, and reduced-motion states.');
console.log('Still required for visual changes: browser checks of aircraft, both airport turns, flag snow, motion controls, and responsive layout.');
