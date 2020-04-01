# Spectra? Sweet!
A web-based, open-source, user interface for OceanOptics spectrometers based on `python-seabreeze`, `python-flask`, `python-seabreeze-server` and `d3.js`

# To setup
```bash
$ python3 -m venv venv
$ source venv/bin/activate
(venv) $ pip install -r requirements.txt
(venv) $ seabreeze_os_setup
```


# To Run (local only)
In one terminal:
```bash
 (venv) $ python TCP/server.py

```
In another terminal:
```bash
 (venv) $ gunicorn wsgi --worker-class eventlet -w 1 --bind localhost:8000
```

# To Run (on server)
## Firewall: `ufw`
```bash
 $ sudo apt-get install ufw
 $ sudo ufw enable
 $ sudo ufw allow 8001/tcp
 $ sudo ufw allow http
```
## Reverse Proxy: `nginx`
Install `nginx` and modify the configuration file:
```bash
 $ sudo apt-get install nginx
 $ sudo vim /etc/nginx/nginx.conf
```
Add this to the file
```
# ...

stream {
    server (
        listen 8001;
        proxy_pass 127.0.0.1:8002;
    )
}

# ...
```
Then reset the default `sites-allowed`, and create a new one:
```bash
 $ sudo mv /etc/ngnix/sites-enabled/default /etc/nginx/sites-enabled/.default
 $ sudo vim /etc/nginx/sites-enabled/spectra-sweet
```
and dump this into there, replacing `/path/to` with the proper path
```
server {
	listen 80;
	server_name _;
	
	access_log /var/log/spectra-sweet_access.log;
	error_log /var/log/spectra-sweet_error.log;

	location / {
		proxy_pass http://localhost:8000;
		proxy_redirect off;
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forward-For $proxy_add_x_forwarded_for;
	}

	location /static {
		alias /path/to/spectra-sweet/app/static;
		expires 30d;
	}

	location /socket.io {
		# let WebSockets function properly
		include proxy_params;
		proxy_http_version 1.1;
		proxy_buffering off;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "Upgrade";
		proxy_pass http://localhost:8000/socket.io;
	}
}

```
Check syntax and reload
```bash
 $ sudo nginx -t
 $ sudo systemctl restart nginx
```
## Supervisor
Install `supervisor`:
```bash
 $ sudo apt-get install supervisor
```
Now create a configuration file for `spectra-sweet` and another for `seabreeze-server`
```bash
 $ sudo vim /etc/supervisor/conf.d/spectra-sweet.conf
```
and dump in this replacing proper `/path/to`s and `user_name`:
```
[program:spectra-sweet]
command=/path/to/spectra-sweet/venv/bin/gunicorn wsgi --worker-class eventlet -w 1 --bind localhost:8000
directory=/path/to/spectra-sweet
user=user_name
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
```
Then
```bash
 $ sudo vim /etc/supervisor/conf.d/seabreeze-server.conf
```
and dump in this replacing proper `/path/to`s and `user_name`:
```
[program:seabreeze-server]
command=/path/to/spectra-sweet/venv/bin/python TCP/server.py
directory=/path/to/spectra-sweet
user=user_name
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
```
Then reload supervisor:
```bash
 $ sudo supervisorctl reload
```