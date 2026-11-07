# stay-awake

UTS Pembelajaran Mendalam: a CNN that scores an eye image as awake or not awake.

## Accounts

These are the accounts already signed in through the Orca browser. Git on this machine stays on a separate GitHub identity.

| Role | Account |
| --- | --- |
| Hugging Face API | [ferropayo/stay-awake](https://huggingface.co/spaces/ferropayo/stay-awake) |
| GitHub source | [mannnn121/stay-awake](https://github.com/mannnn121/stay-awake) (display name 0b1111001) |
| Vercel frontend | team `0b1111001's projects` (`0b1111001`, anderusman2004@gmail.com) |

This checkout pushes with a dedicated SSH host so it does not use the other GitHub account:

```
Host github.com-mannnn121
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_mannnn121
  IdentitiesOnly yes
```

The remote is `git@github.com-mannnn121:mannnn121/stay-awake.git`.

## What runs where

The model is the Keras network in `StayAwake.keras`. It takes a 64×64 grayscale image, rescales pixels by 1/255, and returns a sigmoid score. A score of 0.5 or higher is labeled **Awake**.

- `gradio/` is the Hugging Face Space. Gradio exposes `POST /gradio_api/call/predict`.
- `web/` is the Next.js frontend. The browser uploads to `/api/predict`, and that route forwards the image to the Space.
- `space/` is an earlier static ONNX demo that runs entirely in the browser.
- `notebook/eye_detection_model.ipynb` is the training notebook. The dataset is [MRL Eye Dataset](https://www.kaggle.com/datasets/prasadvpatil/mrl-dataset).

## Local frontend

```bash
cd web
npm install
npm run dev
```
