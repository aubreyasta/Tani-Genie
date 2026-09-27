"""
Captures the README screenshots and walkthrough GIF from a running Tani Genie.

Needs the full stack up (app, Postgres, and the three Python services; see
README "Run it locally"), plus ffmpeg on PATH and `pip install playwright`.

Run: python scripts/capture_media.py [base_url]   (default http://localhost:3000)

CAPTURE_DATE=YYYY-MM-DD sets "today" for the demo plantings and the browser
clock. The committed media use 2026-07-17: the price data ends 2026-07-17 and
the price service refuses forecasts more than 30 days past it, so the servers
ran with their clocks shifted to that date as well, and with TZ=Asia/Jakarta.

Deletes and recreates its own two demo plots through the API, drives the real
UI in headless Chromium, and writes to docs/media/. Fails on any page error or
missing element, so a UI change cannot leave stale media behind silently.
"""

import datetime as dt
import json
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "docs" / "media"
TIMEOUT_MS = 90_000
GIF_WIDTH = 960
DEMO_PLOTS = ("Kebun Cabai Sleman", "Lahan Bawang Bantul")
TODAY = dt.date.fromisoformat(os.environ.get("CAPTURE_DATE", str(dt.date.today())))

# Headless screenshots have no mouse pointer, so the GIF draws its own.
CURSOR_JS = """() => {
  const c = document.createElement('div');
  c.id = 'rec-cursor';
  c.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24"><path d="M4 2l16 10-7 1.6L9.4 21z" '
    + 'fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none';
  document.body.appendChild(c);
}"""


def api(base, method, path, body=None):
    req = urllib.request.Request(
        base + path,
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        raw = res.read()  # DELETE answers 204 with no body
        return json.loads(raw)["data"] if raw else None


def reset_demo_data(base, today):
    """Remove earlier demo plots, then add the bawang plot the GIF starts with."""
    demo_ids = {p["id"] for p in api(base, "GET", "/api/plots") if p["name"] in DEMO_PLOTS}
    # A plot with an active planting cannot be deleted, so finish those first.
    for planting in api(base, "GET", "/api/plantings"):
        if planting["plotId"] in demo_ids and planting["status"] == "active":
            api(base, "PATCH", f"/api/plantings/{planting['id']}", {"status": "finished"})
    for plot_id in demo_ids:
        api(base, "DELETE", f"/api/plots/{plot_id}")
    crops = {c["slug"]: c["id"] for c in api(base, "GET", "/api/crops")}
    plot = api(base, "POST", "/api/plots", {
        "name": DEMO_PLOTS[1], "areaM2": 1800, "latitude": -7.8878, "longitude": 110.3289,
    })
    api(base, "POST", "/api/plantings", {
        "plotId": plot["id"],
        "cropId": crops["bawang-merah"],
        "seedName": "Bima Brebes",
        "targetYieldKg": 1500,
        "plantedAt": f"{today - dt.timedelta(days=35)}T00:00:00.000Z",
        "expectedHarvestAt": f"{today + dt.timedelta(days=25)}T00:00:00.000Z",
        "dataPoints": {"temp": "api", "humidity": "api", "rainfall": "api",
                       "soil_moisture": "api", "nutrients_ph": "api"},
    })


class Recorder:
    """Screenshots the page as GIF frames, each with its own display time,
    so slow waits can be time-lapsed and key screens held."""

    def __init__(self, page, frame_dir):
        self.page, self.dir = page, frame_dir
        self.frames = []  # (png path, seconds shown)
        self.x, self.y = 640, 560
        self.cursor()

    def cursor(self):
        # Every full navigation drops the injected element, so re-add it.
        if not self.page.evaluate("!!document.getElementById('rec-cursor')"):
            self.page.evaluate(CURSOR_JS)
        self._place(self.x, self.y)

    def _place(self, x, y):
        # The arrow's tip sits at (4, 2) inside its 24px box.
        self.page.evaluate(
            f"document.getElementById('rec-cursor').style.transform = 'translate({x - 4}px, {y - 2}px)'"
        )

    def shot(self, ms):
        path = self.dir / f"{len(self.frames):04d}.png"
        self.page.screenshot(path=path)
        self.frames.append((path, ms / 1000))

    def still(self, name, full_page=False):
        cursor = "document.getElementById('rec-cursor').style.visibility"
        self.page.evaluate(f"{cursor} = 'hidden'")
        self.page.screenshot(path=OUT_DIR / name, full_page=full_page)
        self.page.evaluate(f"{cursor} = ''")

    def move_to(self, locator, steps=8):
        locator.scroll_into_view_if_needed()
        box = locator.bounding_box()
        tx, ty = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        for i in range(1, steps + 1):
            t = i / steps
            t = t * t * (3 - 2 * t)  # ease in and out
            self._place(self.x + (tx - self.x) * t, self.y + (ty - self.y) * t)
            self.shot(35)
        self.x, self.y = tx, ty
        self.shot(150)

    def click(self, locator, hold_ms=500):
        self.move_to(locator)
        locator.click()
        self.page.wait_for_timeout(250)
        self.shot(hold_ms)

    def type(self, locator, text):
        self.click(locator, hold_ms=150)
        for ch in text:
            self.page.keyboard.type(ch)
            self.shot(50)

    def time_lapse(self, done_js, every_ms=800, show_ms=100):
        for _ in range(TIMEOUT_MS // every_ms):
            self.shot(show_ms)
            if self.page.evaluate(done_js):
                return
            self.page.wait_for_timeout(every_ms)
        raise TimeoutError(f"never reached: {done_js}")

    def navigate(self, link):
        self.click(link, hold_ms=200)
        self.page.wait_for_load_state("networkidle")
        # Server components stream in behind loading.tsx; wait for the real page.
        self.page.wait_for_function("!document.querySelector('.app-loading')")
        self.cursor()

    def scroll_to(self, y, steps=10):
        start = self.page.evaluate("window.scrollY")
        for i in range(1, steps + 1):
            t = i / steps
            t = t * t * (3 - 2 * t)
            self.page.evaluate(f"window.scrollTo(0, {start + (y - start) * t})")
            self.shot(40)

    def write_gif(self, out):
        listing = self.dir / "frames.txt"
        lines = [f"file '{p.name}'\nduration {s:.3f}" for p, s in self.frames]
        # The concat demuxer ignores the last duration unless the file repeats.
        lines.append(f"file '{self.frames[-1][0].name}'")
        listing.write_text("\n".join(lines), encoding="utf-8")
        palette = (f"scale={GIF_WIDTH}:-1:flags=lanczos,split[a][b];"
                   "[a]palettegen=max_colors=64:stats_mode=diff[p];"
                   "[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
                        "-i", str(listing), "-vf", palette, "-fps_mode", "vfr", str(out)], check=True)


def capture(base, frame_dir):
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    today = TODAY
    reset_demo_data(base, today)
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 800}, device_scale_factor=2,
                                timezone_id="Asia/Jakarta", locale="id-ID")
        # 09:00 WIB on the capture date.
        page.clock.install(time=dt.datetime.combine(today, dt.time(2), dt.timezone.utc))
        page.set_default_timeout(TIMEOUT_MS)
        page.on("pageerror", lambda e: errors.append(str(e)))
        nav = page.get_by_role("navigation", name="Navigasi utama")

        page.goto(base + "/kebunku")
        page.get_by_role("button", name="Tambah Lahan", exact=True).wait_for()
        rec = Recorder(page, frame_dir)
        rec.shot(1000)

        # Add a plot, then a chili planting on it.
        rec.click(page.get_by_role("button", name="Tambah Lahan", exact=True))
        rec.type(page.get_by_label("Nama lahan"), DEMO_PLOTS[0])
        rec.type(page.get_by_label("Luas (m²)"), "2500")
        rec.click(page.get_by_role("button", name="Simpan Lahan", exact=True))
        new_plot = page.get_by_role("heading", name=DEMO_PLOTS[0])
        rec.time_lapse(f"document.body.innerText.includes('{DEMO_PLOTS[0]}')")
        new_plot.wait_for()

        # The new plot is the only one without a planting, so its button is unique.
        rec.click(page.get_by_role("button", name="Tambah Komoditas", exact=True))
        page.locator("select[name=cropId]").select_option(label="Cabai Merah")
        rec.shot(500)
        rec.type(page.get_by_label("Nama benih"), "Lado F1")
        rec.type(page.get_by_label("Target panen (kg)"), "900")
        page.get_by_label("Tanggal tanam").fill(str(today - dt.timedelta(days=58)))
        page.get_by_label("Perkiraan panen").fill(str(today + dt.timedelta(days=42)))
        rec.shot(600)
        rec.click(page.get_by_role("button", name="Simpan Komoditas", exact=True))
        rec.time_lapse("document.body.innerText.includes('Lado F1')")
        page.wait_for_load_state("networkidle")
        rec.move_to(page.get_by_text("Lado F1").first)
        rec.shot(2000)
        page.evaluate("window.scrollTo(0, 0)")
        rec.still("kebunku.png")

        # Weather and pest verdicts per planting.
        rec.navigate(nav.get_by_role("link", name="Peringatan", exact=True))
        rec.shot(2500)
        rec.still("peringatan.png")
        rec.scroll_to(700)
        rec.shot(1500)

        # 30-day price forecast with the best sell window.
        page.evaluate("window.scrollTo(0, 0)")
        rec.navigate(nav.get_by_role("link", name="Harga", exact=True))
        rec.shot(2500)
        rec.still("harga.png")

        # Reminders ready for WhatsApp/SMS.
        page.evaluate("window.scrollTo(0, 0)")
        rec.navigate(nav.get_by_role("link", name="Notifikasi", exact=True))
        rec.click(page.get_by_role("button", name="Buat Notifikasi", exact=True))
        rec.time_lapse("document.querySelectorAll('.notification-card').length > 0")
        page.wait_for_load_state("networkidle")
        rec.shot(1800)
        rec.still("notifikasi.png")

        # Dashboard: the day's top decision.
        page.evaluate("window.scrollTo(0, 0)")
        rec.navigate(nav.get_by_role("link", name="Beranda", exact=True))
        page.get_by_role("heading", name="Selamat datang").wait_for()
        rec.shot(3000)
        rec.still("beranda.png")
        browser.close()

    assert not errors, f"page errors during capture: {errors}"
    rec.write_gif(OUT_DIR / "walkthrough.gif")


if __name__ == "__main__":
    if not shutil.which("ffmpeg"):
        raise SystemExit("ffmpeg is not on PATH; it builds walkthrough.gif.")
    base = (sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000").rstrip("/")
    with tempfile.TemporaryDirectory() as tmp:
        capture(base, Path(tmp))
    for f in sorted(OUT_DIR.iterdir()):
        print(f"{f.relative_to(ROOT)}  {f.stat().st_size // 1024} KB")
