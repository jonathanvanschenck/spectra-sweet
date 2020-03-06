# Seabreeze-Server
A Flask server to host an Ocean Optics spectrometer

# To setup
```bash
$ python3 -m venv venv
$ source venv/bin/activate
(venv) $ pip install -r requirements.txt
```

# To Run
```bash
$ gunicorn wsgi --worker-class eventlet -w 1 --bind localhost:8000
```