from google.cloud import speech_v1p1beta1
import io

import pyaudio
import wave
from time import sleep
from google.cloud.speech_v1p1beta1 import enums
from google_cloud_service import GoogleCloudService

def record():

    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 44100
    CHUNK = 1024
    RECORD_SECONDS = 2
    WAVE_OUTPUT_FILENAME = "file.wav"

    audio = pyaudio.PyAudio()

    print("recording...")
    sleep(0.1)
    # start Recording
    stream = audio.open(format=FORMAT, channels=CHANNELS,
                        rate=RATE, input=True,
                        frames_per_buffer=CHUNK)
    frames = []

    for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
        data = stream.read(CHUNK)
        frames.append(data)
    print("finished recording")

    # stop Recording
    stream.stop_stream()
    stream.close()
    audio.terminate()

    waveFile = wave.open(WAVE_OUTPUT_FILENAME, 'wb')
    waveFile.setnchannels(CHANNELS)
    waveFile.setsampwidth(audio.get_sample_size(FORMAT))
    waveFile.setframerate(RATE)
    waveFile.writeframes(b''.join(frames))
    waveFile.close()


def sample_recognize(local_file_path):

    client = speech_v1p1beta1.SpeechClient()
    enable_word_confidence = True

    phrases = ["altaria", "azumarill", "skarmory", "registeel", "venusaur", "umbreon"]
    boost = 100.0
    speech_contexts_element = {"phrases": phrases, "boost": boost}
    speech_contexts = [speech_contexts_element]

    language_code = "en-US"
    config = {
        "encoding":enums.RecognitionConfig.AudioEncoding.LINEAR16,
        "speech_contexts": speech_contexts,
        "enable_word_confidence": enable_word_confidence,
        "language_code": language_code,
        "audio_channel_count":1,
    }
    with io.open(local_file_path, "rb") as f:
        content = f.read()
    audio = {"content": content}

    response = client.recognize(config, audio)

    for result in response.results:
        for alternative in result.alternatives:
            print('=' * 20)
            print('transcript: ' + alternative.transcript)


while(True):
    #input("Press Enter to continue...")
    #record()
    #sample_recognize("file.wav")
    #sample_recognize("./file.wav")

    #with io.open("./s.wav", "rb") as f:
    #    content = f.read()

    #with io.open("./b.wav", "rb") as f:
    #    content = f.read()
    service = GoogleCloudService()
    service.do_speech_to_text_post('b', "en-US")

