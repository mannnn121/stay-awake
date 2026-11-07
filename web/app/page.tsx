"use client";

import { useEffect, useRef, useState } from "react";

type Result = {
  label: string;
  score: number | null;
};

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function onFile(next: File | null) {
    setFile(next);
    setResult(null);
    setError(null);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return next ? URL.createObjectURL(next) : null;
    });
  }

  async function startCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser cannot open a camera. Upload an image instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setCameraOn(true);
    } catch {
      setError("Camera permission was blocked. Allow the camera, or upload an image.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOn(false);
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError("The camera is not ready yet.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Could not capture this frame.");
          return;
        }
        onFile(new File([blob], "capture.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
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
        Use the camera or upload a face or eye image. The Hugging Face API
        resizes it to 64×64 grayscale and scores it with the StayAwake CNN. A
        score of 0.5 or higher is labeled Awake.
      </p>
      <form onSubmit={onSubmit}>
        <div className="actions">
          {cameraOn ? (
            <button type="button" onClick={stopCamera}>
              Stop camera
            </button>
          ) : (
            <button type="button" onClick={startCamera}>
              Use camera
            </button>
          )}
          {cameraOn ? (
            <button type="button" onClick={capture}>
              Capture
            </button>
          ) : null}
        </div>
        <video
          ref={videoRef}
          className={cameraOn ? "camera" : "camera hidden"}
          playsInline
          muted
          autoPlay
        />
        <label>
          Or choose an image
          <input
            type="file"
            accept="image/*"
            capture="user"
            onChange={(event) => onFile(event.target.files?.[0] ?? null)}
          />
        </label>
        {preview ? (
          <div className="preview">
            <img src={preview} alt="Frame to score" />
            <p className="meta">
              The model sees a 64×64 grayscale version of this image.
            </p>
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
