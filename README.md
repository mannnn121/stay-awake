# Stay Awake

UTS Pembelajaran Mendalam, semester Ganjil, TA 2026-2027. A CNN scores a grayscale eye image as awake or not awake.

The headings below follow Format Laporan UTS Pembelajaran Mendalam. Detail sits in a nested heading only where the step needs it. Training numbers come from `notebook/eye_detection_model.ipynb`.

## Cover

| Field | Value |
| --- | --- |
| Judul | Stay Awake |
| Mata kuliah | Pembelajaran Mendalam |
| Semester | Ganjil |
| Tahun ajaran | 2026-2027 |
| Nama kelompok | Filled on the report cover |
| NIM dan nama anggota | Filled on the report cover |

## Bagian awal

### Daftar isi

1. Kompleksitas masalah
2. Dataset yang digunakan
3. Exploratory data analysis
4. Preprocessing data
5. Model yang digunakan
6. Hasil evaluasi
7. Teknologi yang digunakan
8. Deployment dan demo
9. Lampiran
10. Daftar pustaka
11. Bagian B, tautan

### Daftar gambar

All five figures are produced by the notebook.

| Figure | Notebook cell |
| --- | --- |
| Class distribution bar chart | Exploratory data analysis |
| One open-eye sample and one closed-eye sample | Exploratory data analysis |
| Training and validation accuracy | After `model.fit` |
| Training and validation loss | After `model.fit` |
| Confusion matrix on the 600-image test set | Classification report cell |

### Daftar tabel

| Table | Section |
| --- | --- |
| Class counts | 2.2 |
| Architecture | 5.2 |
| Training configuration | 5.3 |
| Test metrics | 6.2 |
| Libraries | 7.2 |
| Public links | Bagian B |

### Pembagian tugas

The report table has four columns: NIM, nama, peran, and rincian pekerjaan. The group roster is filled there. The work in this repository splits into the notebook (data and training), `gradio/` (inference API), and `web/` (the page).

## 1. Kompleksitas masalah

The task is to tell an open eye from a closed eye. A closed eye is the stand-in for not awake.

### 1.1 Mengapa masalah ini dianggap kompleks

The input is a small grayscale crop. Lighting, eyelid shape, glasses, and blur change how the same class looks. A full face or a photo that is not an eye is a different kind of image from the training crops. The page still accepts any photo and resizes the whole frame to 64×64.

### 1.2 Tantangan utama

The network only learns the eye crops in the MRL folders. The deployed page scores whatever the camera or the file picker sends. A score from a full face is not the same measurement as a score from `Open_Eyes` or `Closed_Eyes`. Checking the deployment against the notebook means submitting a tight eye crop.

### 1.3 Pengembangan dari Tugas Proyek 2

This repository does not record Tugas Proyek 2. In the report, name what was added, replaced, or kept from that assignment. What this repository contains is the CNN in the notebook, the Gradio Space, and the Next.js page.

## 2. Dataset yang digunakan

### 2.1 Sumber dataset

[MRL Eye Dataset](https://www.kaggle.com/datasets/prasadvpatil/mrl-dataset), Kaggle user `prasadvpatil/mrl-dataset`, license CC0-1.0.

#### 2.1.1 Unduh

The notebook downloads the zip with the Kaggle CLI, then unzips it.

1. Create a Kaggle API token and save it as `kaggle.json`.
2. On Colab, place that file at `~/.kaggle/kaggle.json` with permissions `600` before the download cell. The notebook does not copy the token itself.
3. Run the download cell:

```bash
pip install -q kaggle
kaggle datasets download prasadvpatil/mrl-dataset
```

4. The next cell unzips `mrl-dataset.zip` into `/content/`. After that, the images are in `/content/train/Open_Eyes` and `/content/train/Closed_Eyes`.
5. On a machine that is not Colab, change both `/content/` paths in the notebook to the directory where you unzipped the file. `PATH` must be the folder that contains `Open_Eyes` and `Closed_Eyes`.

### 2.2 Jumlah data, kelas, format, dan ukuran

| Folder | Label | Images loaded |
| --- | --- | --- |
| `train/Open_Eyes` | 1, Awake | 2000 |
| `train/Closed_Eyes` | 0, Not awake | 2000 |

4000 images loaded, 0 files skipped. Each file is stored as a 64×64 grayscale array, one channel.

### 2.3 Real-world atau sintetis

Real eye photographs from the MRL set. The training augmentation is synthetic, and it is applied only while `fit` is running.

### 2.4 Kompleksitas dataset

Two balanced classes of tight eye crops. The variation is appearance inside the crop, not a mix of faces, scenes, and eyes. That is why a webcam frame is harder than the test split.

## 3. Exploratory data analysis

### 3.1 Distribusi label

2000 open and 2000 closed. The bar chart is in the notebook.

### 3.2 Word count

The dataset is images, so there is no word count.

### 3.3 Histogram fitur numerik

There is no tabular feature matrix. Pixel values are scaled later by `Rescaling(1/255)`.

### 3.4 Korelasi antarfitur

There are no tabular columns to correlate.

### 3.5 Contoh sampel per kelas

The notebook shows one open eye (`X[0]`, label 1) and one closed eye (`X[-1]`, label 0), both after the grayscale resize.

### 3.6 Temuan yang memengaruhi preprocessing

The files are already eye crops, and the two folders are the labels. Preprocessing is grayscale, resize to 64×64, and a rescale inside the network. No text cleanup and no class rebalancing.

## 4. Preprocessing data

### 4.1 Pembersihan

Unreadable files are caught and skipped. This run skipped 0 files.

### 4.2 Resize dan rescale

`Image.open(path).convert("L").resize((64, 64))` stores one channel at 64×64. `Rescaling(1/255)` inside the model maps pixels to `[0, 1]`. Inference must not divide by 255 a second time.

### 4.3 Augmentasi

Inside the model, active only during training:

| Layer | Setting |
| --- | --- |
| `RandomFlip` | horizontal |
| `RandomRotation` | 0.1 turns (about 36°), `fill_mode="nearest"` |
| `RandomTranslation` | 0.2 height, 0.2 width, `fill_mode="nearest"` |

### 4.4 Missing value, outlier, dan ketidakseimbangan

The load step reported no missing files. The classes are equal, so there is no rebalancing and no imputation.

### 4.5 Pembagian data

`train_test_split`, `shuffle=True`, `stratify`, `random_state=42`. The first call holds out 30%. The second call splits that holdout in half.

| Split | Images | Share |
| --- | --- | --- |
| Train | 2800 | 70% |
| Validation | 600 | 15% |
| Test | 600 | 15% |

The test set is not passed to `fit`. Random augmentation runs only in training mode, so validation and test see the original crops.

## 5. Model yang digunakan

### 5.1 Jenis model

A CNN trained from scratch. No pretrained backbone.

### 5.2 Arsitektur

Input `(64, 64, 1)`.

| Stage | Layers |
| --- | --- |
| Input | `Rescaling(1/255)`, then the augmentation block |
| Block 1 | Conv2D 32, 3×3, same → BatchNorm → ReLU → MaxPool |
| Block 2 | Conv2D 64, 3×3, same → BatchNorm → ReLU → MaxPool |
| Block 3 | Conv2D 64, 3×3, same → BatchNorm → ReLU → MaxPool |
| Block 4 | Conv2D 128, 3×3, same → BatchNorm → ReLU → MaxPool |
| Head | Flatten → Dense 128, ReLU → Dropout 0.5 → Dense 1, sigmoid |

`model.summary()`: 393,153 parameters, of which 392,577 are trainable (1.50 MB) and 576 are not.

### 5.3 Konfigurasi pelatihan

| Setting | Value |
| --- | --- |
| Optimizer | Adam, learning rate 0.001 |
| Loss | binary crossentropy |
| Metric | accuracy |
| Batch size | 32 |
| Epochs | up to 30 |
| Train pipeline | shuffle buffer 1000, seed 42, then batch and prefetch |
| EarlyStopping | `val_loss`, patience 10, `restore_best_weights=True` |
| ReduceLROnPlateau | `val_loss`, factor 0.5, patience 3, `min_lr=1e-6` |

A sigmoid score of 0.5 or higher is **Awake**. Below 0.5 is **Not awake**.

### 5.4 Alasan pemilihan

The input is a 64×64 single-channel crop, so four small conv blocks can see the eyelid without a large pretrained network. Dropout and the learning-rate schedule are there because the training split is 2800 images.

### 5.5 Dua fitur unik

#### 5.5.1 Augmentasi di dalam jaringan

Eye crops shift and tilt between photos. `RandomFlip`, `RandomRotation(0.1)`, and `RandomTranslation(0.2, 0.2)` sit in the `Sequential` model, so each training batch is perturbed and inference is not. The notebook has no second run with augmentation turned off, so there is no side-by-side accuracy delta. The log shows training accuracy starting at 0.812 while validation accuracy stays at 0.500 for three epochs, then validation accuracy reaching 1.000 after the learning rate drops.

#### 5.5.2 Early stopping dan penurunan learning rate

ReduceLROnPlateau cut the learning rate at epochs 4, 16, 21, 24, and 27: 0.001, then 0.0005, 0.00025, 0.000125, 6.25e-5, and 3.125e-5. Early stopping fired at epoch 29 and restored epoch 19. End of epoch 19 validation loss was 2.7745e-05, the lowest `val_loss` in that run.

## 6. Hasil evaluasi

### 6.1 Metrik

Accuracy, precision, recall, and F1. Precision and recall separate the two mistakes this project cares about: a closed eye marked open, and an open eye marked closed. Accuracy is included because the test set is balanced, 300 and 300.

### 6.2 Nilai pada data testing

After restoring epoch 19, on 600 test images:

| | |
| --- | --- |
| Test loss | 0.000014 |
| Test accuracy | 100% |
| Closed precision / recall / F1 | 1.0000 / 1.0000 / 1.0000 (support 300) |
| Open precision / recall / F1 | 1.0000 / 1.0000 / 1.0000 (support 300) |

### 6.3 Grafik loss dan akurasi

The notebook plots training and validation accuracy, then training and validation loss, for the epochs that ran before early stopping.

### 6.4 Perbandingan antarskenario

One training run. There is no second hyperparameter setting and no ablation of the two features in section 5.5.

### 6.5 Analisis hasil

On this split the confusion matrix is diagonal: every held-out eye crop is correct. Training and validation accuracy both end at 1.000. That fit is on crops from the same two folders.

The page resizes the whole camera frame or upload to 64×64 grayscale. A face, a bright background, or a loose crop is outside the test set. Use an eye crop when comparing the live score with section 6.2. For the required wrong prediction in the demo video, use an input that is not a tight eye crop. The test split itself has no misclassified image.

## 7. Teknologi yang digunakan

### 7.1 Bahasa

Python 3.12 on the Hugging Face Space. TypeScript on the Next.js page.

### 7.2 Library dan versinya

| Library | Version | Where |
| --- | --- | --- |
| TensorFlow | 2.20.0 | `gradio/requirements.txt` |
| Keras | 3.13.2 | `gradio/requirements.txt` |
| Gradio | `gradio>=4` | `gradio/requirements.txt` |
| Pillow | unpinned | `gradio/requirements.txt` |
| NumPy | unpinned | `gradio/requirements.txt` |
| `spaces` | unpinned | Hugging Face runtime helper |
| scikit-learn, matplotlib, seaborn, tqdm, pandas | notebook imports | training and the figures in section 3 and section 6 |
| Next.js | `^15.5.4` | `web/package.json` |
| React | `^19.1.1` | `web/package.json` |
| TypeScript | `^5.9.2` | `web/package.json` |

### 7.3 Lingkungan pengembangan

The notebook paths are Google Colab (`/content/`). The Colab GPU type is not recorded in the notebook output. Retrain with the same seed, 42.

Inference on the Space is CPU. `predict` is not wrapped in `@spaces.GPU`. A CUDA line in the Space log means the container has no GPU for that process.

#### 7.3.1 Paket untuk menjalankan notebook di luar Colab

Colab already has the training libraries. On another machine, install the inference pins plus the notebook libraries:

```bash
python -m venv .venv
.venv/bin/pip install "tensorflow==2.20.0" "keras==3.13.2" scikit-learn pillow matplotlib seaborn tqdm pandas kaggle
```

Then apply the path change in section 2.1.1.

### 7.4 Framework aplikasi dan hosting

| Piece | Role |
| --- | --- |
| Gradio on Hugging Face Space `ferropayo/stay-awake` | Loads `StayAwake.keras` and serves `POST /gradio_api/call/predict` |
| Next.js on Vercel project `stay-awake`, root directory `web/` | Page at https://stay-awake-eight.vercel.app |

The browser posts the image to `/api/predict`. That route calls the Space. The page does not load Keras.

## 8. Deployment dan demo

### 8.1 Link deployment

| | |
| --- | --- |
| Aplikasi | https://stay-awake-eight.vercel.app |
| API | https://huggingface.co/spaces/ferropayo/stay-awake |
| API reference | https://ferropayo-stay-awake.hf.space/?view=api |
| Source | https://github.com/mannnn121/stay-awake |

The app, the Space, and the GitHub repository open without a login. `HF_SPACE_URL` overrides the Space address. The default in `web/app/api/predict/route.ts` is `https://ferropayo-stay-awake.hf.space`.

### 8.2 Tahapan deployment

Screenshots of these steps are in [`report/8b-deployment`](report/8b-deployment/README.md). Each file there maps to one PDF 8b step.

#### 8.2.1 Menyimpan model

Run the notebook through the save cell, or reuse the file already in the repo. The save cell writes `StayAwake.keras`. Copy it to `gradio/StayAwake.keras`.

The file must keep input `(64, 64, 1)`, the internal `Rescaling(1/255)`, and one sigmoid output. `predict` assumes that shape and the 0.5 threshold.

#### 8.2.2 Menyiapkan skrip inferensi

`gradio/app.py` is the inference program. Hugging Face runs it as the Space.

On startup it loads `StayAwake.keras` once with `keras.saving.load_model`. `predict` then:

1. Receives a NumPy image from `gr.Image(type="numpy")`.
2. Converts it to grayscale and resizes it to 64×64. It does not divide by 255.
3. Calls `model.predict` on shape `(1, 64, 64, 1)`.
4. Labels a score of 0.5 or higher as `Awake`, otherwise `Not awake`.
5. Returns the label, a newline, and `score 0.000`.

`gr.Interface(fn=predict)` publishes `POST /gradio_api/call/predict`. `_gpu_noop` is marked `@spaces.GPU` and is never called.

Run the same file locally:

```bash
cd gradio
python -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python app.py
```

Gradio listens at http://127.0.0.1:7860. Node.js 20 is the version to use for the website in the next section.

#### 8.2.3 Membangun antarmuka dan API

The Space UI is the Gradio interface. The course demo page is `web/`.

`web/app/api/predict/route.ts` does three calls:

1. `POST /gradio_api/upload` with the image.
2. `POST /gradio_api/call/predict` with the returned file path.
3. `GET /gradio_api/call/predict/{event_id}` and parse the server-sent event into `{ label, score, raw }`.

On the page, the controls are **Use camera**, **Capture**, **Stop camera**, **Or choose an image**, and **Score image**. Capture stores a JPEG named `capture.jpg` and sends it through the same form as an uploaded file.

Camera capture works on `https://` and on `localhost`. Another host served as plain `http://` will not open the camera. Upload still works there.

Local website, calling the live Space:

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000.

Local website, calling local Gradio, from `web/` while `app.py` is running:

```bash
HF_SPACE_URL=http://127.0.0.1:7860 npm run dev
```

#### 8.2.4 Mencatat dependensi

| File | What it pins |
| --- | --- |
| `gradio/requirements.txt` | keras 3.13.2, tensorflow 2.20.0, gradio, pillow, numpy, spaces |
| `web/package.json` | Next.js, React, TypeScript |
| Section 7.3.1 | Notebook libraries, which Colab already provides |

`.gitignore` keeps `node_modules/`, `.next/`, `.venv/`, and env files out of git. `web/.gitignore` repeats the Node rules because Vercel builds from `web/`.

#### 8.2.5 Mengunggah

GitHub, Vercel, and the Space are three copies. Pushing the repository updates GitHub and, for files under `web/`, triggers Vercel. The Space changes only when its own files are uploaded.

##### 8.2.5.1 Space pertama kali

1. Install the Hugging Face CLI and log in to the account that owns the Space:

```bash
pip install -U huggingface_hub
hf auth login
```

2. Create a public Space, SDK Gradio, Python 3.12, app file `app.py`, CPU hardware. `predict` does not request a GPU.
3. Upload the four Space files. Do not upload the `gradio/` directory after `.venv/` exists. That would send the virtualenv.

```bash
hf upload ferropayo/stay-awake gradio/README.md README.md --repo-type space --commit-message "Add Space card"
hf upload ferropayo/stay-awake gradio/requirements.txt requirements.txt --repo-type space --commit-message "Add Python dependencies"
hf upload ferropayo/stay-awake gradio/app.py app.py --repo-type space --commit-message "Add inference app"
hf upload ferropayo/stay-awake gradio/StayAwake.keras StayAwake.keras --repo-type space --commit-message "Add StayAwake weights"
```

4. Wait for the restart described in section 8.2.5.4.

##### 8.2.5.2 Vercel

1. Push this repository to GitHub.
2. Import it in Vercel. Set the root directory to `web` and the framework preset to Next.js.
3. Leave `HF_SPACE_URL` unset to use `https://ferropayo-stay-awake.hf.space`.
4. Production is https://stay-awake-eight.vercel.app.

##### 8.2.5.3 Memperbarui bobot

A new `StayAwake.keras` on disk does not change the live site until the Space file is replaced. Vercel does not need a new deploy for a weight-only change.

1. Save the network from the notebook.
2. Copy it to `gradio/StayAwake.keras`.
3. Commit it if the GitHub copy should match the demo.
4. Upload the weights:

```bash
hf upload ferropayo/stay-awake gradio/StayAwake.keras StayAwake.keras --repo-type space --commit-message "Update StayAwake weights"
```

5. Wait for section 8.2.5.4, then score one open-eye crop and one closed-eye crop on https://ferropayo-stay-awake.hf.space. http://127.0.0.1:7860 still has whatever file is on this machine. It does not prove the upload.
6. Reload https://stay-awake-eight.vercel.app and submit the same two crops.

`app.py` and `requirements.txt` use the same `hf upload` command, with that file as the local path and the remote path. If `predict` starts returning a different string, change the parser in `web/app/api/predict/route.ts` and redeploy Vercel.

##### 8.2.5.4 Log Space

Log in as the Space owner and open https://huggingface.co/spaces/ferropayo/stay-awake, then open **Logs**. https://huggingface.co/spaces/ferropayo/stay-awake/logs returns 404.

A finished start ends with `Running on local URL: http://0.0.0.0:7860`. Pip running as root, the oneDNN line, and `CUDA_ERROR_NO_DEVICE` appear because this CPU Space has no GPU. `Exception ignored` with `Invalid file descriptor: -1` is event-loop cleanup during startup. The process is up once the local URL line is printed.

#### 8.2.6 Menguji aplikasi

1. On https://ferropayo-stay-awake.hf.space, upload one crop from `Open_Eyes` and one from `Closed_Eyes`.
2. On https://stay-awake-eight.vercel.app, use **Or choose an image** for the same two crops and press **Score image**. The label and the three-decimal score should match the Space.
3. Press **Use camera**, then **Capture**, then **Score image**. The preview is the full frame. The model receives that frame resized to 64×64, as in section 6.5.

The captures in `report/8b-deployment/` use `samples/open-eye.png` and `samples/closed-eye.png`. On 7 Nov 2026 both the Space and the website labeled each of those crops Awake, score 1.000. The open eye matches its label. The closed eye does not. The two hosts returned the same score.

### 8.3 Video demo dan deployment

Record a video that can be opened without a login, on YouTube or Google Drive, and put the URL in Bagian B. Show:

1. The page at https://stay-awake-eight.vercel.app: **Use camera** / **Capture** or **Or choose an image**, then **Score image**, including the label and the score.
2. One prediction that matches the crop’s folder, and one prediction on an input that is not a tight eye crop.
3. The two features in section 5.5, from the notebook: the augmentation layers, and the early-stopping line that restores epoch 19.
4. The deployment path in section 8.2: saved `StayAwake.keras`, `gradio/app.py`, `requirements.txt`, the Space, and the Vercel page.

The video is not recorded yet.

## 9. Lampiran

### 9.1 Cuplikan kode

| Report item | File |
| --- | --- |
| Load, clean, resize | notebook, “Load and Preprocess Images” |
| Split | notebook, “Split into Train, Validation, and Test Sets” |
| Augmentation and architecture | notebook, “Define Data Augmentation” and “Build CNN Model” |
| Callbacks | notebook, “Define Callbacks” |
| Test metrics and confusion matrix | notebook, evaluation cells after training |
| Save | notebook, `model.save` |
| Inference | `gradio/app.py`, function `predict` |
| Web UI and camera | `web/app/page.tsx` |
| API proxy | `web/app/api/predict/route.ts` |

### 9.2 Grafik evaluasi

Same figures as Daftar gambar: accuracy curve, loss curve, and confusion matrix, all in the notebook.

## 10. Daftar pustaka

- MRL Eye Dataset, Kaggle, prasadvpatil/mrl-dataset, CC0-1.0. https://www.kaggle.com/datasets/prasadvpatil/mrl-dataset
- Keras. https://keras.io
- Gradio, querying apps over HTTP. https://www.gradio.app/guides/querying-gradio-apps-with-curl
- Hugging Face Spaces API. https://huggingface.co/docs/hub/spaces-api-endpoints

## Bagian B. Tautan

These three open without an access request. The video row is still empty.

| | |
| --- | --- |
| B.1 Source code | https://github.com/mannnn121/stay-awake |
| B.2 Video demo dan tahapan deployment | Public YouTube or Google Drive URL, still to be added |
| B.3 Aplikasi | https://stay-awake-eight.vercel.app |

The API behind B.3 is https://huggingface.co/spaces/ferropayo/stay-awake.
