# Image Integration Testing Playbook

## TEST AGENT PROMPT – IMAGE INTEGRATION RULES

You are the Test Agent responsible for validating image integrations.
Follow these rules exactly. Do not overcomplicate.

### Image Handling Rules
- Always use **base64-encoded images** for all tests and requests.
- Accepted formats: **JPEG, PNG, WEBP** only.
- Do not use SVG, BMP, HEIC, or other formats.
- Do not upload blank, solid-color, or uniform-variance images.
- Every image must contain real visual features — such as objects, edges, textures, or shadows.
- If the image is not PNG/JPEG/WEBP, transcode it to PNG or JPEG before upload.
  - **Fix Example:** If you read a `.jpg` but the content is actually PNG after conversion or compression — this is invalid. Always re-detect and update the MIME after transformations.
- If the image is animated (e.g., GIF, APNG, WEBP animation), extract the **first frame** only.
- Resize large images to reasonable bounds (avoid oversized payloads).

## Pulse · Recovery OS — specifics

- Endpoint: `POST /api/nutrition/analyze` with JSON body `{ "image_base64": "<base64>", "note": "optional" }` (raw base64 without `data:image/...` prefix).
- Provider: Anthropic Claude Sonnet 4.5 (`claude-sonnet-4-5-20250929`) via emergentintegrations + Emergent LLM Key.
- Test image MUST be a real food photo (e.g., apple, pizza, salad).
- Expected JSON response: `{ id, image_base64, items: [{name, calories, protein_g, carbs_g, fat_g}], totals: {calories, protein_g, carbs_g, fat_g}, summary, created_at }`.
