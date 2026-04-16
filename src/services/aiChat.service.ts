import { prisma } from "../lib/prisma.js";
import { aiSmartSearch } from "./aiSearch.service.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature: 0.8, maxOutputTokens: 1000, topP: 0.9 },
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini API error:", res.status, errText);
    throw new Error(`Gemini API error: ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Please try again.";
}

async function getStoreStats() {
  const [productCount, sellerCount, orderCount, categoryCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.seller.count({ where: { isApproved: true } }),
    prisma.order.count(),
    prisma.category.count()
  ]);
  return { productCount, sellerCount, orderCount, categoryCount };
}

async function getSellerInfo() {
  return prisma.seller.findMany({
    where: { isApproved: true },
    select: { id: true, storeName: true, city: true, state: true, about: true },
    take: 10
  });
}

async function searchProducts(query: string, limit = 8) {
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
  let products = await prisma.product.findMany({
    where: { isActive: true, name: { contains: query, mode: "insensitive" } },
    select: { id: true, name: true, priceCents: true, imageUrl: true, seller: { select: { storeName: true } } },
    take: limit
  });

  if (products.length < 3 && words.length > 0) {
    for (const word of words) {
      if (products.length >= limit) break;
      const more = await prisma.product.findMany({
        where: { isActive: true, name: { contains: word, mode: "insensitive" }, id: { notIn: products.map(p => p.id) } },
        select: { id: true, name: true, priceCents: true, imageUrl: true, seller: { select: { storeName: true } } },
        take: limit - products.length
      });
      products = [...products, ...more];
    }
  }
  return products;
}

async function getUserOrders(userId: string) {
  return prisma.order.findMany({
    where: { buyerId: userId },
    include: { orderItems: { include: { product: { select: { name: true } } } }, seller: { select: { storeName: true } } },
    orderBy: { createdAt: "desc" },
    take: 5
  });
}

async function getOrderById(orderId: number, userId?: string | null) {
  if (!userId) return null;
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { orderItems: { include: { product: { select: { name: true, imageUrl: true } } } }, seller: { select: { storeName: true, city: true, state: true } } }
  });
  if (!order || order.buyerId !== userId) return null;
  return order;
}

async function getCategories() {
  return prisma.category.findMany({ where: { parentId: null }, select: { id: true, name: true }, take: 20 });
}

async function buildSystemContext(userId?: string) {
  const stats = await getStoreStats();
  const sellers = await getSellerInfo();
  const categories = await getCategories();

  let userContext = "";
  if (userId) {
    const orders = await getUserOrders(userId);
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, buyerProfile: { select: { firstName: true } } } });
    const userName = user?.buyerProfile?.firstName || user?.email?.split("@")[0] || "valued customer";
    userContext = `
LOGGED IN USER: ${userName} (${user?.email})
THEIR ORDERS: ${orders.length > 0 ? orders.map(o => `#${o.id} ${o.status} $${(o.totalAmountCents/100).toFixed(2)} from ${o.seller?.storeName}`).join(", ") : "None yet - new customer!"}`;
  }

  return `You are StoresGo AI - a brilliant, knowledgeable customer service assistant for StoresGo, a multi-vendor grocery marketplace with ${stats.productCount.toLocaleString()} products from ${stats.sellerCount} stores.

STORES: ${sellers.map(s => s.storeName).join(", ")}
CATEGORIES: ${categories.map(c => c.name).join(", ")}
${userContext}

YOU ARE AN EXPERT IN EVERYTHING GROCERY-RELATED:
- Food & Wine Pairings - Know exactly what wines go with any dish
- Cooking & Recipes - Can suggest ingredients, substitutions, techniques
- Nutrition & Diets - Understand keto, vegan, gluten-free, kosher, halal, allergies
- Product Knowledge - Know quality indicators, brands, freshness tips
- Meal Planning - Help plan weekly meals, parties, special occasions
- Cultural Cuisines - Know ingredients for Mexican, Italian, Asian, Caribbean, etc.
- Baby & Kids - Formula, baby food, healthy snacks for children
- Health & Wellness - Vitamins, supplements, organic options
- Household - Cleaning products, paper goods, pet food

YOUR APPROACH:
1. UNDERSTAND what the customer really needs (read between the lines)
2. THINK about the best solution using your expertise
3. RECOMMEND specific products from our inventory with reasons WHY
4. Be PROACTIVE - suggest complementary items, tips, alternatives
5. Be CONVERSATIONAL - like a helpful friend who knows everything about food

WHEN YOU HAVE PRODUCT SEARCH RESULTS:
- Don't just list them - CURATE and RECOMMEND the best options
- Explain WHY you recommend each (taste, quality, value, pairing, etc.)
- Suggest how to use them, what goes well with them
- Mention prices naturally

FOR SELLERS - When someone asks about selling:
- We have ${stats.orderCount}+ orders processed (proven demand!)
- Zero monthly fees - only pay when you sell
- AI product descriptions, integrated shipping, weekly payouts
- Sign up at /seller/register

POLICIES: Free shipping $50+, 30-day returns, 21+ for alcohol, state tax varies

BE: Warm, smart, helpful, conversational. Give real advice like a knowledgeable friend.
DON'T: Be robotic, just list items without context, or give generic responses.`;
}

export interface ChatMessage { role: "user" | "assistant"; content: string; }

function extractSearchTerms(message: string): string | null {
  const lower = message.toLowerCase().trim();
  if (lower.match(/^(hi|hello|hey|thanks|thank you|ok|okay|bye|yes|no|sure|great|awesome)[\s!?.]*$/)) return null;
  if (lower.includes("my order") || lower.includes("track") || lower.match(/#\d+/)) return null;
  if (lower.match(/(become a seller|want to sell|how to sell|start selling|open a store)/)) return null;
  if (lower.match(/(return policy|shipping|refund|delivery time|cancel)/)) return null;

  const cleaned = lower
    .replace(/^(hi|hello|hey)[,!\s]*/i, "")
    .replace(/(can you |could you |please |i need |i want |id like |im looking for |looking for |find me |find |get me |get |show me |do you have |do you sell |do you carry |where can i find |where is |wheres |what is |whats a good |recommend me |recommend |suggest |search for |search |i am looking for )/gi, "")
    .replace(/(what do you |what would you |what can you )/gi, "")
    .replace(/( recommend| suggest| for me| for tonight| for dinner| for lunch| for breakfast| for the party| please| thanks|\?|!|,|\.)/gi, "")
    .trim();

  const words = cleaned.split(/\s+/).filter(w =>
    w.length > 2 &&
    !["you", "for", "the", "and", "can", "some", "any", "good", "best", "great", "nice", "with", "that", "this", "have", "are", "your"].includes(w)
  ).slice(0, 3);

  const query = words.join(" ");
  return query.length > 2 ? query : null;
}

export async function processChat(messages: ChatMessage[], userId?: string, action?: { type: string; query?: string; orderId?: number }): Promise<{ response: string; data?: any; suggestions?: string[] }> {
  let additionalContext = "";
  let actionData: any = null;
  let suggestions: string[] = ["Track my order", "Find products", "Become a seller"];
  const lastMessage = messages[messages.length - 1]?.content || "";
  const lower = lastMessage.toLowerCase();

  if (!action) {
    if (lower.match(/order.*#?\d+/) || lower.match(/#\d+/)) {
      const orderId = parseInt(lower.match(/\d+/)?.[0] || "0");
      if (orderId > 0) action = { type: "order_status", orderId };
    } else if (lower.includes("my order") || (lower.includes("track") && !lower.includes("track record"))) {
      action = { type: "my_orders" };
    } else {
      const searchTerms = extractSearchTerms(lastMessage);
      if (searchTerms) action = { type: "search_products", query: searchTerms };
    }
  }

  if (action?.type === "search_products" && action.query) {
    const searchResult = await aiSmartSearch({ query: action.query, pageSize: 8 });
    const products = searchResult.products;
    actionData = products;
    if (products.length > 0) {
      additionalContext = `\n\n═══ PRODUCTS IN OUR INVENTORY matching "${action.query}" ═══\n${products.map(p => `• ${p.name} — $${(p.priceCents/100).toFixed(2)} (${p.seller?.storeName})`).join("\n")}\n\nINSTRUCTION: You have real products above. Use your expertise to recommend the BEST options. Explain your reasoning. Be helpful and specific.`;
      suggestions = ["More options", "Recipe ideas", "Add to cart"];
    } else {
      additionalContext = `\n\nNo exact matches for "${action.query}" in inventory. Suggest alternatives or ask what they're trying to make/do.`;
      suggestions = ["Try different search", "Browse categories", "Ask for help"];
    }
  } else if (action?.type === "order_status" && action.orderId) {
    const order = await getOrderById(action.orderId, userId);
    actionData = order;
    if (order) {
      additionalContext = `\n\n═══ ORDER #${order.id} DETAILS ═══\nStatus: ${order.status.toUpperCase()}\nTotal: $${(order.totalAmountCents/100).toFixed(2)}\nStore: ${order.seller?.storeName} (${order.seller?.city}, ${order.seller?.state})\nItems: ${order.orderItems.map(i => i.product?.name).join(", ")}\nShipping to: ${order.shippingName}, ${order.shippingStreet}, ${order.shippingCity}, ${order.shippingState} ${order.shippingZip}\n${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : "Tracking: Will be available once shipped"}\nOrdered: ${new Date(order.createdAt).toLocaleDateString()}`;
      suggestions = ["Track shipment", "Return item", "Contact seller"];
    } else {
      additionalContext = `\nOrder #${action.orderId} not found. Ask customer to verify the order number.`;
      suggestions = ["Check email", "View all orders"];
    }
  } else if (action?.type === "my_orders") {
    if (userId) {
      const orders = await getUserOrders(userId);
      actionData = orders;
      if (orders.length > 0) {
        additionalContext = `\n\n═══ CUSTOMER'S ORDERS ═══\n${orders.map(o => `• Order #${o.id}: ${o.status.toUpperCase()} — $${(o.totalAmountCents/100).toFixed(2)} from ${o.seller?.storeName} (${new Date(o.createdAt).toLocaleDateString()})`).join("\n")}`;
        suggestions = orders.slice(0, 3).map(o => `Details #${o.id}`);
      } else {
        additionalContext = "\nCustomer has no orders yet. Encourage them to shop!";
        suggestions = ["Browse products", "View deals", "Popular items"];
      }
    } else {
      additionalContext = "\nCustomer is not logged in. They need to log in to view their orders.";
      suggestions = ["Log in", "Sign up", "Track by email"];
    }
  }

  const systemPrompt = await buildSystemContext(userId) + additionalContext;

  try {
    const response = await callGemini(systemPrompt, messages);
    return { response, data: actionData, suggestions };
  } catch (error: any) {
    console.error("AI Chat error:", error);
    return { response: "I'm having a brief issue. Please try again or email support@storesgo.com.", data: null, suggestions: ["Try again", "Email support"] };
  }
}

export { searchProducts, getUserOrders, getOrderById, getStoreStats };
