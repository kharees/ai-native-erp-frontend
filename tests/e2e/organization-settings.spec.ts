import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockCommonApi, login } from './fixtures/mockApi';

/**
 * Flow (e): Open Organization Settings -> assert the "Discard Changes"
 * button text is visible and has sufficient contrast (computed color
 * values, not just DOM presence).
 *
 * Two independent checks, deliberately not just one:
 *   1. axe-core's color-contrast rule (the standard, WCAG-formula-correct
 *      way to check this) scoped to the actions bar.
 *   2. A manual getComputedStyle luminance/contrast-ratio calculation on
 *      the button itself, per this task's explicit ask for "computed
 *      color values, not just presence" -- catches the exact class of bug
 *      a "does the text exist in the DOM" assertion would miss entirely.
 */
function relativeLuminance([r, g, b]: [number, number, number]): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function parseRgb(css: string): [number, number, number] {
  const match = css.match(/rgba?\(([^)]+)\)/);
  if (!match) throw new Error(`Unrecognized color format: ${css}`);
  const [r, g, b] = match[1].split(',').map((n) => parseFloat(n.trim()));
  return [r, g, b];
}

function contrastRatio(fg: [number, number, number], bg: [number, number, number]): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe('Organization Settings', () => {
  test.beforeEach(async ({ page }) => {
    await mockCommonApi(page);
    await login(page);
    await page.goto('/organization');
    await expect(page.getByRole('heading', { name: 'Organization Settings' })).toBeVisible();
  });

  test('Discard Changes button is visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Discard Changes' })).toBeVisible();
  });

  test('Discard Changes button text has sufficient contrast against its actual background', async ({ page }) => {
    const button = page.getByRole('button', { name: 'Discard Changes' });

    const { textColor, effectiveBackground } = await button.evaluate((el) => {
      const textColor = getComputedStyle(el).color;
      // The button itself is bg-transparent (see Button.tsx's `outline`
      // variant) -- walk up the DOM until a non-transparent background is
      // found, since that's the color the text is actually read against.
      let node: HTMLElement | null = el as HTMLElement;
      let effectiveBackground = 'rgb(255, 255, 255)'; // page default if nothing else is painted
      while (node) {
        const bg = getComputedStyle(node).backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          effectiveBackground = bg;
          break;
        }
        node = node.parentElement;
      }
      return { textColor, effectiveBackground };
    });

    const ratio = contrastRatio(parseRgb(textColor), parseRgb(effectiveBackground));

    // WCAG AA for normal-size UI text: 4.5:1.
    expect(
      ratio,
      `"Discard Changes" text ${textColor} against background ${effectiveBackground} has a contrast ratio of ${ratio.toFixed(2)}:1 (needs >= 4.5:1)`
    ).toBeGreaterThanOrEqual(4.5);
  });

  test('no color-contrast violations in the page actions bar (axe-core)', async ({ page }) => {
    const results = await new AxeBuilder({ page })
      .include('header, [role="banner"], body') // scan broadly; filtered to color-contrast below
      .withRules(['color-contrast'])
      .analyze();

    const violationSummaries = results.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target.join(' ')),
    }));
    expect(violationSummaries, JSON.stringify(violationSummaries, null, 2)).toEqual([]);
  });
});
