// BM25 Search Engine - zero dependencies, pure TypeScript
// BM25 is the algorithm behind Elasticsearch/Lucene

const STOP_WORDS = new Set([
  "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "this", "that", "are", "was",
  "were", "be", "been", "being", "have", "has", "had", "do", "does",
  "did", "will", "would", "could", "should", "may", "might", "shall",
  "can", "not", "no", "so", "if", "then", "than", "too", "very", "just",
  "about", "above", "after", "again", "all", "also", "am", "any", "as",
  "because", "before", "between", "both", "each", "few", "get", "got",
  "he", "her", "here", "him", "his", "how", "i", "into", "its", "let",
  "me", "more", "most", "my", "new", "now", "only", "other", "our",
  "out", "own", "said", "same", "she", "some", "still", "such", "take",
  "tell", "their", "them", "there", "these", "they", "thing", "those",
  "through", "under", "up", "us", "use", "want", "way", "we", "well",
  "what", "when", "where", "which", "while", "who", "why", "you", "your",
]);

// Simple English stemmer (suffix stripping)
function stem(word: string): string {
  if (word.length < 4) return word;
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("ing") && word.length > 5) return word.slice(0, -3);
  if (word.endsWith("tion")) return word.slice(0, -4);
  if (word.endsWith("ness")) return word.slice(0, -4);
  if (word.endsWith("ment")) return word.slice(0, -4);
  if (word.endsWith("able")) return word.slice(0, -4);
  if (word.endsWith("ful")) return word.slice(0, -3);
  if (word.endsWith("less")) return word.slice(0, -4);
  if (word.endsWith("ly")) return word.slice(0, -2);
  if (word.endsWith("ed") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("er") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss") && word.length > 3) return word.slice(0, -1);
  return word;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    .map(stem);
}

// Term frequency: how often a term appears in a document
function termFrequency(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const token of tokens) {
    tf.set(token, (tf.get(token) || 0) + 1);
  }
  return tf;
}

export interface IndexedDocument {
  id: string;
  title: string;
  slug: string;
  space_id: string;
  content: string;
  tags: string;
  titleTokens: string[];
  contentTokens: string[];
  tagTokens: string[];
  titleTF: Map<string, number>;
  contentTF: Map<string, number>;
  tagTF: Map<string, number>;
  totalTokens: number;
}

export interface BM25Result {
  id: string;
  title: string;
  slug: string;
  space_id: string;
  score: number;
  snippet: string;
  matchedTerms: string[];
}

// BM25 parameters
const K1 = 1.5; // term frequency saturation
const B = 0.75; // document length normalization
const TITLE_BOOST = 3.0;
const TAG_BOOST = 2.0;
const CONTENT_BOOST = 1.0;

export class BM25Index {
  private documents: IndexedDocument[] = [];
  private avgDocLength = 0;
  private docCount = 0;
  // IDF cache: how many documents contain each term
  private documentFrequency = new Map<string, number>();

  index(docs: { id: string; title: string; slug: string; space_id: string; content: string; tags: string }[]) {
    this.documents = [];
    this.documentFrequency.clear();

    const allTerms = new Set<string>();

    for (const doc of docs) {
      const titleTokens = tokenize(doc.title);
      const contentTokens = tokenize(doc.content);
      const tagTokens = tokenize(doc.tags);

      const indexed: IndexedDocument = {
        ...doc,
        titleTokens,
        contentTokens,
        tagTokens,
        titleTF: termFrequency(titleTokens),
        contentTF: termFrequency(contentTokens),
        tagTF: termFrequency(tagTokens),
        totalTokens: titleTokens.length + contentTokens.length + tagTokens.length,
      };

      this.documents.push(indexed);

      // Collect unique terms per document for DF
      const docTermsArr = Array.from(new Set([...titleTokens, ...contentTokens, ...tagTokens]));
      for (let i = 0; i < docTermsArr.length; i++) {
        const term = docTermsArr[i];
        allTerms.add(term);
        this.documentFrequency.set(term, (this.documentFrequency.get(term) || 0) + 1);
      }
    }

    this.docCount = this.documents.length;
    this.avgDocLength =
      this.docCount > 0
        ? this.documents.reduce((sum, d) => sum + d.totalTokens, 0) / this.docCount
        : 0;
  }

  search(query: string, maxResults = 10): BM25Result[] {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const scores: { doc: IndexedDocument; score: number; matchedTerms: string[] }[] = [];

    for (const doc of this.documents) {
      let score = 0;
      const matchedTerms: string[] = [];

      for (const term of queryTokens) {
        const df = this.documentFrequency.get(term) || 0;
        if (df === 0) continue;

        // IDF: inverse document frequency
        const idf = Math.log((this.docCount - df + 0.5) / (df + 0.5) + 1);

        // Title score
        const titleTF = doc.titleTF.get(term) || 0;
        if (titleTF > 0) {
          const titleLen = doc.titleTokens.length;
          const titleNorm = titleTF * (K1 + 1) / (titleTF + K1 * (1 - B + B * titleLen / Math.max(this.avgDocLength, 1)));
          score += idf * titleNorm * TITLE_BOOST;
          if (!matchedTerms.includes(term)) matchedTerms.push(term);
        }

        // Content score
        const contentTF = doc.contentTF.get(term) || 0;
        if (contentTF > 0) {
          const contentLen = doc.contentTokens.length;
          const contentNorm = contentTF * (K1 + 1) / (contentTF + K1 * (1 - B + B * contentLen / Math.max(this.avgDocLength, 1)));
          score += idf * contentNorm * CONTENT_BOOST;
          if (!matchedTerms.includes(term)) matchedTerms.push(term);
        }

        // Tag score
        const tagTF = doc.tagTF.get(term) || 0;
        if (tagTF > 0) {
          const tagLen = doc.tagTokens.length;
          const tagNorm = tagTF * (K1 + 1) / (tagTF + K1 * (1 - B + B * tagLen / Math.max(this.avgDocLength, 1)));
          score += idf * tagNorm * TAG_BOOST;
          if (!matchedTerms.includes(term)) matchedTerms.push(term);
        }
      }

      if (score > 0) {
        scores.push({ doc, score, matchedTerms });
      }
    }

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    return scores.slice(0, maxResults).map(({ doc, score, matchedTerms }) => ({
      id: doc.id,
      title: doc.title,
      slug: doc.slug,
      space_id: doc.space_id,
      score: Math.round(score * 100) / 100,
      snippet: extractSnippet(doc.content, queryTokens),
      matchedTerms,
    }));
  }
}

function extractSnippet(content: string, queryTokens: string[]): string {
  const lower = content.toLowerCase();
  let bestIdx = -1;
  let bestScore = 0;

  // Slide a window and find the region with most query term matches
  const words = content.split(/\s+/);
  const windowSize = 30; // words

  for (let i = 0; i < words.length; i++) {
    const window = words.slice(i, i + windowSize).join(" ").toLowerCase();
    let windowScore = 0;
    for (const token of queryTokens) {
      if (window.includes(token)) windowScore++;
    }
    if (windowScore > bestScore) {
      bestScore = windowScore;
      bestIdx = i;
    }
  }

  if (bestIdx >= 0) {
    const snippetWords = words.slice(bestIdx, bestIdx + windowSize);
    const prefix = bestIdx > 0 ? "..." : "";
    const suffix = bestIdx + windowSize < words.length ? "..." : "";
    return prefix + snippetWords.join(" ") + suffix;
  }

  // Fallback: first 150 chars
  return content.substring(0, 150) + (content.length > 150 ? "..." : "");
}

// Singleton index instance
let indexInstance: BM25Index | null = null;

export function getSearchIndex(): BM25Index {
  if (!indexInstance) {
    indexInstance = new BM25Index();
  }
  return indexInstance;
}

export function invalidateSearchIndex(): void {
  indexInstance = null;
}
