
#!/usr/bin/python
# -*- coding: utf-8 -*-

from __future__ import absolute_import
import grpc.experimental.gevent as grpc_gevent

from time import sleep

import io
from flask import Flask, render_template, current_app
import base64
import os
import datetime
from flask import jsonify
from os import listdir
from os.path import isfile, join
import string
from flask import request
from itertools import cycle
import base64
from flask_sockets import Sockets
from flask import g
import json
import sys


# call to google speech gets blocked; see https://github.com/grpc/grpc/issues/4629
from gevent import monkey
monkey.patch_all()
grpc_gevent.init_gevent()
# --------


app = Flask(__name__)
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.debug = True
sockets = Sockets(app)

app_context = app.app_context()
app_context.push()
current_app.ws = {}

@app.after_request
def add_header(r):

    r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    r.headers["Pragma"] = "no-cache"
    r.headers["Expires"] = "0"
    r.headers['Cache-Control'] = 'public, max-age=0'
    return r


def load_pokemon_data_from_file(cup, file):
    data = load_full_data_from_file(cup, file)
    return (data['pokemon'])


def load_full_data_from_file(cup, file):
    folder = "./data/compiled-data/" + cup
    with open(folder + "/" + file) as f:
        data = json.load(f)
        return (data)

@sockets.route('/chat')
def chat_socket(ws):    
    while not ws.closed:
        message = ws.receive()
        if message is None:
            continue
        if message.startswith("____CLIENT_ID____"):
            client_id = message.replace("____CLIENT_ID____", "")                    
            current_app.ws[client_id] = ws
    
            
@app.route('/app')
def index():
    return render_template('index3.html')

@app.route('/set')
def set():
    name = request.args.get('name')
    client_id = request.args.get('client_id')
    if (client_id in current_app.ws):
        ws = current_app.ws[client_id]
        if (not ws is None):
            send_websocket(ws, "___SET_NAME___" + name)
    return jsonify("{reply:ok}")

@app.route('/')
def landing():
    return render_template('landing.html')

@app.route('/all-pokemon')
def pokemon_list():
    #compute_and_write_all_pokemon_string("great")
    cup = request.args.get('cup')
    if (cup is None):
        cup = "ultra"
    with open("./data/response/" + cup + "-all-pokemon.base64") as f:
        data = f.read()
        return jsonify(data)

def send_websocket(ws, text):
    ws.send(text)


def compute_and_write_all_pokemon_string(cup):
    folder = "./data/compiled-data/" + cup
    pokemon_files = [f for f in listdir(folder) if isfile(join(folder, f))]
    pokemon_data = []
    for p in pokemon_files:
        current_pokemon_data = load_pokemon_data_from_file(cup, p)

        current_data = {}
        current_data['file'] = p
        current_data['pokemon_data'] = current_pokemon_data

        pokemon_data.append(current_data)

    result = jsonify(pokemon_data)
    message = result.get_data(as_text=True)
    key = ''
    cyphered = ''.join(chr(ord(c) ^ ord(k)) for c, k in zip(message, cycle(key)))
    base64_response = base64.b64encode(cyphered.encode("utf-8"))
    with open('./data/response/' + cup + "-all-pokemon.base64", 'wb') as f:
        f.write(base64_response)
        f.close
    # return jsonify(base64_response.decode("utf-8"))


@app.route('/my-pokemon')
def my_pokemon():
    cup = request.args.get('cup')
    if (cup is None):
        cup = "ultra"
    pokemon_files = request.args.get('files').split(',')
    pokemon_data = []
    for p in pokemon_files:
        current_data = load_full_data_from_file(cup, p + ".json")
        pokemon_data.append(current_data)

    result = jsonify(pokemon_data)
    message = result.get_data(as_text=True)
    key = ''
    cyphered = ''.join(chr(ord(c) ^ ord(k)) for c, k in zip(message, cycle(key)))
    base64_response = base64.b64encode(cyphered.encode("utf-8"))

    return jsonify(base64_response.decode("utf-8"))


if __name__ == '__main__':
    print("""
This can not be run directly because the Flask development server does not
support web sockets. Instead, use gunicorn:

gunicorn -b 127.0.0.1:8080 -k flask_sockets.worker main:app

""")
