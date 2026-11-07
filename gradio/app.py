import numpy as np
from PIL import Image
import gradio as gr
import keras
import spaces

model = keras.saving.load_model("StayAwake.keras")


def predict(image):
    if image is None:
        return "Upload an image."
    gray = Image.fromarray(image).convert("L").resize((64, 64))
    pixels = np.asarray(gray, dtype="float32").reshape(1, 64, 64, 1)
    score = float(model.predict(pixels, verbose=0)[0][0])
    label = "Awake" if score >= 0.5 else "Not awake"
    return f"{label}\nscore {score:.3f}"


@spaces.GPU
def _gpu_noop(value: str) -> str:
    return value


demo = gr.Interface(
    fn=predict,
    inputs=gr.Image(type="numpy", label="Image"),
    outputs=gr.Textbox(label="Result"),
    title="Stay Awake",
    description="64×64 grayscale CNN. The network rescales pixels by 1/255. A score of 0.5 or higher is labeled Awake.",
)
demo.launch()
