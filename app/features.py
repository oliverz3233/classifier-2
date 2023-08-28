from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import pandas as pd
import numpy as np
from scipy.io import wavfile
from app.processing.mfe.dsp import generate_features
import wave
import json
import soundfile as sf

app = Flask(__name__)
CORS(app)   

@app.route('/')
def index():
    return render_template('index.html')

def write_audio_blob_to_wav(output_path, audio_data, sample_rate):
    sf.write(output_path, audio_data, sample_rate)


@app.route('/upload', methods=['POST'])
def upload_file():
    audio_blob = request.files['audio']
    binary_blob = audio_blob.read()
    with open('audio.wav', 'wb') as f:
        f.write(binary_blob)
    samrate, data = wavfile.read('audio.wav')
    listData = []
    if(len(data.shape) == 1):
        for i in range(0, data.shape[0]):
            listData.append(data[i])
    else:
        for i in range(0, data.shape[0]):
            listData.append(data[i][0])
    raw_features = np.array(listData)
    result = generate_features(implementation_version=3,
                            draw_graphs=False,
                            raw_data=raw_features,
                            axes=[""],
                            sampling_freq=samrate,
                            frame_length=0.02,
                            frame_stride=0.01,
                            num_filters=40,
                            fft_length=256,
                            low_frequency=0,
                            high_frequency=0,
                            win_size=1000,
                            noise_floor_db=-52)
    result_json = json.dumps(result['features'])
    return result_json

if __name__ == '__main__':
   app.run()