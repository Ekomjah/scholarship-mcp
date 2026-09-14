import { Scholarship } from "../models/scholarship.js";
import { assertValidObjectId } from "./library.js";
import { listMatches, openDeadlineFilter } from "./match.js";

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function arrayOrAnyFilter(field, value) {
  if (value == null) return null;
  return { [field]: { $in: ["any", value] } };
}

export async function searchScholarships(filters = {}) {
  const and = [openDeadlineFilter()];

  if (filters.keyword) {
    const keyword = escapeRegex(filters.keyword);
    and.push({
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { provider: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
        { fieldsOfStudy: { $regex: keyword, $options: "i" } },
      ],
    });
  }

  if (filters.fieldOfStudy) {
    and.push({
      $or: [
        { fieldsOfStudy: { $regex: "^any$", $options: "i" } },
        { fieldsOfStudy: { $regex: escapeRegex(filters.fieldOfStudy), $options: "i" } },
      ],
    });
  }

  const educationFilter = arrayOrAnyFilter("educationLevels", filters.educationLevel);
  if (educationFilter) and.push(educationFilter);

  const citizenshipFilter = arrayOrAnyFilter("citizenship", filters.citizenship);
  if (citizenshipFilter) and.push(citizenshipFilter);

  const countryFilter = arrayOrAnyFilter("countries", filters.country);
  if (countryFilter) and.push(countryFilter);

  if (filters.minAmount != null) {
    and.push({ amountMax: { $gte: filters.minAmount } });
  }

  if (filters.gpa != null) {
    and.push({ $or: [{ gpaMinimum: null }, { gpaMinimum: { $lte: filters.gpa } }] });
  }

  if (filters.firstGeneration === true) and.push({ firstGenerationOnly: true });
  if (filters.womenOnly === true) and.push({ womenOnly: true });

  const results = await Scholarship.find({ $and: and })
    .sort({ deadline: 1, amountMax: -1 })
    .limit(100)
    .lean();

  return rankByFieldMatch(results, filters.fieldOfStudy).slice(0, filters.limit ?? 10);
}

export async function getScholarship(id) {
  const cleanId = assertValidObjectId(id, "scholarshipId");
  const doc = await Scholarship.findById(cleanId).lean();
  if (!doc) throw new Error(`Scholarship "${cleanId}" not found`);
  return doc;
}

function rankByFieldMatch(results, fieldOfStudy) {
  if (!fieldOfStudy) return results;
  return [...results].sort((a, b) => {
    const aMatch = listMatches(a.fieldsOfStudy, fieldOfStudy) === true;
    const bMatch = listMatches(b.fieldsOfStudy, fieldOfStudy) === true;
    return Number(bMatch) - Number(aMatch);
  });
}