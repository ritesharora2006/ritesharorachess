export default async function run(page, ui) {
  const before = await ui.snapshot();
  const start = before.match(/@(e\d+) button "START LOCAL GAME/)?.[1];
  if (!start) return { error: 'no start-local button', before };

  await ui.click(start);
  await page.waitForTimeout(800);

  await ui.snapshot({ full: true });

  // Click e2 pawn (white) then e4 to make a move — board squares are gridcells.
  // Find a square by aria-label containing 'e2' and 'e4'.
  const e2 = page.locator('[aria-label*="e2"]').first();
  await e2.click();
  await page.waitForTimeout(300);
  const e4 = page.locator('[aria-label*="e4"]').first();
  await e4.click();
  await page.waitForTimeout(500);

  const status = await page.locator('[role="status"]').first().innerText().catch(() => 'n/a');
  const historyText = await page.locator('[aria-label="Move history"]').innerText().catch(() => 'n/a');
  return { status, moves: historyText };
}
