import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    provider: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    amountMin: { type: Number, default: 0 },
    amountMax: { type: Number, default: 0 },
    currency: { type: String, default: "USD" },
    deadline: { type: Date, default: null },
    rolling: { type: Boolean, default: false },
    educationLevels: { type: [String], default: ["undergraduate"] },
    fieldsOfStudy: { type: [String], default: ["any"] },
    gpaMinimum: { type: Number, default: null },
    citizenship: { type: [String], default: ["any"] },
    countries: { type: [String], default: ["any"] },
    firstGenerationOnly: { type: Boolean, default: false },
    womenOnly: { type: Boolean, default: false },
    numberOfAwards: { type: Number, default: 1 },
    renewable: { type: Boolean, default: false },
    applicationUrl: { type: String, required: true },
    applicationRequirements: { type: [String], default: [] },
  },
  { timestamps: true },
);

scholarshipSchema.index({
  title: "text",
  provider: "text",
  description: "text",
  fieldsOfStudy: "text",
});
scholarshipSchema.index({ deadline: 1 });
scholarshipSchema.index({ amountMax: -1 });

export const Scholarship = mongoose.model("Scholarship", scholarshipSchema);