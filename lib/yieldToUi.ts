/** Gives the browser a chance to paint between heavy main-thread steps (e.g. per-page canvas work). */
export const yieldToUi = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
