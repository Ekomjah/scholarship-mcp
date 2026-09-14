import mongoose from "mongoose";
import { createMcpHandler } from "@modelcontextprotocol/server";
import { connectDatabase } from "../src/db.js";
import { createScholarshipServer } from "../src/mcp/server.js";
import { Scholarship } from "../src/models/scholarship.js";
import { SavedScholarship } from "../src/models/saved-scholarship.js";
import { ResearchNote } from "../src/models/research-note.js";

const mcpHandler = createMcpHandler(() => createScholarshipServer());

let requestId = 0;

function parsePayload(contentType, body) {
  const messages =
    String(contentType).includes("event-stream")
      ? body
          .split(/\r?\n/)
          .filter((line) => line.startsWith("data: "))
          .map((line) => JSON.parse(line.slice(6)))
      : [JSON.parse(body)];
  const message = messages.find((m) => m.result !== undefined || m.error !== undefined);
  if (!message) throw new Error("No result in response");
  if (message.error) throw new Error(`${message.error.code}: ${message.error.message}`);
  return message.result;
}

async function callTool(name, args) {
  const res = await mcpHandler.fetch(
    new Request("http://localhost/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: ++requestId,
        method: "tools/call",
        params: { name, arguments: args },
      }),
    }),
  );
  const body = await res.text();
  if (!res.ok && !String(res.headers.get("content-type")).includes("event-stream")) {
    throw new Error(`HTTP ${res.status}: ${body.slice(0, 200)}`);
  }
  const result = parsePayload(res.headers.get("content-type"), body);
  const text = result.content?.[0]?.text ?? JSON.stringify(result);
  return { text, isError: result.isError === true, result };
}

function print(label, { text, isError }) {
  console.log(`\n===== ${label} =====`);
  console.log(text);
  if (isError) throw new Error(`Tool reported an error: ${text}`);
}

async function main() {
  await connectDatabase();
  const count = await Scholarship.countDocuments();
  if (count === 0) {
    console.log("Catalog is empty: run `npm run seed` first.");
    return;
  }

  const search = await callTool("search_scholarships", { limit: 10 });
  print("search_scholarships", search);

  const firstId = search.result.content[0].text.match(/\[([0-9a-f]{24})\]/)?.[1];
  if (!firstId) throw new Error("Could not extract a scholarship id from search results");
  print("get_scholarship", await callTool("get_scholarship", { id: firstId }));

  const match = await callTool("match_scholarships", {
    educationLevel: "undergraduate",
    gpa: 3.5,
    citizenship: "us",
    fieldOfStudy: "computer science",
    preferredCountries: ["us"],
    minimumAmount: 2000,
    limit: 5,
  });
  print("match_scholarships", match);

  print("save_scholarship", await callTool("save_scholarship", { scholarshipId: firstId }));
  print("list_saved_scholarships", await callTool("list_saved_scholarships", {}));

  print(
    "add_research_note",
    await callTool("add_research_note", {
      scholarshipId: firstId,
      body: "Smoke test note: verify GPA requirement against transcript.",
    }),
  );
  print("list_research_notes", await callTool("list_research_notes", {}));

  print("get_upcoming_deadlines", await callTool("get_upcoming_deadlines", { days: 90 }));

  const ids =
    [...search.result.content[0].text.matchAll(/\[([0-9a-f]{24})\]/g)].map((m) => m[1]).slice(0, 2) ??
    [];
  if (ids.length < 2) throw new Error("Need at least two ids to compare");
  print(
    "compare_scholarships",
    await callTool("compare_scholarships", { ids: [ids[0], ids[1]] }),
  );
}

main()
  .catch((err) => {
    console.error("\nSmoke test failed:", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await SavedScholarship.deleteMany({});
    await ResearchNote.deleteMany({});
    await mongoose.disconnect();
  });