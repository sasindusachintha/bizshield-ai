/**
 * MIGRATION 001 — Idea-based system  ->  Project Workspace
 *
 * Converts every existing record from the old flat collections into the
 * new Project + ProjectDocument structure:
 *
 *   Idea          -> Project (title/description copied) + ProjectDocument
 *                    of type "idea" (description + score)
 *   BusinessPlan  -> ProjectDocument of type "business-model", attached to
 *                    the Project created from its linked idea (or a new
 *                    "Untitled Project" if it had no linked idea)
 *   Marketing     -> ProjectDocument of type "marketing-plan", attached the
 *                    same way as BusinessPlan
 *
 * USAGE
 *   cd backend
 *   node migrations/001-migrate-ideas-to-projects.js
 *
 * The script is IDEMPOTENT-ish in the sense that it only reads from the
 * legacy collections and only writes new Project/ProjectDocument records —
 * it never modifies or deletes the legacy collections. Re-running it after
 * a successful run will duplicate the migrated data, so run it once, verify
 * the results, and then (optionally, manually) drop the legacy collections:
 *
 *   db.ideas.drop()
 *   db.businessplans.drop()
 *   db.marketings.drop()
 */

const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const connectDB = require("../config/db");

// New models
const Project = require("../models/Project");
const ProjectDocument = require("../models/ProjectDocument");

// Legacy models (read-only access to the old collections)
const LegacyIdea = require("./legacy-models/Idea");
const LegacyBusinessPlan = require("./legacy-models/BusinessPlan");
const LegacyMarketing = require("./legacy-models/Marketing");

async function migrateIdeas() {
  const ideas = await LegacyIdea.find({}).lean();
  console.log(`Found ${ideas.length} legacy idea(s) to migrate.`);

  // Maps old Idea._id -> new Project._id, used by the BusinessPlan and
  // Marketing migrations below to attach documents to the right project.
  const ideaIdToProjectId = new Map();

  for (const idea of ideas) {
    const project = await Project.create({
      userId: idea.userId,
      title: idea.title,
      industry: "",
      stage: "ideation",
      description: idea.description,
      createdAt: idea.createdAt,
      updatedAt: idea.createdAt,
    });

    await ProjectDocument.create({
      projectId: project._id,
      userId: idea.userId,
      type: "idea",
      title: idea.title,
      content: {
        description: idea.description,
        score: idea.score ?? null,
      },
      createdAt: idea.createdAt,
      updatedAt: idea.createdAt,
    });

    ideaIdToProjectId.set(String(idea._id), project._id);
  }

  console.log(`Migrated ${ideas.length} idea(s) into Project + ProjectDocument("idea").`);
  return ideaIdToProjectId;
}

/**
 * Finds the project for a legacy ideaId, or creates a fallback
 * "Untitled Project" for the given user if there's no linked idea
 * (or the linked idea wasn't found in the migration map).
 */
async function resolveProjectId(ideaIdToProjectId, userId, legacyIdeaId, fallbackCache) {
  if (legacyIdeaId && ideaIdToProjectId.has(String(legacyIdeaId))) {
    return ideaIdToProjectId.get(String(legacyIdeaId));
  }

  const cacheKey = String(userId);
  if (fallbackCache.has(cacheKey)) {
    return fallbackCache.get(cacheKey);
  }

  const fallbackProject = await Project.create({
    userId,
    title: "Untitled Project (migrated)",
    industry: "",
    stage: "ideation",
    description: "Automatically created during migration for documents without a linked idea.",
  });

  fallbackCache.set(cacheKey, fallbackProject._id);
  return fallbackProject._id;
}

async function migrateBusinessPlans(ideaIdToProjectId) {
  const plans = await LegacyBusinessPlan.find({}).lean();
  console.log(`Found ${plans.length} legacy business plan(s) to migrate.`);

  const fallbackCache = new Map();

  for (const plan of plans) {
    const projectId = await resolveProjectId(
      ideaIdToProjectId,
      plan.userId,
      plan.ideaId,
      fallbackCache
    );

    await ProjectDocument.create({
      projectId,
      userId: plan.userId,
      type: "business-model",
      title: "Business Plan",
      content: plan.planContent,
      createdAt: plan.createdAt,
      updatedAt: plan.createdAt,
    });
  }

  console.log(`Migrated ${plans.length} business plan(s) into ProjectDocument("business-model").`);
}

async function migrateMarketing(ideaIdToProjectId) {
  const marketingItems = await LegacyMarketing.find({}).lean();
  console.log(`Found ${marketingItems.length} legacy marketing item(s) to migrate.`);

  const fallbackCache = new Map();

  for (const item of marketingItems) {
    const projectId = await resolveProjectId(
      ideaIdToProjectId,
      item.userId,
      item.ideaId,
      fallbackCache
    );

    await ProjectDocument.create({
      projectId,
      userId: item.userId,
      type: "marketing-plan",
      title: "Marketing Kit",
      content: item.content,
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    });
  }

  console.log(`Migrated ${marketingItems.length} marketing item(s) into ProjectDocument("marketing-plan").`);
}

async function run() {
  await connectDB();

  if (mongoose.connection.readyState !== 1) {
    console.error("MongoDB is not connected (check MONGO_URI). Aborting migration.");
    process.exit(1);
  }

  console.log("Starting migration: Idea-based system -> Project Workspace\n");

  const ideaIdToProjectId = await migrateIdeas();
  await migrateBusinessPlans(ideaIdToProjectId);
  await migrateMarketing(ideaIdToProjectId);

  console.log("\nMigration complete.");
  console.log("Legacy collections (ideas, businessplans, marketings) were NOT modified.");
  console.log("After verifying the migrated data, you may drop them manually:");
  console.log("  db.ideas.drop()");
  console.log("  db.businessplans.drop()");
  console.log("  db.marketings.drop()");

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
