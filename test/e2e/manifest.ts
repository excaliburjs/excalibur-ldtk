import type { Locator, Page } from '@playwright/test';

export interface SampleCase {
  /** HTML file under sample/ */
  file: string;
  /** Snapshot name, defaults to the html file's basename */
  name?: string;
  /** Optional interaction to run before the screenshot */
  action?: (page: Page, canvas: Locator) => Promise<void>;
  /** If set, the case is skipped with this reason instead of run */
  skip?: string;
  /** Overrides the default maxDiffPixelRatio (see ldtk.spec.ts) */
  tolerance?: number;
  /** Overrides the default number of post-action clock-steps before capturing */
  settleSteps?: number;
}

export const SAMPLE_CASES: SampleCase[] = [
  // spacing-padding.ldtk, entity factory + player + camera strategies
  { file: 'sample.html', name: 'main' },
  // autotile.ldtk - auto-layer tiles driven by an int grid
  { file: 'autotile.html', name: 'autotile' },
  // dsml1.ldtk - pure auto-layer (no int grid values rendered)
  { file: 'pureautotile.html', name: 'pure-autotile' }
];
