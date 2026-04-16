/* eslint-disable */
// ---------------------------------------------------------
// StoresGo Phase 10 Scaffolding (Remapped)
// Generated: 2025-10-26T05:27:03.730802
// ---------------------------------------------------------

import 'dotenv/config';
import { Worker, Job } from 'bullmq';
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const connection = { connection: { url: process.env.REDIS_URL || 'redis://localhost:6379' } };
const queueName = process.env.QUEUE_AI_CATEGORIZATION || 'ai_categorization';
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Payload = { importItemId?: number; productId?: number; name: string; description?: string | null; };

function parseFirstJson(text: string): any {
  try {
    const start = text.indexOf('{'); const end = text.lastIndexOf('}');
    if (start >= 0 && end >= start) return JSON.parse(text.slice(start, end + 1));
  } catch {}
  return { slug: null, confidence: 0, tags: [] };
}

async function handle(job: Job<Payload>) {
  const { name, description, importItemId, productId } = job.data;
  const prompt = `Return JSON with keys: slug, confidence (0..1), tags (string[]) that best categorize a grocery product in a marketplace taxonomy.
Name: ${name}
Description: ${description || ''}`;

  const resp = await client.responses.create({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', input: prompt });
  const text = (resp as any).output_text || JSON.stringify({ slug: null, confidence: 0, tags: [] });
  const parsed = parseFirstJson(text);

  const log = await prisma.aICategoryLog.create({
    data: {
      productId: productId || null,
      importItemId: importItemId || null,
      resultJson: parsed as any,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
      chosenSlug: typeof parsed.slug === 'string' ? parsed.slug : null,
    }
  });

  if (productId && parsed.slug) {
    const cat = await prisma.taxonomy.upsert({
      where: { slug: parsed.slug },
      update: {},
      create: { slug: parsed.slug, title: parsed.slug }
    });
    await prisma.product.update({ where: { id: productId }, data: { categoryId: cat.id } });
  }
  if (importItemId) await prisma.importItem.update({ where: { id: importItemId }, data: { status: 'processed' } });

  return { ok: true, logId: log.id };
}

export const worker = new Worker<Payload>(queueName, handle, connection);
console.log(`[AI Worker] listening on ${queueName}`);
