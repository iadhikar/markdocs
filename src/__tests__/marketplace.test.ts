import fs from "fs";
import path from "path";
import { getDb, saveDb } from "@/lib/db";

describe("Marketplace", () => {
  const dataDir = path.join(process.cwd(), "data");
  const dbFile = path.join(dataDir, "db.json");
  let originalDb: string | null = null;

  beforeAll(() => {
    if (fs.existsSync(dbFile)) {
      originalDb = fs.readFileSync(dbFile, "utf-8");
    }
  });

  beforeEach(() => {
    if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  });

  afterAll(() => {
    if (originalDb) {
      fs.writeFileSync(dbFile, originalDb);
    } else if (fs.existsSync(dbFile)) {
      fs.unlinkSync(dbFile);
    }
  });

  describe("Seed data", () => {
    it("should seed marketplace listings", () => {
      const db = getDb();
      const listings = Object.values(db.listings);
      expect(listings.length).toBeGreaterThanOrEqual(5);
    });

    it("should have free and paid listings", () => {
      const db = getDb();
      const listings = Object.values(db.listings);
      const free = listings.filter((l) => l.price_cents === 0);
      const paid = listings.filter((l) => l.price_cents > 0);
      expect(free.length).toBeGreaterThan(0);
      expect(paid.length).toBeGreaterThan(0);
    });

    it("should have all required fields on listings", () => {
      const db = getDb();
      const listing = Object.values(db.listings)[0];
      expect(listing.id).toBeTruthy();
      expect(listing.seller_name).toBeTruthy();
      expect(listing.title).toBeTruthy();
      expect(listing.description).toBeTruthy();
      expect(listing.content).toBeTruthy();
      expect(listing.preview).toBeTruthy();
      expect(listing.category).toBeTruthy();
      expect(typeof listing.price_cents).toBe("number");
      expect(typeof listing.downloads).toBe("number");
    });

    it("should have empty orders initially", () => {
      const db = getDb();
      expect(db.orders).toEqual([]);
    });
  });

  describe("CRUD operations", () => {
    it("should create a new listing", () => {
      const db = getDb();
      const id = "lst-test-new";
      db.listings[id] = {
        id,
        seller_name: "TestSeller",
        title: "Test Document",
        description: "A test document for sale",
        price_cents: 999,
        content: "# Test\n\nThis is test content.",
        preview: "# Test\n\nThis is test content.",
        tags: '["test"]',
        category: "general",
        downloads: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      saveDb(db);

      const reloaded = getDb();
      expect(reloaded.listings[id]).toBeDefined();
      expect(reloaded.listings[id].title).toBe("Test Document");
      expect(reloaded.listings[id].price_cents).toBe(999);
    });

    it("should delete a listing", () => {
      const db = getDb();
      const listingIds = Object.keys(db.listings);
      expect(listingIds.length).toBeGreaterThan(0);

      const toDelete = listingIds[0];
      delete db.listings[toDelete];
      saveDb(db);

      const reloaded = getDb();
      expect(reloaded.listings[toDelete]).toBeUndefined();
    });

    it("should record an order for a free listing", () => {
      const db = getDb();
      const freeListing = Object.values(db.listings).find((l) => l.price_cents === 0);
      expect(freeListing).toBeDefined();

      db.orders.push({
        id: "ord-test-1",
        listing_id: freeListing!.id,
        buyer_email: "test@example.com",
        amount_cents: 0,
        stripe_session_id: null,
        status: "free",
        created_at: new Date().toISOString(),
      });
      freeListing!.downloads++;
      saveDb(db);

      const reloaded = getDb();
      expect(reloaded.orders.length).toBe(1);
      expect(reloaded.orders[0].status).toBe("free");
      expect(reloaded.orders[0].buyer_email).toBe("test@example.com");
    });

    it("should record a pending order for a paid listing", () => {
      const db = getDb();
      const paidListing = Object.values(db.listings).find((l) => l.price_cents > 0);
      expect(paidListing).toBeDefined();

      db.orders.push({
        id: "ord-test-2",
        listing_id: paidListing!.id,
        buyer_email: "buyer@example.com",
        amount_cents: paidListing!.price_cents,
        stripe_session_id: "sim_test123",
        status: "pending",
        created_at: new Date().toISOString(),
      });
      saveDb(db);

      const reloaded = getDb();
      const order = reloaded.orders.find((o) => o.id === "ord-test-2");
      expect(order).toBeDefined();
      expect(order!.status).toBe("pending");
      expect(order!.amount_cents).toBe(paidListing!.price_cents);
    });

    it("should complete a pending order", () => {
      const db = getDb();
      const paidListing = Object.values(db.listings).find((l) => l.price_cents > 0);

      db.orders.push({
        id: "ord-complete-test",
        listing_id: paidListing!.id,
        buyer_email: "complete@example.com",
        amount_cents: paidListing!.price_cents,
        stripe_session_id: "sim_complete",
        status: "pending",
        created_at: new Date().toISOString(),
      });
      saveDb(db);

      // Simulate webhook completing the order
      const db2 = getDb();
      const order = db2.orders.find((o) => o.id === "ord-complete-test");
      expect(order).toBeDefined();
      order!.status = "completed";
      const listing = db2.listings[order!.listing_id];
      if (listing) listing.downloads++;
      saveDb(db2);

      const reloaded = getDb();
      const completedOrder = reloaded.orders.find((o) => o.id === "ord-complete-test");
      expect(completedOrder!.status).toBe("completed");
    });
  });

  describe("Marketplace search via BM25", () => {
    it("should find listings by content relevance", () => {
      const db = getDb();
      const { BM25Index } = require("@/lib/search");
      const index = new BM25Index();

      const docs = Object.values(db.listings).map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.id,
        space_id: "marketplace",
        content: l.description + " " + l.content,
        tags: l.tags,
      }));

      index.index(docs);
      const results = index.search("API design REST");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain("API");
    });

    it("should find incident response docs", () => {
      const db = getDb();
      const { BM25Index } = require("@/lib/search");
      const index = new BM25Index();

      const docs = Object.values(db.listings).map((l) => ({
        id: l.id,
        title: l.title,
        slug: l.id,
        space_id: "marketplace",
        content: l.description + " " + l.content,
        tags: l.tags,
      }));

      index.index(docs);
      const results = index.search("how to handle production incidents");
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
