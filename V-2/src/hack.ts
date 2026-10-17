const steps = [
  '*🤖 BOT_404 — SYSTEM CHECK*\n\nInitializing secure analysis... ',
  '*🤖 BOT_404 — SCANNING*\n\nReviewing message metadata... ',
  '*🤖 BOT_404 — ENCRYPTION*\n\nGenerating fictional access tunnel... ',
  '*🤖 BOT_404 — TRACE*\n\nRunning prank-level diagnostics... ',
  '*🤖 BOT_404 — FINALIZING*\n\nPreparing dramatic results... '
]

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Optimizing prank execution: accepts configurable delayMs (default: 650ms) to allow fast test execution (0ms)
export async function sendHackPrank(send: (text: string) => Promise<unknown>, delayMs = 650) {
  const shuffled = [...steps].sort(() => Math.random() - 0.5)
  for (const step of shuffled) {
    await send(step)
    if (delayMs > 0) await wait(delayMs)
  }
  return send('*🤖 BOT_404 — RESULT*\n\nInformation uploading to dark web...\n\nHaha 😄')
}
