import { McpServer } from "@modelcontextprotocol/server";
import { registerPrompt } from "./prompt.js";
import { registerResources } from "./resource.js";
import { registerTools } from "./tools.js";

export function createScholarshipServer() {
  const server = new McpServer({
    name: "scholarship-research",
    version: "1.0.0"
  })
  registerTools(server);
  registerResources(server);
  registerPrompt(server);
  return server;
}