export function toolText(text) {
  return { content: [{ type: "text", text: String(text) }] };
}