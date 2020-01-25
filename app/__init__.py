from flask import Flask
from flask_socketio import SocketIO
from app.webspectrometer import SpectrometerManager

spec_manager = SpectrometerManager(emulate=True)

app = Flask(__name__)

socketio = SocketIO(app)

from app import routes, events