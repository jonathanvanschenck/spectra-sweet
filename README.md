# Spectra? Sweet!
A web-based, open-source, user interface for OceanOptics spectromters based on `python-seabreeze`, `python-flask`, `python-seabreeze-server` and `d3.js`

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
