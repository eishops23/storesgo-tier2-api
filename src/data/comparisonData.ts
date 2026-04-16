/**
 * StoresGo vs Competitors - Comparison Pages
 * Capture competitor search traffic
 */

export interface ComparisonData {
  slug: string;
  competitor: string;
  competitorLogo?: string;
  tagline: string;
  title: string;
  metaDescription: string;
  advantages: { feature: string; storesgo: string; competitor: string; winner: "storesgo" | "competitor" | "tie" }[];
  summary: string;
  cta: string;
}

export const COMPARISONS: ComparisonData[] = [
  {
    slug: "instacart",
    competitor: "Instacart",
    tagline: "Why ethnic grocery stores choose StoresGo over Instacart",
    title: "StoresGo vs Instacart for Ethnic Grocery Delivery | 2025 Comparison",
    metaDescription: "Compare StoresGo vs Instacart for ethnic grocery delivery. See why Caribbean, Latin, and Asian grocery stores prefer StoresGo's specialized marketplace.",
    advantages: [
      { feature: "Commission Rate", storesgo: "Lower commissions designed for ethnic grocers", competitor: "Up to 15% + payment processing fees", winner: "storesgo" },
      { feature: "Ethnic Food Expertise", storesgo: "Built specifically for Caribbean, Latin, Asian, African foods", competitor: "General grocery focus", winner: "storesgo" },
      { feature: "Cultural Marketing", storesgo: "Targeted marketing to diaspora communities", competitor: "Generic marketing", winner: "storesgo" },
      { feature: "Product Catalog", storesgo: "Specialized ethnic product database", competitor: "May miss niche ethnic items", winner: "storesgo" },
      { feature: "Delivery Coverage", storesgo: "South Florida focus with local expertise", competitor: "Nationwide but less specialized", winner: "tie" },
      { feature: "Customer Base", storesgo: "Customers specifically seeking ethnic foods", competitor: "General grocery shoppers", winner: "storesgo" }
    ],
    summary: "StoresGo is purpose-built for ethnic grocery stores, offering lower fees, better cultural marketing, and a customer base actively seeking Caribbean, Latin, Asian, and African foods.",
    cta: "Join StoresGo and reach customers who appreciate authentic ethnic groceries"
  },
  {
    slug: "doordash",
    competitor: "DoorDash",
    tagline: "The ethnic grocery alternative to DoorDash",
    title: "StoresGo vs DoorDash for Ethnic Grocery Stores | 2025 Comparison",
    metaDescription: "Compare StoresGo vs DoorDash for ethnic grocery delivery. Discover why specialized ethnic grocers prefer StoresGo's marketplace approach.",
    advantages: [
      { feature: "Focus", storesgo: "100% grocery-focused platform", competitor: "Primarily restaurant delivery", winner: "storesgo" },
      { feature: "Commission Rate", storesgo: "Competitive grocery rates", competitor: "High restaurant-style commissions", winner: "storesgo" },
      { feature: "Grocery Expertise", storesgo: "Built for grocery operations", competitor: "Adapted from restaurant model", winner: "storesgo" },
      { feature: "Ethnic Specialization", storesgo: "Caribbean, Latin, Asian, African focus", competitor: "No ethnic specialty", winner: "storesgo" },
      { feature: "Brand Recognition", storesgo: "Growing ethnic food brand", competitor: "Major national brand", winner: "competitor" },
      { feature: "Customer Intent", storesgo: "Customers want ethnic groceries", competitor: "Mixed intent shoppers", winner: "storesgo" }
    ],
    summary: "While DoorDash has brand recognition, StoresGo offers a dedicated grocery platform built specifically for ethnic food stores with customers who are actively seeking authentic international ingredients.",
    cta: "Switch to a platform built for ethnic grocery success"
  },
  {
    slug: "ubereats",
    competitor: "Uber Eats",
    tagline: "Purpose-built for ethnic grocers, not adapted from rides",
    title: "StoresGo vs Uber Eats for Ethnic Grocery Delivery | 2025 Comparison",
    metaDescription: "Compare StoresGo vs Uber Eats for ethnic grocery stores. See why dedicated ethnic grocery marketplace beats general delivery platforms.",
    advantages: [
      { feature: "Platform Purpose", storesgo: "Built for ethnic grocery from day one", competitor: "Adapted from ride-sharing/restaurants", winner: "storesgo" },
      { feature: "Fee Structure", storesgo: "Grocery-friendly pricing", competitor: "Restaurant-style high fees", winner: "storesgo" },
      { feature: "Cultural Understanding", storesgo: "Team understands ethnic food culture", competitor: "Generic platform approach", winner: "storesgo" },
      { feature: "Catalog Management", storesgo: "Ethnic product categories", competitor: "General grocery categories", winner: "storesgo" },
      { feature: "Delivery Network", storesgo: "Local South Florida focus", competitor: "Large national network", winner: "tie" },
      { feature: "Customer Demographics", storesgo: "Diaspora communities", competitor: "General population", winner: "storesgo" }
    ],
    summary: "Uber Eats offers broad reach but lacks the ethnic food expertise and community connections that StoresGo provides. Our platform is designed specifically for the unique needs of ethnic grocery stores.",
    cta: "Join the platform that understands ethnic grocery"
  },
  {
    slug: "caribshopper",
    competitor: "CaribShopper",
    tagline: "The next-generation Caribbean grocery platform",
    title: "StoresGo vs CaribShopper | Caribbean Grocery Comparison 2025",
    metaDescription: "Compare StoresGo vs CaribShopper for Caribbean grocery delivery. Discover StoresGo's multi-cuisine marketplace advantage.",
    advantages: [
      { feature: "Cuisine Coverage", storesgo: "Caribbean + Latin + Asian + African", competitor: "Caribbean-focused only", winner: "storesgo" },
      { feature: "Platform Technology", storesgo: "Modern Next.js + AI-powered search", competitor: "Traditional e-commerce", winner: "storesgo" },
      { feature: "Local Presence", storesgo: "South Florida based with local stores", competitor: "Ships from various locations", winner: "storesgo" },
      { feature: "Delivery Speed", storesgo: "Same-day local delivery", competitor: "Standard shipping times", winner: "storesgo" },
      { feature: "Caribbean Selection", storesgo: "Comprehensive Caribbean foods", competitor: "Strong Caribbean focus", winner: "tie" },
      { feature: "Seller Tools", storesgo: "Full dashboard + analytics", competitor: "Basic seller tools", winner: "storesgo" }
    ],
    summary: "While CaribShopper focuses on Caribbean foods, StoresGo offers a broader multi-cuisine marketplace with modern technology, local same-day delivery, and comprehensive seller tools.",
    cta: "Upgrade to the next-generation ethnic grocery platform"
  },
  {
    slug: "weee",
    competitor: "Weee!",
    tagline: "More than Asian groceries - a complete ethnic marketplace",
    title: "StoresGo vs Weee! for Ethnic Grocery | 2025 Comparison",
    metaDescription: "Compare StoresGo vs Weee! for ethnic grocery shopping. StoresGo offers Caribbean, Latin, Asian, and African foods with local delivery.",
    advantages: [
      { feature: "Cuisine Diversity", storesgo: "Caribbean, Latin, Asian, African, Middle Eastern", competitor: "Primarily Asian focus", winner: "storesgo" },
      { feature: "Local Stores", storesgo: "Partner with local ethnic grocers", competitor: "Centralized warehouse model", winner: "storesgo" },
      { feature: "Caribbean Foods", storesgo: "Comprehensive Caribbean selection", competitor: "Limited Caribbean options", winner: "storesgo" },
      { feature: "Latin Foods", storesgo: "Full Latin American coverage", competitor: "Minimal Latin selection", winner: "storesgo" },
      { feature: "Asian Foods", storesgo: "Good Asian selection", competitor: "Extensive Asian catalog", winner: "competitor" },
      { feature: "South Florida", storesgo: "Local focus and expertise", competitor: "National with less local focus", winner: "storesgo" }
    ],
    summary: "Weee! excels at Asian groceries, but StoresGo offers the complete ethnic food experience with Caribbean, Latin, African, and Asian foods from local stores with same-day delivery.",
    cta: "Experience the complete ethnic grocery marketplace"
  }
];

export function getComparison(slug: string): ComparisonData | undefined {
  return COMPARISONS.find(c => c.slug === slug);
}

export default { COMPARISONS, getComparison };
