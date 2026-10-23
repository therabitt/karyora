/* eslint-disable @typescript-eslint/no-require-imports */
const crypto = require("crypto");
const assert = require("node:assert");
const { z } = require("zod");

// Replicate domain inquirySubmissionSchema
const inquirySubmissionSchema = z.object({
  client_name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  client_email: z
    .string()
    .trim()
    .email("A valid email address is required")
    .max(254, "Email must be 254 characters or less"),
  offering_id: z
    .string()
    .trim()
    .max(100)
    .nullable()
    .optional(),
  description: z
    .string()
    .trim()
    .min(20, "Project brief must be at least 20 characters")
    .max(4000, "Project brief must be 4,000 characters or less"),
  budget_amount: z
    .number()
    .nonnegative("Budget must be non-negative")
    .nullable()
    .optional(),
  budget_currency: z.string().length(3).default("IDR"),
  desired_deadline: z.string().nullable().optional(),
  hp_website_contact: z.string().max(0, "Invalid submission detected").optional(),
});

function hashClientIdentifier(identifier, secret = "test-rate-limit-secret") {
  return crypto.createHmac("sha256", secret).update(identifier).digest("hex");
}

function getCurrentWindowStart(now = new Date()) {
  const windowMs = 15 * 60 * 1000;
  const windowStartTime = Math.floor(now.getTime() / windowMs) * windowMs;
  return new Date(windowStartTime).toISOString();
}

function runTests() {
  console.log("Starting Commission Inquiry Validation & Rate Limit Tests...");

  // Test 1: Valid submission input
  const validSubmission = {
    client_name: "Maya Lin",
    client_email: "maya.lin@example.com",
    offering_id: crypto.randomUUID(),
    description: "Looking for a full-body portrait illustration of an original character with atmospheric lighting.",
    budget_amount: 1500000,
    budget_currency: "IDR",
    desired_deadline: "2026-11-30",
  };
  const validResult = inquirySubmissionSchema.safeParse(validSubmission);
  assert(validResult.success, "Valid submission should pass schema validation");
  console.log("✓ Valid submission schema validation passed");

  // Test 2: Brief too short (< 20 characters)
  const shortBriefSubmission = {
    ...validSubmission,
    description: "Draw my OC please",
  };
  const shortResult = inquirySubmissionSchema.safeParse(shortBriefSubmission);
  assert(!shortResult.success, "Short description should be rejected");
  assert(
    shortResult.error.flatten().fieldErrors.description[0].includes("at least 20 characters"),
    "Should explain minimum character requirement"
  );
  console.log("✓ Short description rejection verified (< 20 chars)");

  // Test 3: Invalid email
  const invalidEmailSubmission = {
    ...validSubmission,
    client_email: "not-an-email",
  };
  const emailResult = inquirySubmissionSchema.safeParse(invalidEmailSubmission);
  assert(!emailResult.success, "Invalid email should be rejected");
  console.log("✓ Invalid email rejection verified");

  // Test 4: Honeypot field filled by bot
  const botSubmission = {
    ...validSubmission,
    hp_website_contact: "http://spam-link.ru",
  };
  const botResult = inquirySubmissionSchema.safeParse(botSubmission);
  assert(!botResult.success, "Honeypot populate should fail validation");
  console.log("✓ Honeypot bot trap verified");

  // Test 5: Keyed HMAC SHA-256 Client Hashing
  const clientA = "192.168.1.100:Mozilla/5.0";
  const clientB = "192.168.1.101:Mozilla/5.0";
  const hashA = hashClientIdentifier(clientA);
  const hashA2 = hashClientIdentifier(clientA);
  const hashB = hashClientIdentifier(clientB);

  assert.strictEqual(hashA.length, 64, "HMAC-SHA256 must be 64-hex string");
  assert.strictEqual(hashA, hashA2, "Same client must hash deterministically");
  assert.notStrictEqual(hashA, hashB, "Different client must hash differently");
  console.log("✓ Keyed HMAC-SHA256 client key hashing verified (privacy preserved)");

  // Test 6: 15-Minute Window Alignment
  const t1 = new Date("2026-10-23T10:02:15.000Z");
  const t2 = new Date("2026-10-23T10:14:59.000Z");
  const t3 = new Date("2026-10-23T10:15:01.000Z");

  const w1 = getCurrentWindowStart(t1);
  const w2 = getCurrentWindowStart(t2);
  const w3 = getCurrentWindowStart(t3);

  assert.strictEqual(w1, w2, "Times in same 15m window must have same window_start");
  assert.notStrictEqual(w1, w3, "Times in different 15m windows must differ");
  assert.strictEqual(w1, "2026-10-23T10:00:00.000Z");
  assert.strictEqual(w3, "2026-10-23T10:15:00.000Z");
  console.log("✓ 15-minute sliding rate limit window calculation verified");

  console.log("\nALL COMMISSION INQUIRY LOGIC TESTS PASSED!");
}

runTests();
