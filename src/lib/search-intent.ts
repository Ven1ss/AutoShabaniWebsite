/**
 * Compatibility surface for intent APIs.
 * Implementation lives in search-understanding.ts (attribute-aware).
 */

export {
  detectProductIntent,
  intentSearchQueries,
  passesStrictRelevance,
  productMatchesIntent,
  type ProductIntent,
} from "@/lib/search-understanding";
