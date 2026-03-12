import { BM25Index, tokenize } from "@/lib/search";

describe("Tokenizer", () => {
  it("should lowercase and split text", () => {
    const tokens = tokenize("Hello World Test");
    expect(tokens).toContain("hello");
    expect(tokens).toContain("world");
    expect(tokens).toContain("test");
  });

  it("should remove stop words", () => {
    const tokens = tokenize("the quick brown fox is a very good animal");
    expect(tokens).not.toContain("the");
    expect(tokens).not.toContain("is");
    expect(tokens).not.toContain("a");
    expect(tokens).not.toContain("very");
    expect(tokens).toContain("quick");
    expect(tokens).toContain("brown");
    expect(tokens).toContain("fox");
  });

  it("should stem common suffixes", () => {
    const tokens = tokenize("running deploying deployed services");
    expect(tokens).toContain("runn");
    expect(tokens).toContain("deploy");
    expect(tokens).toContain("deploy");
    expect(tokens).toContain("servic");
  });

  it("should remove special characters", () => {
    const tokens = tokenize("hello-world foo_bar baz@qux");
    expect(tokens).toContain("hello");
    expect(tokens).toContain("world");
  });

  it("should filter out single-char tokens", () => {
    const tokens = tokenize("I a x hello");
    expect(tokens).not.toContain("x");
    expect(tokens).toContain("hello");
  });
});

describe("BM25Index", () => {
  let index: BM25Index;

  const docs = [
    {
      id: "doc1",
      title: "Kubernetes Deployment Guide",
      slug: "k8s-deployment",
      space_id: "default",
      content: "This guide covers deploying applications to Kubernetes clusters using kubectl and Helm charts.",
      tags: '["kubernetes", "deployment", "devops"]',
    },
    {
      id: "doc2",
      title: "REST API Design Patterns",
      slug: "api-design",
      space_id: "default",
      content: "Learn how to design RESTful APIs with proper resource naming, HTTP methods, status codes, and pagination.",
      tags: '["api", "rest", "design"]',
    },
    {
      id: "doc3",
      title: "Meeting Notes Template",
      slug: "meeting-notes",
      space_id: "default",
      content: "A template for recording meeting attendees, agenda items, discussion notes, and action items.",
      tags: '["meeting", "template"]',
    },
    {
      id: "doc4",
      title: "Incident Response Runbook",
      slug: "incident-response",
      space_id: "default",
      content: "Step by step guide for handling production incidents. Includes severity levels, escalation paths, and post-mortem templates.",
      tags: '["incident", "sre", "operations"]',
    },
    {
      id: "doc5",
      title: "TypeScript Best Practices",
      slug: "typescript-best",
      space_id: "default",
      content: "Best practices for TypeScript development including type safety, generics, utility types, and design patterns.",
      tags: '["typescript", "javascript", "coding"]',
    },
  ];

  beforeEach(() => {
    index = new BM25Index();
    index.index(docs);
  });

  it("should return results for matching queries", () => {
    const results = index.search("kubernetes deployment");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("doc1");
  });

  it("should rank title matches higher", () => {
    const results = index.search("API design");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("doc2");
  });

  it("should return empty for no matches", () => {
    const results = index.search("quantum physics blockchain");
    expect(results.length).toBe(0);
  });

  it("should return empty for empty query", () => {
    const results = index.search("");
    expect(results.length).toBe(0);
  });

  it("should return empty for stop-words-only query", () => {
    const results = index.search("the and or");
    expect(results.length).toBe(0);
  });

  it("should find documents by tag content", () => {
    const results = index.search("devops operations");
    expect(results.length).toBeGreaterThan(0);
    const ids = results.map((r) => r.id);
    expect(ids).toContain("doc1"); // has devops tag
    expect(ids).toContain("doc4"); // has operations tag
  });

  it("should provide relevance scores", () => {
    const results = index.search("kubernetes deployment");
    expect(results[0].score).toBeGreaterThan(0);
    // First result should have higher score than others
    if (results.length > 1) {
      expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
    }
  });

  it("should provide matched terms", () => {
    const results = index.search("API design patterns");
    expect(results[0].matchedTerms.length).toBeGreaterThan(0);
  });

  it("should provide snippets", () => {
    const results = index.search("kubernetes");
    expect(results[0].snippet).toBeTruthy();
    expect(results[0].snippet.length).toBeGreaterThan(0);
  });

  it("should handle prompt-style queries", () => {
    const results = index.search("how to handle production incidents");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("doc4");
  });

  it("should handle partial word matches via stemming", () => {
    const results = index.search("deploying applications");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("doc1");
  });

  it("should respect maxResults", () => {
    const results = index.search("guide", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("should find typescript related docs", () => {
    const results = index.search("typescript type safety generics");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id).toBe("doc5");
  });
});
