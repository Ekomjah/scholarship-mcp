import { Scholarship } from "../models/scholarship.js";

export function openDeadlineFilter() {
  return {
    $or: [{ rolling: true }, { deadline: null }, { deadline: { $gte: new Date() } }],
  };
}

const SOFT_SCORES = {
  EDUCATION_MATCH: 20,
  GPA_MATCH: 15,
  CITIZENSHIP_MATCH: 15,
  FIELD_MATCH: 30,
  COUNTRY_MATCH: 10,
  AMOUNT_MATCH: 10,
  ELIGIBILITY_TAG_MATCH: 10,
};

const DEFAULT_SCAN_LIMIT = 500;

export function normalizeList(value) {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .filter((entry) => entry != null && String(entry).trim() !== "")
    .map((entry) => String(entry).trim().toLowerCase());
}

export function listMatches(scholarshipValues, profileValues) {
  const allowed = normalizeList(scholarshipValues);
  const owned = normalizeList(profileValues);
  if (allowed.length === 0 || owned.length === 0) return null;
  if (allowed.includes("any")) return true;
  return allowed.some((value) => owned.includes(value));
}

export function scoreScholarship(scholarship, profile = {}) {
  const reasons = [];
  const blocked = [];
  let score = 0;

  const education = listMatches(scholarship.educationLevels, profile.educationLevel);
  if (education === false) {
    blocked.push(
      `Education level "${profile.educationLevel}" is not accepted (${scholarship.educationLevels.join(", ")})`,
    );
  } else if (education === true) {
    score += SOFT_SCORES.EDUCATION_MATCH;
    reasons.push(`Open to your education level (${profile.educationLevel})`);
  }

  const gpaMin = scholarship.gpaMinimum;
  if (gpaMin != null && profile.gpa != null) {
    if (profile.gpa >= gpaMin) {
      score += SOFT_SCORES.GPA_MATCH;
      reasons.push(`GPA ${profile.gpa} meets the ${gpaMin} minimum`);
    } else {
      blocked.push(`GPA ${profile.gpa} is below the ${gpaMin} minimum`);
    }
  }

  const citizenship = listMatches(scholarship.citizenship, profile.citizenship);
  if (citizenship === false) {
    blocked.push(`Citizenship "${profile.citizenship}" is not eligible`);
  } else if (citizenship === true) {
    score += SOFT_SCORES.CITIZENSHIP_MATCH;
    reasons.push("Your citizenship is eligible");
  }

  if (scholarship.firstGenerationOnly) {
    if (profile.firstGeneration) {
      score += SOFT_SCORES.ELIGIBILITY_TAG_MATCH;
      reasons.push("First-generation students are preferred and you qualify");
    } else {
      blocked.push("Award is limited to first-generation students");
    }
  }

  if (scholarship.womenOnly) {
    if (profile.women) {
      score += SOFT_SCORES.ELIGIBILITY_TAG_MATCH;
      reasons.push("Award is for women and you qualify");
    } else {
      blocked.push("Award is limited to women");
    }
  }

  const field = listMatches(scholarship.fieldsOfStudy, profile.fieldOfStudy);
  if (field === true) {
    score += SOFT_SCORES.FIELD_MATCH;
    reasons.push(`Field of study "${profile.fieldOfStudy}" is covered`);
  }

  const country = listMatches(scholarship.countries, profile.preferredCountries);
  if (country === true) {
    score += SOFT_SCORES.COUNTRY_MATCH;
    reasons.push(
      `Open to your preferred country (${normalizeList(profile.preferredCountries).join(", ")})`,
    );
  }

  if (profile.minimumAmount != null && profile.minimumAmount > 0) {
    if (scholarship.amountMax >= profile.minimumAmount) {
      score += SOFT_SCORES.AMOUNT_MATCH;
      reasons.push(
        `Award worth up to ${scholarship.amountMax} ${scholarship.currency} meets your ${profile.minimumAmount} minimum`,
      );
    }
  }

  return { matched: blocked.length === 0, score, reasons, blocked };
}

export async function matchScholarships(profile = {}, options = {}) {
  const limit = options.limit ?? 20;
  const scanLimit = options.scanLimit ?? DEFAULT_SCAN_LIMIT;

  const candidates = await Scholarship.find(openDeadlineFilter())
    .sort({ deadline: 1, amountMax: -1 })
    .limit(scanLimit)
    .lean();

  return candidates
    .map((scholarship) => {
      const { matched, score, reasons } = scoreScholarship(scholarship, profile);
      if (!matched) return null;
      return { ...scholarship, matchScore: score, reasons };
    })
    .filter(Boolean)
    .sort((a, b) => b.matchScore - a.matchScore || b.amountMax - a.amountMax)
    .slice(0, limit);
}