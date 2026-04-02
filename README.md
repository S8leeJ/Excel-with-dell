# ExcelWithDell — FusionTech negative review analysis

This repository supports **Challenge 1: Customer Feedback Blind Spots** for FusionTech Systems. It combines a **Python analysis pipeline** (topic modeling, sentiment scoring, static charts) with an optional **React dashboard** for presenting insights.

## What’s included

| Area | Description |
|------|-------------|
| **`fusiontech_analysis_unified.py`** | End-to-end pipeline: loads review data, filters the last 24 months, cleans text, isolates 1–2★ reviews, runs LDA (10 topics), applies a lexicon-based negative-intensity score, and writes charts plus a labeled CSV export. |
| **`FusionTechDashboard.jsx`** + **`src/`** | Vite + React + Recharts dashboard (KPIs, topic breakdown, trends). Uses static/demo data in `topic_reviews.json` alongside embedded summary figures. |
| **`analysis_first_Draft.ipynb`** | Earlier exploratory notebook work. |
| **Data** | `FusionTech_Translated_Dataset.csv` is the primary input for the Python script. `fusiontech_reviews.csv` and `08_negative_reviews_analyzed.csv` are additional/derived artifacts as present in the repo. |

## Python analysis pipeline

### Dependencies

Install with pip (versions are typical; pin in your environment as needed):

```bash
pip install pandas numpy matplotlib seaborn scikit-learn
```

### Run

From the project root (where the CSV lives):

```bash
python fusiontech_analysis_unified.py
```

### Outputs (written to the current working directory)

- **`01_topic_barchart.png`** — LDA topic frequency (ranked)
- **`02_word_frequency.png`** — word frequency bubble chart
- **`03_sentiment.png`** — 1★ vs 2★ split + negative-intensity histogram
- **`04_top3_keywords.png`** — top keywords for the three most frequent topics
- **`05_monthly_trend.png`** — monthly negative volume and top-3 topic lines
- **`06_lda_slide_chart.png`** — two-panel LDA summary (topics + confidence)
- **`07_rating_distribution.png`** — overall rating distribution (seaborn countplot, ~23-month window aligned with teammate script)
- **`08_negative_reviews_analyzed.csv`** — export with dates, ratings, dominant topic, labels, confidence, lexicon score, and category fields

After running, the script prints topic summaries and a short executive-style summary to the console.

### Method notes (high level)

- **Window**: Reviews from the latest timestamp in the dataset back **24 months** (with a separate alignment for chart 07 as documented in the script).
- **Negatives**: Ratings ≤ 2; text is deduplicated by `user_id` + `text`, with basic HTML stripping and English/Spanish stopword handling plus light lemmatization for modeling.
- **Topics**: `LatentDirichletAllocation` with fixed `random_state` for reproducibility; human-readable **`TOPIC_LABELS`** in the script should be reviewed whenever raw LDA topics change.

## Web dashboard

```bash
npm install
npm run dev      # local development server
npm run build    # production build to dist/
npm run preview  # preview production build
```

The app entry mounts `FusionTechDashboard` from `FusionTechDashboard.jsx` via `src/App.jsx`.

## Project layout (main files)

```
fusiontech_analysis_unified.py   # Main analysis + chart export
FusionTechDashboard.jsx          # Dashboard UI
topic_reviews.json               # Sample/review snippets for the dashboard
src/                             # Vite React app (main.jsx, App.jsx, index.css)
package.json                     # npm scripts and frontend dependencies
```

---

*Internal/educational project — FusionTech is used as the scenario brand for this exercise.*
