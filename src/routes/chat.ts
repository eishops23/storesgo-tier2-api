import { FastifyPluginAsync, FastifyRequest } from "fastify";
import { processChat, ChatMessage, searchProducts, getStoreStats } from "../services/aiChat.service.js";
import { runCsChat } from "../agent/features/cs-chat/index.js";
import { runReferrals } from "../agent/features/referrals/index.js";
import { runReviews } from "../agent/features/reviews/index.js";
import { runRecommendations } from "../agent/features/recommendations/index.js";
import { isFeatureAllowed } from "../agent/flags/index.js";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";

const REFERRAL_KEYWORDS = /\b(referral|refer|referred|referrer|referrals|leaderboard|invite|my code|referral code|share link|share my link|referral link|referral program|referral reward)\b/i;
const REVIEW_KEYWORDS = /\b(review|reviews|rating|ratings|star|stars|feedback|reply to review|respond to review|draft response|customer review|reviewer)\b/i;
const REC_KEYWORDS = /\b(recommend|recommendation|recommendations|suggest|suggestion|suggestions|what goes with|what can i cook|complete my cart|similar to|like this|pair with|goes well with|cooking|recipe|what do i need|what else|ingredients for|what to make)\b/i;

interface ChatBody { messages: ChatMessage[]; action?: { type: string; query?: string; orderId?: number }; conversationId?: string; }

function getUserIdFromToken(request: FastifyRequest): string | null {
  const auth = request.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET || "secret") as any;
    return decoded.id || null;
  } catch { return null; }
}

const chatRoutes: FastifyPluginAsync = async (app) => {
  app.post("/", async (request: FastifyRequest<{ Body: ChatBody }>, reply) => {
    const { messages, action, conversationId } = request.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return reply.status(400).send({ ok: false, error: "Messages required" });
    }
    const userId = getUserIdFromToken(request);

    // --- Reviews agent path (seller-only, keyword-routed, feature-flagged) ---
    // Fires before referrals because the seller-auth gate is the most
    // restrictive — non-sellers fall through cheaply to the referrals/cs-chat
    // cascade. Banned sellers are rejected at dispatch per Phase 11 audit B12.
    if (isFeatureAllowed('reviews')) {
      const latestUserReview = [...messages].reverse().find((m) => m.role === 'user');
      if (latestUserReview?.content && REVIEW_KEYWORDS.test(latestUserReview.content)) {
        try {
          if (userId) {
            const seller = await prisma.seller.findFirst({
              where: { userId },
              select: {
                id: true,
                storeName: true,
                isBanned: true,
                isApproved: true,
              },
            });

            if (seller && !seller.isBanned) {
              const result = await runReviews({
                userText: latestUserReview.content,
                userId,
                sellerId: seller.id,
                storeName: seller.storeName ?? null,
                guestSessionId: null,
                conversationId: conversationId ?? null,
              });

              return reply.send({
                ok: result.ok,
                response: result.response,
                data: result.data ?? null,
                suggestions: result.suggestions,
                conversationId: result.conversationId,
              });
            }
          }
          // No authenticated seller resolved → intentional fall-through
        } catch (error) {
          console.error('[chat-route] runReviews failed, falling back to referrals/cs_chat/Gemini:', error);
          // Intentional fall-through to referrals/cs_chat or Gemini path
        }
      }
    }

    // --- Recommendations agent path (customer, keyword-routed, feature-flagged) ---
    // Fires before referrals because recommendations are the revenue
    // lever and the keyword regex is more specific than referrals.
    // Works for both guests and authenticated customers per audit B5 —
    // userName is looked up from BuyerProfile when a JWT is present.
    if (isFeatureAllowed('recommendations')) {
      const latestUserRec = [...messages].reverse().find((m) => m.role === 'user');
      if (latestUserRec?.content && REC_KEYWORDS.test(latestUserRec.content)) {
        try {
          let userName: string | null = null;
          if (userId) {
            try {
              const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { buyerProfile: { select: { firstName: true } } },
              });
              userName = user?.buyerProfile?.firstName ?? null;
            } catch {
              // Non-fatal — the agent works without a name
            }
          }

          const result = await runRecommendations({
            userText: latestUserRec.content,
            userId: userId ?? null,
            userName,
            guestSessionId: null,
            conversationId: conversationId ?? null,
          });

          return reply.send({
            ok: result.ok,
            response: result.response,
            data: result.data ?? null,
            suggestions: result.suggestions,
            conversationId: result.conversationId,
          });
        } catch (error) {
          console.error('[chat-route] runRecommendations failed, falling back to referrals/cs_chat/Gemini:', error);
          // Intentional fall-through to referrals → cs_chat → Gemini
        }
      }
    }

    // --- Referrals agent path (keyword-routed, feature-flagged) ---
    if (isFeatureAllowed('referrals')) {
      const latestUserRef = [...messages].reverse().find((m) => m.role === 'user');
      if (latestUserRef?.content && REFERRAL_KEYWORDS.test(latestUserRef.content)) {
        try {
          const guestSessionId = request.headers['x-guest-session-id'] as string | undefined;

          const result = await runReferrals({
            userText: latestUserRef.content,
            userId: userId ?? null,
            guestSessionId: guestSessionId ?? null,
            conversationId: conversationId ?? null,
          });

          if (result.guestSessionId) {
            reply.header('X-Guest-Session-Id', result.guestSessionId);
          }

          return reply.send({
            ok: result.ok,
            response: result.response,
            data: result.data ?? null,
            suggestions: result.suggestions,
            conversationId: result.conversationId,
          });
        } catch (error) {
          console.error('[chat-route] runReferrals failed, falling back to cs_chat/Gemini:', error);
          // Intentional fall-through to cs_chat or Gemini path
        }
      }
    }

    // --- CS Chat agent path (feature-flagged) ---
    if (isFeatureAllowed('cs_chat')) {
      try {
        const latestUser = [...messages].reverse().find((m) => m.role === 'user');
        if (!latestUser?.content) {
          return reply.status(400).send({ ok: false, error: "No user message found" });
        }

        const guestSessionId = request.headers['x-guest-session-id'] as string | undefined;

        const result = await runCsChat({
          userText: latestUser.content,
          userId: userId ?? null,
          guestSessionId: guestSessionId ?? null,
          conversationId: conversationId ?? null,
        });

        if (result.guestSessionId) {
          reply.header('X-Guest-Session-Id', result.guestSessionId);
        }

        return reply.send({
          ok: result.ok,
          response: result.response,
          data: result.data ?? null,
          suggestions: result.suggestions,
          conversationId: result.conversationId,
        });
      } catch (error) {
        console.error('[chat-route] runCsChat failed, falling back to Gemini:', error);
        // Intentional fall-through to Gemini path
      }
    }

    // --- Legacy Gemini path (default / fallback) ---
    const result = await processChat(messages, userId || undefined, action);
    return reply.send({ ok: true, ...result });
  });

  app.get("/search", async (request: FastifyRequest<{ Querystring: { q: string } }>, reply) => {
    const { q } = request.query;
    if (!q) return reply.send({ ok: true, products: [] });
    const products = await searchProducts(q, 5);
    return reply.send({ ok: true, products });
  });

  app.get("/stats", async (request, reply) => {
    const stats = await getStoreStats();
    return reply.send({ ok: true, stats });
  });
};

export default chatRoutes;
