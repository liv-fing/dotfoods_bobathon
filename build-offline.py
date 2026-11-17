#!/usr/bin/env python3
"""Build the offline copy of the lab guide from docs/.

Usage:  python3 build-offline.py

Creates (or fully replaces) offline/ and offline.zip next to this script.

offline/index.html is ONE self-contained file: the stylesheet, the script,
every exercise and every screenshot are built into it. It opens by
double-click and keeps working even if the file is moved or copied on its own.
(Exercises are embedded because browsers block fetch() on file:// pages.)
Fonts fall back to system fonts.

Re-run this script after any change under docs/, then commit offline/ and
offline.zip. Standard library only.
"""
import base64
import json
import mimetypes
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DOCS = ROOT / "docs"
OUT = ROOT / "offline"
ZIP = ROOT / "offline.zip"

# Same order as DEFAULT_TRACK_SLUGS in docs/js/app.js.
SLUGS = ["setup", "track-1", "track-2", "track-7", "track-4", "track-6", "track-5", "track-3"]

MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".gif": "image/gif", ".svg": "image/svg+xml", ".webp": "image/webp"}
IMG_ATTR_RE = re.compile(r'(src|href)="img/([^"]+)"')
FONT_LINE_RE = re.compile(
    r'^[ \t]*<link[^>]*(?:fonts\.googleapis\.com|fonts\.gstatic\.com)[^>]*>[ \t]*\n', re.M
)
CSS_TAG_RE = re.compile(r'<link rel="stylesheet" href="css/styles\.css[^"]*"\s*/?>')
JS_TAG_RE = re.compile(r'<script src="js/app\.js[^"]*"></script>')

_cache = {}
used_images = set()


def fail(msg):
    print("ERROR: " + msg, file=sys.stderr)
    sys.exit(1)


def data_uri(name):
    if name not in _cache:
        path = DOCS / "img" / name
        if not path.is_file():
            fail("image referenced but not found in docs/img: " + name)
        mime = MIME.get(path.suffix.lower()) or mimetypes.guess_type(name)[0]
        if not mime:
            fail("unknown image type: " + name)
        _cache[name] = "data:%s;base64,%s" % (mime, base64.b64encode(path.read_bytes()).decode("ascii"))
    used_images.add(name)
    return _cache[name]


def inline_images(text):
    return IMG_ATTR_RE.sub(lambda m: '%s="%s"' % (m.group(1), data_uri(m.group(2))), text)


def script_safe(text):
    """Make text safe to place inside a <script> or <style> element."""
    return text.replace("</", "<\\/").replace("<!--", "<\\!--")


def main():
    index = DOCS / "index.html"
    if not index.is_file():
        fail("missing " + str(index))

    tracks = {}
    for slug in SLUGS:
        path = DOCS / "tracks" / (slug + ".html")
        if not path.is_file():
            fail("missing track file " + str(path))
        tracks[slug] = inline_images(path.read_text(encoding="utf-8"))

    html = index.read_text(encoding="utf-8")

    # 1. Drop the Google Fonts tags (not available offline).
    html, removed = FONT_LINE_RE.subn("", html)
    if removed == 0:
        fail("expected Google Fonts <link> tags in docs/index.html; none found")

    # 2. Build the stylesheet in.
    css = (DOCS / "css" / "styles.css").read_text(encoding="utf-8")
    if "url(" in css:
        fail("styles.css now uses url(); extend build-offline.py to inline those assets")
    html, n = CSS_TAG_RE.subn(lambda m: "<style>\n" + css.replace("</", "<\\/") + "\n</style>", html)
    if n != 1:
        fail("could not find the styles.css <link> tag in docs/index.html")

    # 3. Embed the exercises and the script.
    app_js = (DOCS / "js" / "app.js").read_text(encoding="utf-8")
    if "img/" in app_js:
        fail("app.js now references img/; extend build-offline.py to handle it")
    inline = (
        "<script>window.FLIGHT400_INLINE_TRACKS = "
        + script_safe(json.dumps(tracks, ensure_ascii=False))
        + ";</script>\n<script>\n" + script_safe(app_js) + "\n</script>"
    )
    html, n = JS_TAG_RE.subn(lambda m: inline, html)
    if n != 1:
        fail("could not find the app.js <script> tag in docs/index.html")

    # 4. Images in the page itself (hero screenshot, favicon, ...).
    html = inline_images(html)

    # 5. Nothing may still point at a sibling file.
    leftovers = sorted(set(re.findall(r'(?:src|href)="(?:img|css|js)/[^"]*"', html)))
    if leftovers:
        fail("offline/index.html still has relative file references: " + ", ".join(leftovers[:5]))

    # 6. Write offline/ from scratch so removed files do not linger.
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir(parents=True)
    (OUT / "index.html").write_text(html, encoding="utf-8")
    (OUT / "README.txt").write_text(
        "FLIGHT400 Bobathon - offline lab guide\n"
        "======================================\n\n"
        "Open index.html in your browser (double-click it). It is a single\n"
        "self-contained file: no other files, web server or internet connection\n"
        "are needed to read the guide.\n\n"
        "Still needs internet:\n"
        "  - Links to external sites, for example IBM i Access Client Solutions.\n\n"
        "Get your private key file and server IP address from your instructor\n"
        "BEFORE going offline.\n\n"
        "Fonts fall back to your system fonts, so the layout looks slightly\n"
        "different from the online version.\n\n"
        "This folder is generated by build-offline.py from the docs/ folder.\n"
        "Do not edit it by hand.\n",
        encoding="utf-8",
    )

    # 7. Zip (unzipping gives one folder named offline/).
    if ZIP.exists():
        ZIP.unlink()
    with zipfile.ZipFile(ZIP, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(OUT.rglob("*")):
            if path.is_file() and not path.name.startswith("."):
                zf.write(path, Path("offline") / path.relative_to(OUT))

    size = (OUT / "index.html").stat().st_size / 1e6
    print("Wrote %s/index.html (%.1f MB, single file)" % (OUT, size))
    print("  tracks embedded : %d" % len(tracks))
    print("  images embedded : %d unique" % len(used_images))
    print("  fonts links removed: %d" % removed)
    print("Wrote %s (%.1f MB)" % (ZIP, ZIP.stat().st_size / 1e6))


if __name__ == "__main__":
    main()
