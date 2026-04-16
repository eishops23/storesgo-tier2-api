(async () => {
  await import('ts-node/register/transpile-only');
  await import('./workers/aiCategorizationWorker.ts');
})();

