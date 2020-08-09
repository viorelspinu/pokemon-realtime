
#!/usr/bin/python
# -*- coding: utf-8 -*-

from __future__ import absolute_import

from time import sleep

from google.cloud import speech_v1p1beta1
import io
from flask import Flask, render_template
from flask_sockets import Sockets
import base64
from google_cloud_service import GoogleCloudService
import os
import datetime


import sys


#call to google speech gets blocked; see https://github.com/grpc/grpc/issues/4629 
from gevent import monkey
monkey.patch_all()
import grpc.experimental.gevent as grpc_gevent
grpc_gevent.init_gevent()
#--------


app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.debug=True
sockets = Sockets(app)


google_cloud_service = GoogleCloudService()

@app.after_request
def add_header(r):

    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r


@sockets.route('/chat')
def chat_socket(ws):
    while not ws.closed:
        message = ws.receive()
        if message is None:
            continue

        if(message.startswith("____BASE64____")):
            message = message.replace("____BASE64____", "")
            audio_content = base64.b64decode(message)

            text = google_cloud_service.do_speech_to_text_post(audio_content, "en-US")
            now = datetime.datetime.now()
            print(now.strftime("%Y-%m-%d %H:%M:%S") + " " + text)
            ws.send("___STT_TEXT_RESPONSE___" + text)    

        if(message.startswith("__SAY__TEXT__")):
            pokemon_name = message.replace("__SAY__TEXT__", "")        
            mp3_base64 = base64.b64encode(google_cloud_service.do_text_to_speech(pokemon_name))
            ws.send("___POKEMON_NAME_MP3___" + mp3_base64.decode("utf-8"))



@app.route('/')
def index():
    google_cloud_service.do_text_to_speech("azumaril")
    return render_template('index1.html')



if __name__ == '__main__':
    print("""
This can not be run directly because the Flask development server does not
support web sockets. Instead, use gunicorn:

gunicorn -b 127.0.0.1:8080 -k flask_sockets.worker main:app

""")
