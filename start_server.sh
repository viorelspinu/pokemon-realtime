
gunicorn -b 0.0.0.0:8080 --reload -k flask_sockets.worker main:app
