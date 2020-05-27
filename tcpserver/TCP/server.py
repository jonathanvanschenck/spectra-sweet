import seabreeze_server as sbs
import os

EMULATE = os.environ.get("EMULATE") or '1'
EMULATE = bool(int(EMULATE))

HOST, PORT = '0.0.0.0', 8002

if __name__ == "__main__":
    with sbs.server.SeaBreezeServer((HOST, PORT), emulate = EMULATE) as server:
        print("Hosting @",server.server_address)
        server.serve_forever()
