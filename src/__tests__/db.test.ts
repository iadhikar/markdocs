import fs from "fs";
import path from "path";

// Use a test-specific data directory to avoid polluting real data
const TEST_DATA_DIR = path.join(process.cwd(), "data-test");
const TEST_DB_FILE = path.join(TEST_DATA_DIR, "db.json");

// Mock the data directory before importing db module
jest.mock("fs", () => {
  const actual = jest.requireActual("fs");
  return {
    ...actual,
  };
});

// We'll test the db functions by manipulating files directly
// since the db module uses process.cwd() + "data"
import { getDb, saveDb, DbSchema, SpaceRow, DocumentRow } from "@/lib/db";

describe("Database Layer", () => {
  const dataDir = path.join(process.cwd(), "data");
  const dbFile = path.join(dataDir, "db.json");
  let originalDb: string | null = null;

  beforeAll(() => {
    // Backup existing db if present
    if (fs.existsSync(dbFile)) {
      originalDb = fs.readFileSync(dbFile, "utf-8");
    }
  });

  beforeEach(() => {
    // Remove db file to test fresh seeding
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  });

  afterAll(() => {
    // Restore original db
    if (originalDb) {
      fs.writeFileSync(dbFile, originalDb);
    } else if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  });

  describe("getDb", () => {
    it("should create a seeded database on first call", () => {
      const db = getDb();

      expect(db).toBeDefined();
      expect(db.spaces).toBeDefined();
      expect(db.documents).toBeDefined();
      expect(db.versions).toBeDefined();
      expect(db.nextVersionId).toBe(1);
    });

    it("should seed a default space", () => {
      const db = getDb();

      expect(db.spaces["default"]).toBeDefined();
      expect(db.spaces["default"].name).toBe("General");
      expect(db.spaces["default"].slug).toBe("general");
      expect(db.spaces["default"].icon).toBeTruthy();
    });

    it("should seed a welcome document", () => {
      const db = getDb();

      expect(db.documents["welcome"]).toBeDefined();
      expect(db.documents["welcome"].title).toBe("Welcome to Markdocs");
      expect(db.documents["welcome"].space_id).toBe("default");
      expect(db.documents["welcome"].is_template).toBe(0);
      expect(db.documents["welcome"].content).toContain("# Welcome to Markdocs");
    });

    it("should seed template documents", () => {
      const db = getDb();

      const templates = Object.values(db.documents).filter(
        (d) => d.is_template === 1
      );
      expect(templates.length).toBe(4);

      const templateNames = templates.map((t) => t.template_name);
      expect(templateNames).toContain("meeting-notes");
      expect(templateNames).toContain("rfc");
      expect(templateNames).toContain("adr");
      expect(templateNames).toContain("runbook");
    });

    it("should persist the seeded database to disk", () => {
      getDb();

      expect(fs.existsSync(dbFile)).toBe(true);
      const rawData = fs.readFileSync(dbFile, "utf-8");
      const parsed = JSON.parse(rawData);
      expect(parsed.spaces["default"]).toBeDefined();
    });

    it("should return existing database on subsequent calls", () => {
      const db1 = getDb();
      db1.spaces["test-space"] = {
        id: "test-space",
        name: "Test",
        slug: "test",
        description: null,
        icon: "T",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDb(db1);

      const db2 = getDb();
      expect(db2.spaces["test-space"]).toBeDefined();
      expect(db2.spaces["test-space"].name).toBe("Test");
    });
  });

  describe("saveDb", () => {
    it("should persist changes to disk", () => {
      const db = getDb();

      db.documents["test-doc"] = {
        id: "test-doc",
        space_id: "default",
        title: "Test Document",
        slug: "test-document",
        content: "# Test\nHello world",
        parent_id: null,
        position: 0,
        tags: '["test"]',
        share_id: null,
        is_template: 0,
        template_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDb(db);

      const reloaded = getDb();
      expect(reloaded.documents["test-doc"]).toBeDefined();
      expect(reloaded.documents["test-doc"].title).toBe("Test Document");
      expect(reloaded.documents["test-doc"].content).toBe("# Test\nHello world");
    });

    it("should handle version tracking", () => {
      const db = getDb();

      db.versions.push({
        id: db.nextVersionId++,
        document_id: "welcome",
        content: "old content",
        title: "old title",
        created_at: new Date().toISOString(),
      });
      saveDb(db);

      const reloaded = getDb();
      expect(reloaded.versions.length).toBe(1);
      expect(reloaded.versions[0].document_id).toBe("welcome");
      expect(reloaded.versions[0].content).toBe("old content");
      expect(reloaded.nextVersionId).toBe(2);
    });
  });

  describe("CRUD operations via db", () => {
    it("should create and delete a space", () => {
      const db = getDb();

      db.spaces["new-space"] = {
        id: "new-space",
        name: "New Space",
        slug: "new-space",
        description: "A test space",
        icon: "S",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDb(db);

      let reloaded = getDb();
      expect(Object.keys(reloaded.spaces).length).toBe(2); // default + new

      delete reloaded.spaces["new-space"];
      saveDb(reloaded);

      reloaded = getDb();
      expect(Object.keys(reloaded.spaces).length).toBe(1);
      expect(reloaded.spaces["new-space"]).toBeUndefined();
    });

    it("should create and update a document", () => {
      const db = getDb();

      db.documents["updatable"] = {
        id: "updatable",
        space_id: "default",
        title: "Original Title",
        slug: "original-title",
        content: "Original content",
        parent_id: null,
        position: 0,
        tags: "[]",
        share_id: null,
        is_template: 0,
        template_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDb(db);

      const db2 = getDb();
      db2.documents["updatable"].title = "Updated Title";
      db2.documents["updatable"].content = "Updated content";
      db2.documents["updatable"].updated_at = new Date().toISOString();
      saveDb(db2);

      const reloaded = getDb();
      expect(reloaded.documents["updatable"].title).toBe("Updated Title");
      expect(reloaded.documents["updatable"].content).toBe("Updated content");
    });

    it("should handle share IDs", () => {
      const db = getDb();

      expect(db.documents["welcome"].share_id).toBeNull();

      db.documents["welcome"].share_id = "share-abc123";
      saveDb(db);

      let reloaded = getDb();
      expect(reloaded.documents["welcome"].share_id).toBe("share-abc123");

      // Find by share_id
      const shared = Object.values(reloaded.documents).find(
        (d) => d.share_id === "share-abc123"
      );
      expect(shared).toBeDefined();
      expect(shared!.id).toBe("welcome");

      // Revoke
      reloaded.documents["welcome"].share_id = null;
      saveDb(reloaded);

      reloaded = getDb();
      expect(reloaded.documents["welcome"].share_id).toBeNull();
    });

    it("should support search by content and title", () => {
      const db = getDb();

      db.documents["searchable"] = {
        id: "searchable",
        space_id: "default",
        title: "Deployment Guide",
        slug: "deployment-guide",
        content: "# Deployment\nRun kubectl apply to deploy the service.",
        parent_id: null,
        position: 0,
        tags: '["devops", "k8s"]',
        share_id: null,
        is_template: 0,
        template_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDb(db);

      const reloaded = getDb();
      const query = "kubectl";
      const results = Object.values(reloaded.documents)
        .filter((d) => d.is_template === 0)
        .filter(
          (d) =>
            d.title.toLowerCase().includes(query) ||
            d.content.toLowerCase().includes(query) ||
            d.tags.toLowerCase().includes(query)
        );

      expect(results.length).toBe(1);
      expect(results[0].id).toBe("searchable");

      // Search by tag
      const tagResults = Object.values(reloaded.documents)
        .filter((d) => d.is_template === 0)
        .filter((d) => d.tags.toLowerCase().includes("k8s"));

      expect(tagResults.length).toBe(1);
      expect(tagResults[0].id).toBe("searchable");

      // Search by title
      const titleResults = Object.values(reloaded.documents)
        .filter((d) => d.is_template === 0)
        .filter((d) => d.title.toLowerCase().includes("deployment"));

      expect(titleResults.length).toBe(1);
    });

    it("should handle document deletion with version cleanup", () => {
      const db = getDb();

      db.documents["to-delete"] = {
        id: "to-delete",
        space_id: "default",
        title: "To Delete",
        slug: "to-delete",
        content: "Will be deleted",
        parent_id: null,
        position: 0,
        tags: "[]",
        share_id: null,
        is_template: 0,
        template_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.versions.push({
        id: db.nextVersionId++,
        document_id: "to-delete",
        content: "old version",
        title: "To Delete",
        created_at: new Date().toISOString(),
      });
      saveDb(db);

      const db2 = getDb();
      delete db2.documents["to-delete"];
      db2.versions = db2.versions.filter((v) => v.document_id !== "to-delete");
      saveDb(db2);

      const reloaded = getDb();
      expect(reloaded.documents["to-delete"]).toBeUndefined();
      expect(
        reloaded.versions.filter((v) => v.document_id === "to-delete").length
      ).toBe(0);
    });
  });

  describe("Template functionality", () => {
    it("should be able to use a template to create a new document", () => {
      const db = getDb();

      const rfcTemplate = db.documents["tpl-rfc"];
      expect(rfcTemplate).toBeDefined();
      expect(rfcTemplate.is_template).toBe(1);

      // Simulate creating a doc from template
      db.documents["new-rfc"] = {
        id: "new-rfc",
        space_id: "default",
        title: "RFC: New Feature",
        slug: "rfc-new-feature",
        content: rfcTemplate.content, // Copy template content
        parent_id: null,
        position: 0,
        tags: '["rfc"]',
        share_id: null,
        is_template: 0,
        template_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDb(db);

      const reloaded = getDb();
      expect(reloaded.documents["new-rfc"]).toBeDefined();
      expect(reloaded.documents["new-rfc"].content).toContain("# RFC:");
      expect(reloaded.documents["new-rfc"].is_template).toBe(0);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty content", () => {
      const db = getDb();

      db.documents["empty"] = {
        id: "empty",
        space_id: "default",
        title: "Empty Doc",
        slug: "empty-doc",
        content: "",
        parent_id: null,
        position: 0,
        tags: "[]",
        share_id: null,
        is_template: 0,
        template_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDb(db);

      const reloaded = getDb();
      expect(reloaded.documents["empty"].content).toBe("");
    });

    it("should handle special characters in content", () => {
      const db = getDb();

      const specialContent =
        '# Special chars\n\nQuotes: "hello" \'world\'\nBackslash: \\\nUnicode: \u00e9\u00e0\u00fc\u00f1\nEmoji: \u{1F680}\nCode: `const x = {"key": "val"}`';

      db.documents["special"] = {
        id: "special",
        space_id: "default",
        title: "Special Characters",
        slug: "special-characters",
        content: specialContent,
        parent_id: null,
        position: 0,
        tags: "[]",
        share_id: null,
        is_template: 0,
        template_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDb(db);

      const reloaded = getDb();
      expect(reloaded.documents["special"].content).toBe(specialContent);
    });

    it("should handle multiple spaces with documents", () => {
      const db = getDb();

      db.spaces["engineering"] = {
        id: "engineering",
        name: "Engineering",
        slug: "engineering",
        description: "Engineering docs",
        icon: "E",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      db.documents["eng-doc"] = {
        id: "eng-doc",
        space_id: "engineering",
        title: "Eng Doc",
        slug: "eng-doc",
        content: "Engineering document",
        parent_id: null,
        position: 0,
        tags: "[]",
        share_id: null,
        is_template: 0,
        template_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDb(db);

      const reloaded = getDb();

      // Filter docs by space
      const defaultDocs = Object.values(reloaded.documents).filter(
        (d) => d.space_id === "default" && d.is_template === 0
      );
      const engDocs = Object.values(reloaded.documents).filter(
        (d) => d.space_id === "engineering" && d.is_template === 0
      );

      expect(defaultDocs.length).toBeGreaterThanOrEqual(1);
      expect(engDocs.length).toBe(1);
      expect(engDocs[0].title).toBe("Eng Doc");
    });
  });
});
