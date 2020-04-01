import seabreeze_server as sbs

HOST, PORT = 'localhost', 8002

if __name__ == "__main__":
    with sbs.server.SeaBreezeServer((HOST, PORT), emulate = True) as server:
        print("Hosting @",server.server_address)
        server.serve_forever()