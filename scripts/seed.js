import mongoose from "mongoose";
import { readFile } from "node:fs/promises";
import { connectDatabase } from "../src/db.js";
import { Scholarship } from "../src/models/scholarship.js";

const DATA_PATH = new URL("../data/scholarships.json", import.meta.url);

async function seed() {
  await connectDatabase();

  const raw = await readFile(DATA_PATH, "utf8");
  const scholarships = JSON.parse(raw);

  if (!Array.isArray(scholarships) || scholarships.length === 0) {
    throw new Error(`Expected a non-empty array of scholarships in ${DATA_PATH.pathname}`);
  }

  await Scholarship.deleteMany({});
  await Scholarship.insertMany(scholarships);

  const count = await Scholarship.countDocuments();
  console.log(`Catalog replaced: ${count} scholarships loaded.`);
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err.message);
    process.exit(1);
  })
  .finally(() => mongoose.disconnect());