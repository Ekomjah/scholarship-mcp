import mongoose from "mongoose";
import { Scholarship } from "../models/scholarship.js";
import { SavedScholarship } from "../models/saved-scholarship.js";
import { ResearchNote } from "../models/research-note.js";

const DAY_MS = 24 * 60 * 60 * 1000;

const COMPARE_FIELDS = [
  "title",
  "provider",
  "description",
  "amountMin",
  "amountMax",
  "currency",
  "deadline",
  "rolling",
  "educationLevels",
  "fieldsOfStudy",
  "gpaMinimum",
  "citizenship",
  "countries",
  "firstGenerationOnly",
  "womenOnly",
  "renewable",
  "applicationUrl",
  "applicationRequirements",
];

export function assertValidObjectId(id, label = "id") {
  if (id == null || !mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${label}: expected a MongoDB ObjectId, got "${id}"`);
  }
  return String(id);
}

export async function saveScholarship({
  researcherId = "default",
  scholarshipId,
  status = "saved",
}) {
  const id = assertValidObjectId(scholarshipId, "scholarshipId");
  return SavedScholarship.findOneAndUpdate(
    { researcherId, scholarship: id },
    { $set: { status } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  ).lean();
}

export async function listSavedScholarships({ researcherId = "default" } = {}) {
  return SavedScholarship.find({ researcherId })
    .populate({
      path: "scholarship",
      model: "Scholarship",
      select: "title provider amountMin amountMax currency deadline rolling applicationUrl",
    })
    .sort({ createdAt: -1 })
    .lean();
}

export async function addResearchNote({ researcherId = "default", scholarshipId, body }) {
  const id = assertValidObjectId(scholarshipId, "scholarshipId");
  if (body == null || String(body).trim() === "") {
    throw new Error("body is required");
  }
  const exists = await Scholarship.exists({ _id: id });
  if (!exists) {
    throw new Error(`Scholarship "${id}" does not exist; cannot attach a note`);
  }
  return ResearchNote.create({
    researcherId,
    scholarship: id,
    body: String(body).trim(),
  });
}

export async function listResearchNotes({ researcherId = "default" } = {}) {
  return ResearchNote.find({ researcherId })
    .populate({ path: "scholarship", model: "Scholarship", select: "title provider" })
    .sort({ createdAt: -1 })
    .lean();
}

export async function getUpcomingDeadlines({ days = 30 } = {}) {
  const span = Number(days);
  if (!Number.isFinite(span) || span < 0) {
    throw new Error(`days must be a non-negative number, got "${days}"`);
  }
  const now = new Date();
  const end = new Date(now.getTime() + span * DAY_MS);
  return Scholarship.find({ deadline: { $gte: now, $lte: end } })
    .sort({ deadline: 1 })
    .lean();
}

export async function compareScholarships({ ids = [] } = {}) {
  if (!Array.isArray(ids)) {
    throw new Error(`ids must be an array, got ${typeof ids}`);
  }
  if (ids.length < 2 || ids.length > 3) {
    throw new Error(`compareScholarships expects 2 or 3 scholarship ids, got ${ids.length}`);
  }
  const cleanIds = ids.map((id, index) => assertValidObjectId(id, `ids[${index}]`));
  const uniqueIds = [...new Set(cleanIds)];

  const docs = await Scholarship.find({ _id: { $in: uniqueIds } })
    .select(COMPARE_FIELDS.join(" "))
    .lean();

  if (docs.length !== uniqueIds.length) {
    throw new Error("One or more scholarships could not be found; all ids must be valid");
  }

  const byId = new Map(docs.map((doc) => [String(doc._id), doc]));
  return uniqueIds.map((id) => byId.get(id));
}