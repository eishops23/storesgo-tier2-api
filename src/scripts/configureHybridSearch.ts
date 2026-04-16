const MEILI_HOST = "http://127.0.0.1:7700";
const MEILI_MASTER_KEY = "ff6c780c6c9cfd9156cd7831e86a49b21cbde1ece9d55dc9b2fcb11ef8b63482";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🔧 StoresGo Hybrid Search Configuration");
  console.log("═══════════════════════════════════════════════════════════════\n");

  if (!OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY not set. Run with:");
    console.error("   OPENAI_API_KEY=sk-xxx npx tsx src/scripts/configureHybridSearch.ts");
    process.exit(1);
  }
  console.log("✅ OpenAI API key found\n");

  console.log("1️⃣  Checking Meilisearch...");
  try {
    const versionRes = await fetch(`${MEILI_HOST}/version`, {
      headers: { Authorization: `Bearer ${MEILI_MASTER_KEY}` },
    });
    if (!versionRes.ok) throw new Error(`HTTP ${versionRes.status}`);
    const version: any = await versionRes.json();
    console.log(`   Version: ${version.pkgVersion}`);
    const [major, minor] = version.pkgVersion.split(".").map(Number);
    if (major < 1 || (major === 1 && minor < 6)) {
      console.error("❌ Meilisearch 1.6+ required");
      process.exit(1);
    }
    console.log("   ✅ Version OK\n");
  } catch (err: any) {
    console.error("❌ Cannot connect to Meilisearch:", err.message);
    process.exit(1);
  }

  console.log("2️⃣  Checking products index...");
  const statsRes = await fetch(`${MEILI_HOST}/indexes/products/stats`, {
    headers: { Authorization: `Bearer ${MEILI_MASTER_KEY}` },
  });
  const stats: any = await statsRes.json();
  console.log(`   Documents: ${stats.numberOfDocuments?.toLocaleString()}\n`);

  console.log("3️⃣  Checking existing embedder...");
  const settingsRes = await fetch(`${MEILI_HOST}/indexes/products/settings/embedders`, {
    headers: { Authorization: `Bearer ${MEILI_MASTER_KEY}` },
  });
  const embedders: any = await settingsRes.json();
  if (embedders && embedders["storesgo-semantic"]) {
    console.log("   ⚠️  Embedder already configured, skipping setup\n");
    await testSearch();
    return;
  }
  console.log("   No existing embedder\n");

  console.log("4️⃣  Configuring OpenAI embedder...");
  const embedderConfig = {
    "storesgo-semantic": {
      source: "openAi",
      apiKey: OPENAI_API_KEY,
      model: "text-embedding-3-small",
      documentTemplate: "{{doc.name}} - {{doc.categoryName}} - {{doc.brand}} {{doc.description}}",
    },
  };

  const configRes = await fetch(`${MEILI_HOST}/indexes/products/settings/embedders`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${MEILI_MASTER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(embedderConfig),
  });

  if (!configRes.ok) {
    console.error("❌ Failed:", await configRes.text());
    process.exit(1);
  }

  const task: any = await configRes.json();
  console.log(`   Task: ${task.taskUid}\n`);

  console.log("5️⃣  Generating embeddings (5-15 minutes)...");
  let status = "processing";
  const startTime = Date.now();

  while (status === "processing" || status === "enqueued") {
    await new Promise((r) => setTimeout(r, 10000));
    const taskRes = await fetch(`${MEILI_HOST}/tasks/${task.taskUid}`, {
      headers: { Authorization: `Bearer ${MEILI_MASTER_KEY}` },
    });
    const taskInfo: any = await taskRes.json();
    status = taskInfo.status;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    console.log(`   Status: ${status} (${elapsed}s)`);
    if (status === "failed") {
      console.error("❌ Failed:", JSON.stringify(taskInfo.error));
      process.exit(1);
    }
  }
  console.log("   ✅ Done!\n");
  await testSearch();
}

async function testSearch() {
  console.log("6️⃣  Testing hybrid search...\n");
  for (const q of ["milk", "rice", "chicken"]) {
    const res = await fetch(`${MEILI_HOST}/indexes/products/search`, {
      method: "POST",
      headers: { Authorization: `Bearer ${MEILI_MASTER_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ q, hybrid: { embedder: "storesgo-semantic", semanticRatio: 0.7 }, limit: 3 }),
    });
    const data: any = await res.json();
    console.log(`   "${q}" → ${data.hits?.map((h: any) => h.name).join(", ")}`);
  }
  console.log("\n✅ Configuration complete!");
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
