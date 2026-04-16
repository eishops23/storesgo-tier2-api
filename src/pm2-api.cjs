// ✅ Works even with "type": "module" in package.json and Node 22
(async () => {
  // Use ts-node in ESM mode via loader
  await import('ts-node/register/transpile-only');
  await import('./index.ts');
})();

