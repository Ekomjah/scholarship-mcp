import mongoose from "mongoose";

const savedScholarshipSchema = new mongoose.Schema(
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
    status: {
      type: String,
      required: true,
      enum: ["saved", "applying", "submitted", "won", "rejected"],
      default: "saved",
    },
  },
  { timestamps: true },
);

savedScholarshipSchema.index({ researcherId: 1, scholarship: 1 });

export const SavedScholarship = mongoose.model("SavedScholarship", savedScholarshipSchema);