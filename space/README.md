---
title: Stay Awake
emoji: 👁️
colorFrom: indigo
colorTo: green
sdk: static
pinned: false
app_file: index.html
---

# Stay Awake

Browser demo of the StayAwake CNN.

Upload a face or eye image. The page resizes it to 64×64, converts it to grayscale, and runs the trained Keras network as ONNX in the browser. The network's own rescaling layer divides pixel values by 255. A sigmoid score of 0.5 or higher is labeled **Awake**.

This is a static Space because the Hugging Face account is not yet eligible for a free Gradio runtime.
