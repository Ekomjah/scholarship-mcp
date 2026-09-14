import * as z from "zod/v4";

export function registerPrompt(server) {
  server.registerPrompt(
    "research-plan",
    {
      title: "Scholarship research plan",
      description: "Build a week-by-week research and application plan from a student profile.",
      argsSchema: z.object({
        fieldOfStudy: z.string(),
        educationLevel: z.string(),
        citizenship: z.string(),
        gpa: z.string(),
        weeks: z.string().optional(),
      }),
    },
    ({ fieldOfStudy, educationLevel, citizenship, gpa, weeks }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Create a ${weeks || "6"}-week scholarship research plan for this student.

Field of study: ${fieldOfStudy}
Education level: ${educationLevel}
Citizenship: ${citizenship}
GPA: ${gpa}

Use the scholarship research tools to find real awards first. Then produce a shortlist, a week-by-week plan, and risks. Name actual scholarships and dates from the tool results.`,
          },
        },
      ],
    }),
  );
}