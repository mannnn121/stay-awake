"use client";

import { useState } from "react";

type Result = {
  label: string;
  score: number | null;
};

export default function HomePage() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function onFile(next: File | null) {
    setFile(next);
    setResult(null);
    setError(null);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return next ? URL.createObjectURL(next) : null;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/predict", { method: "POST", body });
      const payload = (await response.json()) as Result & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Scoring failed.");
      }
      setResult({ label: payload.label, score: payload.score });
    } catch (cause) {
      setResult(null);
      setError(cause instanceof Error ? cause.message : "Scoring failed.");
    } finally {
      setBusy(false);
    }
  }

  const width =
    result?.score == null ? "0%" : `${Math.round(result.score * 100)}%`;

  return (
    <main>
      <h1>Stay Awake</h1>
      <p className="lead">
        Upload a face or eye image. The Hugging Face API resizes it to 64×64
        grayscale and scores it with the StayAwake CNN. A score of 0.5 or
        higher is labeled Awake.
      </p>
      <form onSubmit={onSubmit}>
        <label>
          Image
          <input
            type="file"
            accept="image/*"
            required
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
          />
        </label>
        {preview ? (
          <div className="preview">
            <img src={preview} alt="Selected upload" />
            <p className="meta">The model sees a 64×64 grayscale version of this image.</p>
          </div>
        ) : null}
        <button type="submit" disabled={!file || busy}>
          {busy ? "Scoring…" : "Score image"}
        </button>
      </form>
      {error ? <p className="error">{error}</p> : null}
      {result ? (
        <section className="score">
          <p className="label">{result.label}</p>
          <div className="bar" aria-hidden="true">
            <span style={{ width }} />
          </div>
          <p className="meta">
            {result.score == null
              ? "The API did not return a numeric score."
              : `Positive-class score ${result.score.toFixed(3)}. Scores at or above 0.5 are labeled Awake.`}
          </p>
        </section>
      ) : null}
    </main>
  );
}
