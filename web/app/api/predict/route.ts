const SPACE =
  process.env.HF_SPACE_URL ?? "https://ferropayo-stay-awake.hf.space";

export const maxDuration = 60;

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Upload an image." }, { status: 400 });
  }

  const upload = new FormData();
  upload.append("files", file, file.name || "image.png");
  const uploaded = await fetch(`${SPACE}/gradio_api/upload`, {
    method: "POST",
    body: upload,
  });
  if (!uploaded.ok) {
    return Response.json(
      { error: "The Hugging Face API rejected the upload." },
      { status: 502 },
    );
  }

  const paths = (await uploaded.json()) as string[];
  const path = paths[0];
  if (!path) {
    return Response.json(
      { error: "The Hugging Face API did not return a file path." },
      { status: 502 },
    );
  }

  const call = await fetch(`${SPACE}/gradio_api/call/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      data: [
        {
          path,
          orig_name: file.name || "image.png",
          meta: { _type: "gradio.FileData" },
        },
      ],
    }),
  });
  if (!call.ok) {
    return Response.json(
      { error: "The Hugging Face API did not start." },
      { status: 502 },
    );
  }

  const { event_id: eventId } = (await call.json()) as { event_id?: string };
  if (!eventId) {
    return Response.json(
      { error: "The Hugging Face API did not return an event." },
      { status: 502 },
    );
  }

  const stream = await fetch(`${SPACE}/gradio_api/call/predict/${eventId}`);
  const text = await stream.text();
  const dataLine = text
    .split("\n")
    .reverse()
    .find((line) => line.startsWith("data: "));
  if (!dataLine) {
    return Response.json(
      { error: "The Hugging Face API returned no result." },
      { status: 502 },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(dataLine.slice(6));
  } catch {
    return Response.json(
      { error: "The Hugging Face API returned an unreadable result." },
      { status: 502 },
    );
  }

  if (!Array.isArray(payload) || typeof payload[0] !== "string") {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : "The Hugging Face API returned an unexpected result.";
    return Response.json({ error: message }, { status: 502 });
  }

  const raw = payload[0];
  const match = raw.match(/^(.+)\nscore ([0-9.]+)$/);
  const label = match?.[1] ?? raw;
  const score = match ? Number(match[2]) : null;
  return Response.json({ label, score, raw });
}
