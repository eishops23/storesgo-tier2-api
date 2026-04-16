-- =========================================================================
-- Manual Migration: Agent Suite Tables (Phase 0 Part B)
-- Generated: 2026-04-08
-- Adds: ai_customer_identities, ai_identity_aliases, ai_conversations,
--       ai_messages, ai_tool_calls, ai_autonomy_states
-- Adds enums: AiChannel, AiConversationStatus, AiMessageRole,
--             AiToolCallStatus, AiAutonomyLevel
--
-- HOW TO APPLY (local dev only):
--   psql "$DATABASE_URL" -f prisma/migrations/manual/2026_04_08_add_ai_tables.sql
--
-- DO NOT APPLY TO PRODUCTION until Phase 0 Part E is complete and
-- feature flags (AGENT_SUITE_ENABLED=false) are deployed.
-- =========================================================================

BEGIN;

-- CreateEnum
CREATE TYPE "AiChannel" AS ENUM ('chat', 'voice', 'email', 'whatsapp', 'sms', 'webhook');

-- CreateEnum
CREATE TYPE "AiConversationStatus" AS ENUM ('active', 'resolved', 'abandoned', 'escalated', 'error');

-- CreateEnum
CREATE TYPE "AiMessageRole" AS ENUM ('system', 'user', 'assistant', 'tool');

-- CreateEnum
CREATE TYPE "AiToolCallStatus" AS ENUM ('pending', 'success', 'error', 'timeout');

-- CreateEnum
CREATE TYPE "AiAutonomyLevel" AS ENUM ('L0', 'L1', 'L2', 'L3');

-- CreateTable
CREATE TABLE "ai_customer_identities" (
    "id" TEXT NOT NULL,
    "displayName" TEXT,
    "preferredLanguage" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_customer_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_identity_aliases" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "channel" "AiChannel" NOT NULL,
    "value" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_identity_aliases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_conversations" (
    "id" TEXT NOT NULL,
    "identityId" TEXT,
    "channel" "AiChannel" NOT NULL,
    "featureKey" TEXT NOT NULL,
    "status" "AiConversationStatus" NOT NULL DEFAULT 'active',
    "externalId" TEXT,
    "totalTokensUsed" INTEGER NOT NULL DEFAULT 0,
    "totalCostUsd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "AiMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DECIMAL(10,6) NOT NULL DEFAULT 0,
    "finishReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_tool_calls" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "argsJson" JSONB NOT NULL,
    "resultJson" JSONB,
    "status" "AiToolCallStatus" NOT NULL DEFAULT 'pending',
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "autonomyLevelAtExecution" "AiAutonomyLevel" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_tool_calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_autonomy_states" (
    "id" TEXT NOT NULL,
    "featureKey" TEXT NOT NULL,
    "currentLevel" "AiAutonomyLevel" NOT NULL DEFAULT 'L0',
    "evalScoreAvg" DECIMAL(4,2) NOT NULL DEFAULT 0,
    "totalExecutions" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "lastPromotedAt" TIMESTAMP(3),
    "promotedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_autonomy_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_identity_aliases_identityId_idx" ON "ai_identity_aliases"("identityId");

-- CreateIndex
CREATE UNIQUE INDEX "ai_identity_aliases_channel_value_key" ON "ai_identity_aliases"("channel", "value");

-- CreateIndex
CREATE INDEX "ai_conversations_identityId_idx" ON "ai_conversations"("identityId");

-- CreateIndex
CREATE INDEX "ai_conversations_channel_status_idx" ON "ai_conversations"("channel", "status");

-- CreateIndex
CREATE INDEX "ai_conversations_featureKey_status_idx" ON "ai_conversations"("featureKey", "status");

-- CreateIndex
CREATE INDEX "ai_conversations_lastMessageAt_idx" ON "ai_conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "ai_messages_conversationId_createdAt_idx" ON "ai_messages"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_tool_calls_messageId_idx" ON "ai_tool_calls"("messageId");

-- CreateIndex
CREATE INDEX "ai_tool_calls_toolName_status_idx" ON "ai_tool_calls"("toolName", "status");

-- CreateIndex
CREATE INDEX "ai_tool_calls_createdAt_idx" ON "ai_tool_calls"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ai_autonomy_states_featureKey_key" ON "ai_autonomy_states"("featureKey");

-- AddForeignKey
ALTER TABLE "ai_identity_aliases" ADD CONSTRAINT "ai_identity_aliases_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "ai_customer_identities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_conversations" ADD CONSTRAINT "ai_conversations_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "ai_customer_identities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_messages" ADD CONSTRAINT "ai_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ai_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_tool_calls" ADD CONSTRAINT "ai_tool_calls_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ai_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
