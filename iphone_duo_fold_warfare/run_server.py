#!/usr/bin/env python3
import os
import webbrowser
from http.server import HTTPServer, SimpleHTTPRequestHandler

PORT = 8080

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer(("127.0.0.1", PORT), SimpleHTTPRequestHandler)
    url = f"http://127.0.0.1:{PORT}/index.html"
    print(f"🚀 iPhone Duo Tactical Fold Warfare Server Running at: {url}")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Server stopped.")