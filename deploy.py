"""Deploy the portfolio to Netlify: static files + netlify/functions (the contact form auto-reply).

Usage:  python deploy.py
Needs a Netlify personal access token saved in C:\\Users\\<you>\\netlify-token.txt (never inside this folder).
Do not drag-and-drop the folder onto Netlify instead: drag-and-drop deploys drop the functions,
which switches the auto-reply email off.
"""
import hashlib
import io
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
SITE_ID = "1f9100bc-9e26-484f-b94e-4a066c4a0ac2"  # jahanzeb-akhtar.netlify.app
API = "https://api.netlify.com/api/v1"
TOKEN_FILE = os.path.join(os.path.expanduser("~"), "netlify-token.txt")
NOT_PUBLIC = {"CLAUDE.md", "README.md", "deploy.py", "netlify.toml"}  # top-level files that stay off the website


def api(method, path, data=None, raw=False):
    body = data if raw else (json.dumps(data).encode() if data is not None else None)
    req = urllib.request.Request(API + path, data=body, method=method, headers={
        "Authorization": "Bearer " + TOKEN,
        "Content-Type": "application/octet-stream" if raw else "application/json",
        "User-Agent": "portfolio-deploy",
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            out = r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"Netlify API {method} {path.split('?')[0]} failed: HTTP {e.code} {e.read()[:300]!r}")
    return json.loads(out) if out else {}


def static_files():
    files = {}
    for root, dirs, names in os.walk(ROOT):
        rel_root = os.path.relpath(root, ROOT)
        dirs[:] = [d for d in dirs if not d.startswith(".") and not (rel_root == "." and d == "netlify")]
        for name in names:
            if name.startswith(".") or (rel_root == "." and name in NOT_PUBLIC):
                continue
            rel = os.path.relpath(os.path.join(root, name), ROOT).replace(os.sep, "/")
            with open(os.path.join(root, name), "rb") as fh:
                files["/" + rel] = fh.read()
    return files


def function_zips():
    out, fn_dir = {}, os.path.join(ROOT, "netlify", "functions")
    for name in sorted(os.listdir(fn_dir)) if os.path.isdir(fn_dir) else []:
        if name.endswith(".js"):
            buf = io.BytesIO()
            with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
                z.write(os.path.join(fn_dir, name), name)
            out[name[:-3]] = buf.getvalue()
    return out


if __name__ == "__main__":
    if not os.path.isfile(TOKEN_FILE):
        sys.exit(f"Token file not found: {TOKEN_FILE}")
    TOKEN = open(TOKEN_FILE, encoding="utf-8").read().strip()

    files, fns = static_files(), function_zips()
    deploy = api("POST", f"/sites/{SITE_ID}/deploys", {
        "files": {p: hashlib.sha1(b).hexdigest() for p, b in files.items()},
        "functions": {n: hashlib.sha256(b).hexdigest() for n, b in fns.items()},
    })
    need, need_fn = set(deploy.get("required") or []), set(deploy.get("required_functions") or [])
    for p, b in files.items():
        if hashlib.sha1(b).hexdigest() in need:
            api("PUT", f"/deploys/{deploy['id']}/files{urllib.parse.quote(p)}", b, raw=True)
            print("uploaded", p)
    for n, b in fns.items():
        if hashlib.sha256(b).hexdigest() in need_fn:
            api("PUT", f"/deploys/{deploy['id']}/functions/{n}?runtime=js", b, raw=True)
            print("uploaded function", n)

    for _ in range(40):
        state = api("GET", f"/deploys/{deploy['id']}")
        if state.get("state") in ("ready", "error"):
            break
        time.sleep(3)
    print("state:", state.get("state"), "| functions:", [f.get("n") for f in state.get("available_functions") or []],
          "|", state.get("error_message") or state.get("ssl_url"))
