import { expect, test } from '@playwright/test';
import type { Frame, Page } from '@playwright/test';
import { SAMPLE_CASES } from './manifest';

// Installed via page.addInitScript in every frame before any page script runs. It does two
// things to make these otherwise wall-clock/RNG-driven scenes reproducible:
//
// 1. Seeds Math.random with a fixed PRNG. Excalibur falls back to raw Math.random() for
//    variance in a few places when no seeded ex.Random is passed in, which is otherwise
//    genuinely nondeterministic between runs.
// 2. Installs window.__exStep(steps, stepMs), which freezes ex.Engine's real-time clock
//    (every engine registers itself as window.___EXCALIBUR_DEVTOOL) the first time it's
//    called and, from then on, advances it a fixed number of simulated frames per call.
//    Deliberately drives the *same* Clock instance (via its protected update()) rather than
//    swapping in a fresh TestClock: swapping instances would silently drop anything already
//    scheduled via clock.schedule() on the original clock, e.g. the Loader's own 200ms
//    "show play button" delay, leaving those permanently stuck. Steps are paced with a real
//    rAF yield every few steps so GPU work actually flushes instead of backing up the
//    command queue - only the simulated elapsed time is deterministic, not the real-world
//    pacing between steps.
const INSTALL_DETERMINISM_HOOKS = `
  (function () {
    let seed = 0x2f6e2b1;
    Math.random = function () {
      seed |= 0;
      seed = (seed + 0x9e3779b9) | 0;
      let t = Math.imul(seed ^ (seed >>> 16), 0x21f0aaad);
      t = Math.imul(t ^ (t >>> 15), 0x735a2d97);
      return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
    };
  })();
  window.__exStep = async function (steps, stepMs) {
    const engine = window.___EXCALIBUR_DEVTOOL;
    if (!engine || !engine.clock) {
      return false;
    }
    if (!engine.clock.__isFrozen) {
      if (engine.clock.isRunning()) {
        engine.clock.stop();
      }
      engine.clock.__isFrozen = true;
      // Belt-and-suspenders: some engine paths (e.g. regaining window focus) call
      // clock.start() again, which would resume the real rAF loop and undo the freeze.
      engine.clock.start = function () {};
    }
    var YIELD_EVERY = 3;
    for (let i = 0; i < steps; i++) {
      engine.clock.update(stepMs || 16.6);
      if ((i + 1) % YIELD_EVERY === 0 || i === steps - 1) {
        await new Promise(function (resolve) {
          requestAnimationFrame(resolve);
        });
      }
    }
    return true;
  };
`;

async function stepEngineClock(frame: Frame, steps: number) {
  // Silently a no-op if called before the engine has constructed itself.
  await frame.evaluate((steps) => (window as any).__exStep?.(steps), steps);
}

async function findGameFrame(page: Page): Promise<Frame> {
  const mainFrame = page.mainFrame();
  await mainFrame.locator('canvas').first().waitFor({ state: 'visible', timeout: 10_000 });
  return mainFrame;
}

for (const sampleCase of SAMPLE_CASES) {
  const name = sampleCase.name ?? sampleCase.file.replace(/\.html$/, '');

  test(`${name} matches golden master`, async ({ page }) => {
    test.skip(!!sampleCase.skip, sampleCase.skip);

    await page.addInitScript(INSTALL_DETERMINISM_HOOKS);
    await page.goto(`/${sampleCase.file}`);

    const frame = await findGameFrame(page);
    const canvas = frame.locator('canvas').first();

    // Freeze frame timing as early as possible - safe to do before the Loader's play button
    // ever appears since we drive the original clock instance in place (see above).
    await stepEngineClock(frame, 1);

    // The samples boot with a Loader, which draws a loading bar onto the canvas and shows a
    // real DOM "Play game" button (#excalibur-play) inside #excalibur-play-root once ready.
    // Newer engine builds flip the root's aria-busy attribute to "false" when it is safe to
    // click; the button's own display flipping from "none" to "flex" (Loader.showPlayButton)
    // is the equivalent signal on builds without it - check both. The .ldtk maps and their
    // tileset images take real network time to fetch and decode, and each miss below yields
    // to a real rAF, so give it a generous number of tries.
    let playButtonReady = false;
    for (let i = 0; i < 300 && !playButtonReady; i++) {
      playButtonReady = await frame.evaluate(() => {
        const root = document.getElementById('excalibur-play-root');
        if (root?.getAttribute('aria-busy') === 'false') {
          return true;
        }
        const button = document.getElementById('excalibur-play');
        return !!button && getComputedStyle(button).display !== 'none';
      });
      if (!playButtonReady) {
        await stepEngineClock(frame, 2);
      }
    }
    const playButton = frame.locator('#excalibur-play-root button');
    if (playButtonReady) {
      await playButton.click();
    }
    // We should never end up screenshotting the boot screen (Excalibur logo / loading bar /
    // play button) - fail loudly instead of silently capturing it.
    await expect(playButton, 'loader play button should be dismissed before capturing').toBeHidden();

    if (sampleCase.action) {
      await sampleCase.action(page, canvas);
    }

    // Deterministically advance a handful more frames so the scene (and the resource's
    // addToScene work, which happens in the game.start() continuation) is reflected in the
    // render before capturing.
    await stepEngineClock(frame, sampleCase.settleSteps ?? 10);

    // Capture a single frame directly rather than using toHaveScreenshot's "wait until
    // stable" retry loop - this is a boot-and-shoot golden master. A single real frame can
    // still elapse between page script execution and the clock freeze, so the tolerance is
    // tight but not zero.
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchSnapshot(`${name}.png`, { maxDiffPixelRatio: sampleCase.tolerance ?? 0.01 });
  });
}
