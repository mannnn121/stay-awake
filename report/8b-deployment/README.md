# Deployment screenshots

PDF section 8b: save the model, prepare the inference script, build the interface and API, record the dependencies, upload to hosting, and test the app.

The pictures were taken in the Orca browser on 7 Nov 2026. The local model check was an Orca terminal in this repo. Its screen was:

```
=== saved model ===
gradio/StayAwake.keras    4.8M
entries:
      64  metadata.json
   16451  config.json
 4797104  model.weights.h5
=== notebook save ===
model.save('/content/StayAwake.keras')
```

The crops in `samples/` come from the public MRL sheet `eyedataset01.png`. `open-eye.png` is an open eye. `closed-eye.png` is a closed eye.

| PDF step | Screenshot | What it shows |
| --- | --- | --- |
| Menyimpan model | `01-save-model.png` | `StayAwake.keras` on the Space, 4.81 MB, stored with Xet |
| Menyiapkan skrip inferensi | `02-inference-script.png` | `app.py` on the Space: load the Keras file, resize to 64×64, score at 0.5 |
| Membangun antarmuka | `03-interface-gradio.png` | Gradio page at https://ferropayo-stay-awake.hf.space |
| Membangun antarmuka | `03-interface-web.png` | Next.js page at https://stay-awake-eight.vercel.app |
| Membangun API | `03-api-route.png` | `web/app/api/predict/route.ts` posting to `/gradio_api/upload` |
| Mencatat dependensi | `04-dependencies-python.png` | `requirements.txt`: Keras 3.13.2, TensorFlow 2.20.0, Gradio, Pillow, NumPy, spaces |
| Mencatat dependensi | `04-dependencies-web.png` | `web/package.json`: Next.js, React, TypeScript |
| Mengunggah | `05-upload-huggingface.png` | Space files: the model, `app.py`, `requirements.txt`, `README.md`. Status Running on Zero |
| Mengunggah | `05-upload-vercel.png` | Production deployment Ready, domain `stay-awake-eight.vercel.app`, source `main` `1c594d8` |
| Menguji aplikasi | `06-test-gradio-open.png` | Open eye on Gradio: Awake, score 1.000 |
| Menguji aplikasi | `06-test-gradio-closed.png` | Closed eye on Gradio: Awake, score 1.000 |
| Menguji aplikasi | `06-test-web-open.png` | Same open eye through the website: Awake, score 1.000 |
| Menguji aplikasi | `06-test-web-closed.png` | Same closed eye through the website: Awake, score 1.000 |

The open-eye result matches the label. The closed-eye result does not. Both hosts agree, so the website is calling the Space. Section 6.5 of the repository README is the place that explains why a crop from this sheet can still score Awake.
