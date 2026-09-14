import { ResourceTemplate } from "@modelcontextprotocol/server";
import { getScholarship, searchScholarships } from "../services/filter.js";
import { formatScholarship } from "../utils/format.js";

export function registerResources(server) {
  server.registerResource(
    "scholarship-record",
    new ResourceTemplate("scholarship://item/{id}", {
      list: async () => {
        const catalog = await searchScholarships({ limit: 20 });
        return {
          resources: catalog.map((scholarship) => ({
            uri: `scholarship://item/${scholarship._id}`,
            name: scholarship.title,
            mimeType: "text/plain",
          })),
        };
      },
    }),
    {
      title: "Scholarship record",
      description: "Full details for one scholarship",
      mimeType: "text/plain",
    },
    async (uri, { id }) => {
      let scholarship;
      try {
        scholarship = await getScholarship(id);
      } catch {
        scholarship = null;
      }
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: "text/plain",
            text: scholarship
              ? formatScholarship(scholarship)
              : `No scholarship found with id ${id}.`,
          },
        ],
      };
    },
  );
}