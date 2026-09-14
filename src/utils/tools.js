import * as z from "zod/v4";
import { getScholarship, searchScholarships } from "../services/filter.js";
import { matchScholarships } from "../services/match.js";
import {
  addResearchNote,
  compareScholarships,
  getUpcomingDeadlines,
  listResearchNotes,
  listSavedScholarships,
  saveScholarship,
} from "../services/library.js";
import { toolText } from "./tool-result.js";
import {
  formatCompare,
  formatDeadlines,
  formatMatchList,
  formatNoteAdded,
  formatNotesList,
  formatSaved,
  formatSavedList,
  formatScholarship,
  formatScholarshipList,
} from "./format.js";

const READ_ONLY = { readOnlyHint: true, openWorldHint: false };
const WRITE = { readOnlyHint: false, openWorldHint: false };

const researcherId = () =>
  z.string().optional().describe("Identifier for the researcher; defaults to \"default\"");

export const TOOLS = [
  {
    name: "search_scholarships",
    title: "Search scholarships",
    description:
      "Filter the scholarship catalog by keyword, field of study, education level, citizenship, country, GPA, and award amount.",
    inputSchema: z.object({
      keyword: z.string().min(1).optional().describe("Free-text search across title, provider, description, and fields"),
      fieldOfStudy: z.string().optional().describe("For example computer science, public health, or engineering"),
      educationLevel: z.enum(["undergraduate", "graduate", "doctoral"]).optional(),
      citizenship: z.string().optional(),
      country: z.string().optional(),
      minAmount: z.number().nonnegative().optional(),
      gpa: z.number().min(0).max(4).optional(),
      firstGeneration: z.boolean().optional(),
      womenOnly: z.boolean().optional(),
      limit: z.number().int().min(1).max(25).optional(),
    }),
    annotations: READ_ONLY,
    handler: async (args) => {
      const results = await searchScholarships(args);
      return toolText(formatScholarshipList(results));
    },
  },

  {
    name: "get_scholarship",
    title: "Get a scholarship",
    description: "Return one full scholarship record by its MongoDB ObjectId.",
    inputSchema: z.object({
      id: z.string().describe("24-character MongoDB ObjectId of the scholarship"),
    }),
    annotations: READ_ONLY,
    handler: async (args) => {
      const doc = await getScholarship(args.id);
      return toolText(formatScholarship(doc));
    },
  },

  {
    name: "match_scholarships",
    title: "Match scholarships to a student profile",
    description:
      "Score every open award against a student profile. Hard eligibility filters remove ineligible awards; remaining awards are ranked by score with human-readable reasons for each match.",
    inputSchema: z.object({
      educationLevel: z.enum(["undergraduate", "graduate", "doctoral"]).optional().describe("Student's current education level"),
      gpa: z.number().min(0).max(4).optional().describe("Student's GPA on a 4.0 scale"),
      citizenship: z.string().optional().describe("Student's citizenship for eligibility"),
      fieldOfStudy: z.string().optional().describe("Student's field of study"),
      preferredCountries: z.array(z.string()).optional().describe("Where the student wants to study"),
      minimumAmount: z.number().nonnegative().optional().describe("Lowest award amount the student will accept"),
      firstGeneration: z.boolean().optional().describe("True if the student is first-generation"),
      women: z.boolean().optional().describe("True if the student identifies as a woman"),
      limit: z.number().int().min(1).max(25).optional(),
    }),
    annotations: READ_ONLY,
    handler: async (args) => {
      const results = await matchScholarships(args, { limit: args.limit });
      return toolText(formatMatchList(results));
    },
  },

  {
    name: "save_scholarship",
    title: "Save a scholarship",
    description: "Bookmark an award for a researcher. Upserts by researcher and scholarship id.",
    inputSchema: z.object({
      researcherId: researcherId(),
      scholarshipId: z.string().describe("24-character MongoDB ObjectId of the scholarship"),
      status: z.enum(["saved", "applying", "submitted", "won", "rejected"]).optional(),
    }),
    annotations: WRITE,
    handler: async (args) => {
      const doc = await saveScholarship({
        researcherId: args.researcherId,
        scholarshipId: args.scholarshipId,
        status: args.status,
      });
      return toolText(formatSaved(doc));
    },
  },

  {
    name: "list_saved_scholarships",
    title: "List saved scholarships",
    description: "Show a researcher's shortlist of saved awards with their status.",
    inputSchema: z.object({
      researcherId: researcherId(),
    }),
    annotations: READ_ONLY,
    handler: async (args) => {
      const docs = await listSavedScholarships({ researcherId: args.researcherId });
      return toolText(formatSavedList(docs));
    },
  },

  {
    name: "add_research_note",
    title: "Add a research note",
    description: "Attach a note to a scholarship after confirming the scholarship exists.",
    inputSchema: z.object({
      researcherId: researcherId(),
      scholarshipId: z.string().describe("24-character MongoDB ObjectId of the scholarship"),
      body: z.string().min(1).describe("The note text"),
    }),
    annotations: WRITE,
    handler: async (args) => {
      const note = await addResearchNote({
        researcherId: args.researcherId,
        scholarshipId: args.scholarshipId,
        body: args.body,
      });
      return toolText(formatNoteAdded(note));
    },
  },

  {
    name: "list_research_notes",
    title: "List research notes",
    description: "Read back a researcher's notes, newest first.",
    inputSchema: z.object({
      researcherId: researcherId(),
    }),
    annotations: READ_ONLY,
    handler: async (args) => {
      const notes = await listResearchNotes({ researcherId: args.researcherId });
      return toolText(formatNotesList(notes));
    },
  },

  {
    name: "get_upcoming_deadlines",
    title: "Get upcoming deadlines",
    description: "List scholarships with deadlines in the next N days.",
    inputSchema: z.object({
      days: z.number().int().min(1).max(365).optional().describe("Window size in days; defaults to 30"),
    }),
    annotations: READ_ONLY,
    handler: async (args) => {
      const docs = await getUpcomingDeadlines({ days: args.days });
      return toolText(formatDeadlines(docs, { days: args.days }));
    },
  },

  {
    name: "compare_scholarships",
    title: "Compare scholarships",
    description: "Side-by-side comparison of two or three scholarships by id, returning the same fields for each.",
    inputSchema: z.object({
      ids: z
        .array(z.string())
        .min(2)
        .max(3)
        .describe("2 or 3 MongoDB ObjectIds of scholarships to compare"),
    }),
    annotations: READ_ONLY,
    handler: async (args) => {
      const docs = await compareScholarships({ ids: args.ids });
      return toolText(formatCompare(docs));
    },
  },
];