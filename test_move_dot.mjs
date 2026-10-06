export default async function run(page, ui) {
  // Click START GAME (single player)
  const startBtn = await ui.text('START GAME →');
  if (!startBtn) {
    return { error: 'START GAME button not found' };
  }
  await ui.click(startBtn);
  // Wait for board to appear
  await page.waitForSelector('.board', { timeout: 5000 });
  // Optionally wait a bit for pieces to render
  await page.waitForTimeout(500);
  // Find a white pawn that likely has moves (e2nd rank from bottom if board not flipped)
  // We'll just click the first piece we find that yields highlights
  // Get all piece elements
  const pieces = await page.$$('.piece');
  for (const pieceEl of pieces) {
    await pieceEl.click();
    await page.waitForTimeout(200);
    const highlightCount = await page.evaluate(() => {
      const squares = document.querySelectorAll('.square');
      let count = 0;
      squares.forEach(sq => {
        if (sq.classList.contains('squareMove')) {
          count++;
        }
      });
      return count;
    });
    if (highlightCount > 0) {
      // Clear selection by clicking elsewhere? We'll just return count
      return { highlightCount };
    }
    // else try next piece
  }
  return { error: 'No piece with moves found' };
}