function amountText(doc) {
  if (doc.amountMin == null && doc.amountMax == null) return "not specified";
  const currency = doc.currency ?? "USD";
  if (doc.amountMin === doc.amountMax) return `${doc.amountMax} ${currency}`;
  return `${doc.amountMin}-${doc.amountMax} ${currency}`;
}

function deadlineText(doc) {
  if (doc.rolling) return "rolling";
  if (!doc.deadline) return "no deadline listed";
  return new Date(doc.deadline).toISOString().slice(0, 10);
}

function scholarshipTitle(entry) {
  if (entry && typeof entry === "object" && entry.title) return entry.title;
  return String(entry);
}

export function formatScholarship(s) {
  const lines = [
    `ID: ${s._id}`,
    `Title: ${s.title}`,
    `Provider: ${s.provider}`,
    `Amount: ${amountText(s)}`,
    `Deadline: ${deadlineText(s)}`,
    `Education levels: ${s.educationLevels.join(", ")}`,
    `Fields of study: ${s.fieldsOfStudy?.join(", ") ?? "any"}`,
    `Citizenship: ${s.citizenship.join(", ")}`,
  ];
  if (s.countries?.length) lines.push(`Countries: ${s.countries.join(", ")}`);
  if (s.gpaMinimum != null) lines.push(`GPA minimum: ${s.gpaMinimum}`);
  if (s.firstGenerationOnly) lines.push("Restricted to: first-generation students");
  if (s.womenOnly) lines.push("Restricted to: women");
  if (s.renewable) lines.push("Renewable");
  if (s.numberOfAwards > 1) lines.push(`Number of awards: ${s.numberOfAwards}`);
  lines.push(`Application URL: ${s.applicationUrl}`);
  if (s.applicationRequirements?.length) {
    lines.push(`Requirements: ${s.applicationRequirements.join("; ")}`);
  }
  if (s.description) lines.push(`\n${s.description}`);
  return lines.join("\n");
}

export function formatScholarshipList(docs) {
  if (!docs.length) return "No scholarships found matching your filters.";
  const parts = docs.map(
    (s, i) =>
      `${i + 1}. [${s._id}] ${s.title} — ${s.provider} (${amountText(s)}, ${deadlineText(s)})`,
  );
  return `${parts.join("\n")}\n\n${docs.length} result(s).`;
}

export function formatMatchList(results) {
  if (!results.length) {
    return "No applicable scholarships found for this student profile.";
  }
  const parts = results.map((r, i) => {
    const reasons = r.reasons.map((reason) => `  - ${reason}`).join("\n");
    return [
      `${i + 1}. [${r._id}] ${r.title} — ${r.provider} (${amountText(r)}, ${deadlineText(r)})`,
      `Match score: ${r.matchScore}`,
      reasons,
    ].join("\n");
  });
  return `Top matches for this student profile (${results.length}):\n\n${parts.join("\n\n")}`;
}

export function formatDeadlines(docs, { days } = {}) {
  if (!docs.length) {
    return `No scholarships with deadlines in the next ${days ?? 30} days.`;
  }
  const parts = docs.map(
    (s, i) =>
      `${i + 1}. [${s._id}] ${s.title} — ${s.provider} | Deadline: ${deadlineText(s)} | Apply: ${s.applicationUrl}`,
  );
  return `Upcoming deadlines (next ${days ?? 30} days):\n${parts.join("\n")}`;
}

export function formatSaved(doc) {
  return `Saved ${String(doc.scholarship)} (status: ${doc.status}).`;
}

export function formatSavedList(docs) {
  if (!docs.length) return "No saved scholarships yet.";
  const parts = docs.map((entry, i) => {
    const sch = entry.scholarship && typeof entry.scholarship === "object" ? entry.scholarship : null;
    const name = sch ? `${sch.title} — ${sch.provider}` : `Scholarship ${String(entry.scholarship)}`;
    const amount = sch ? `(${amountText(sch)}, ${deadlineText(sch)})` : "";
    return `${i + 1}. [${String(entry.scholarship)}] ${name} ${amount}[${entry.status}]`;
  });
  return `Saved shortlist (${docs.length}):\n${parts.join("\n")}`;
}

export function formatNoteAdded(note) {
  return `Note added to ${String(note.scholarship)}.`;
}

export function formatNotesList(notes) {
  if (!notes.length) return "No research notes yet.";
  const parts = notes.map((n, i) => {
    const who = scholarshipTitle(n.scholarship);
    const date = n.createdAt ? new Date(n.createdAt).toISOString().slice(0, 10) : "";
    return `${i + 1}. [${who}]${date ? ` ${date}` : ""}\n   ${n.body}`;
  });
  return `Research notes (${notes.length}):\n${parts.join("\n\n")}`;
}

export function formatCompare(docs) {
  return docs.map((s, i) => `#${i + 1}\n${formatScholarship(s)}`).join("\n\n" + "-".repeat(48) + "\n\n");
}