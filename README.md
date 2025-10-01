
# Government Shutdown Length Probability Tracker (Bootstrap)

A static site styled with **Bootstrap 5** that visualizes a subjective probability forecast for how long the 2025 U.S. government shutdown lasts. Data loads from `data/probabilities.json` so you can update numbers without touching code.

## Publish on GitHub Pages
1. Create a new repo (e.g. `shutdown-length-tracker`).
2. Upload the contents of this folder.
3. In repo **Settings → Pages**: Source = *Deploy from a branch*; Branch = `main` (root). Save.
4. Open the URL GitHub shows (usually `https://<you>.github.io/<repo>/`).

## Update Data
- Edit `data/probabilities.json` in GitHub’s editor.
- Fields:
  - `buckets` — length buckets + probabilities.
  - `derived` — median/mean and chance within a week.
  - `daily_tracker` — per-day odds and “what to watch”.
  - `metadata.last_updated_iso` — bump timestamp when you change values.

## Local Preview
Open `index.html`, or serve locally:
```bash
python3 -m http.server 3000
```
Then go to `http://localhost:3000`.

## License
MIT
