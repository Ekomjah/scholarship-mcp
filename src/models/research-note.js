import mongoose from "mongoose";

const researchNoteSchema = new mongoose.Schema(
  {
    researcherId: {
      type: String,
      required: true,
      default: "default",
    },
    scholarship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scholarship",
      required: true,
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true },
);

export const ResearchNote = mongoose.model("ResearchNote", researchNoteSchema);