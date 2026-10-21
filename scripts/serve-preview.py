"""Serve a static export locally, including a GitHub Pages repository prefix."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8088)
parser.add_argument('--base-path', default='')
args = parser.parse_args()
prefix = args.base_path.rstrip('/')
root = Path(__file__).resolve().parents[1] / 'out'


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path.split('?')[0] == prefix and prefix:
            self.send_response(302)
            self.send_header('Location', prefix + '/')
            self.end_headers()
            return
        if prefix and not self.path.startswith(prefix + '/'):
            self.send_error(404)
            return
        self.path = self.path[len(prefix):]
        super().do_GET()


print(f'Preview: http://localhost:{args.port}{prefix}/', flush=True)
ThreadingHTTPServer(('127.0.0.1', args.port), partial(Handler, directory=str(root))).serve_forever()
