from app import app
from flask import render_template, url_for

@app.route('/')
@app.route('/index', methods=['GET', 'POST'])
def index():
    return render_template('index.html')

@app.route('/gui', methods=['GET', 'POST'])
def gui():
    return render_template('gui.html')

@app.route('/raw')
def raw():
    return render_template('raw.html')
