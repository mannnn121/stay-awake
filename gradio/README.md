---
title: Stay Awake
emoji: 👁️
colorFrom: indigo
colorTo: green
sdk: gradio
python_version: "3.12"
app_file: app.py
pinned: false
---

# Stay Awake

Upload an eye image. The app resizes it to 64×64 grayscale and scores it with the StayAwake CNN. A score of 0.5 or higher is labeled **Awake**.

How this app scores an image is section 8.2.2 of the repository README. Replacing `StayAwake.keras` is section 8.2.5.3. https://github.com/mannnn121/stay-awake#readme

The web app is https://stay-awake-eight.vercel.app.
