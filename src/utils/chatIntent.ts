export type ChatIntent = 'greeting' | 'thanks' | 'irrelevant' | 'standard';

/** Detect casual openers — Hi, how are you, what's happened today, etc. */
export function detectChatIntent(query: string): ChatIntent {
  const raw = query.trim();
  if (!raw) return 'standard';

  const q = raw.toLowerCase().replace(/[!?.،]/g, '').trim();

  if (/^(thanks|thank you|thx|cheers|شكرا|شكراً)/.test(q)) return 'thanks';

  if (
    /^(hi|hello|hey|yo|hiya|good morning|good afternoon|good evening|how are you|how r u|how are u|how ru|howru|how r|wassup|whats up|what s up|sup|salam|marhaba|السلام|مرحبا|مرحباً|كيف حالك|كيف الحال)$/.test(
      q,
    )
  ) {
    return 'greeting';
  }

  if (/^(hi|hello|hey)\b/.test(q) && q.length < 48) return 'greeting';

  // All "how are you" variants including typos
  if (/\bhow (are|r) (you|u|yu)\b/.test(q) && q.length < 72) return 'greeting';
  if (/^how(ru|r u|are u|areyu|areyou)$/.test(q)) return 'greeting';

  if (
    /\b(what happened today|what s happened today|whats happened today|how is my day|what s on today|whats on today|catch me up|brief me on today)\b/.test(
      q,
    )
  ) {
    return 'greeting';
  }

  // All other queries (including general knowledge) pass through as standard
  // so Claude can answer from Tier 3 general knowledge instead of refusing
  return 'standard';
}

/**
 * Detect queries that are clearly outside the CSO assistant's scope:
 * personal entertainment, cooking, sports, general knowledge trivia, etc.
 */
export function isIrrelevantQuery(q: string): boolean {
  // Must NOT contain any CSO-relevant keywords
  const relevant = /\b(strategy|market|regulat|policy|adgm|fsra|abu dhabi|falcon|stakeholder|invest|sector|capital|financial|briefing|meeting|draft|memo|speech|performance|kpi|department|benchmark|digital asset|fintech|fund|compliance|board|executive|minister|governance)\b/;
  if (relevant.test(q)) return false;

  // Check for clearly off-topic patterns
  const offTopic =
    /\b(recipe|cook|food|dinner|lunch|breakfast|restaurant|movie|film|series|netflix|sport|football|cricket|basketball|soccer|weather|temperature|joke|poem|story|song|music|celebrity|actor|actress|game|gaming|horoscope|zodiac|lottery|casino|fashion|clothes|shopping|travel destination|holiday|vacation|anime|manga|comic)\b/.test(q) ||
    /^(what is \d|calculate|convert \d|how many (days|km|miles|calories)|translate .{0,30} to (french|spanish|italian|german|japanese|chinese|korean))\b/.test(q) ||
    /^(tell me a joke|write me a poem|write a story|give me a recipe|what is the capital of|who won the|what year was)\b/.test(q);

  return offTopic;
}

export function isConversationalTurn(query: string): boolean {
  return detectChatIntent(query) !== 'standard';
}
