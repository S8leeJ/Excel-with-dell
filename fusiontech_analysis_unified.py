"""
FusionTech Systems – Complete Negative Review Analysis
Challenge 1: Customer Feedback Blind Spots
Produces ALL charts from a single pipeline so results are always consistent.

Charts generated:
  01_topic_barchart.png       – LDA topic frequency (ranked)
  02_word_frequency.png       – Word frequency bubble chart
  03_sentiment.png            – Rating split + intensity histogram
  04_top3_keywords.png        – Top keywords for 3 critical topics
  05_monthly_trend.png        – Monthly negative review trend
  06_lda_slide_chart.png      – Two-panel LDA slide (bar + confidence)
  07_rating_distribution.png  – 2-year overall rating countplot
  06_negative_reviews_analyzed.csv – Full labeled export
"""

# ── Imports ────────────────────────────────────────────────────────────────────
import re, warnings
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.gridspec as gridspec
import seaborn as sns
from collections import Counter
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.decomposition import LatentDirichletAllocation

warnings.filterwarnings("ignore")

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1 – LOAD & DATE FILTER
# ═══════════════════════════════════════════════════════════════════════════════
df_raw = pd.read_csv("FusionTech_Translated_Dataset.csv")
df_raw["date"] = pd.to_datetime(df_raw["timestamp"], unit="ms")

latest = df_raw["date"].max()
cutoff = latest - pd.DateOffset(months=24)
df     = df_raw[df_raw["date"] >= cutoff].copy()

# Also keep a 23-month-aligned start for the seaborn rating chart (matches your teammate's script)
start_date_sns = (latest - pd.DateOffset(months=23)).replace(day=1)
df_last_24_sns = df_raw[(df_raw["date"] >= start_date_sns) & (df_raw["date"] <= latest)].copy()

print(f"Full dataset rows   : {len(df_raw):,}")
print(f"Date window         : {cutoff.date()} to {latest.date()}")
print(f"Rows in window      : {len(df):,}")

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2 – DATA CLEANING
# ═══════════════════════════════════════════════════════════════════════════════
df = df.drop_duplicates(subset=["user_id", "text"])
df = df.dropna(subset=["text", "rating"])
df["rating"] = pd.to_numeric(df["rating"], errors="coerce")
df = df.dropna(subset=["rating"])
df["text_clean"] = df["text"].apply(lambda x: re.sub(r"<[^>]+>", " ", str(x)))
df["text_clean"] = (df["title_x"].fillna("") + " " + df["text_clean"]).str.strip()

print(f"After dedup/clean   : {len(df):,}")
print(f"\nRating distribution:\n{df['rating'].value_counts().sort_index().to_string()}\n")

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3 – ISOLATE NEGATIVE REVIEWS (1–2 stars)
# ═══════════════════════════════════════════════════════════════════════════════
neg = df[df["rating"] <= 2].copy()
print(f"Negative reviews    : {len(neg):,}")

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4 – TEXT PREPROCESSING
# ═══════════════════════════════════════════════════════════════════════════════
STOP = {
    "the","and","for","that","this","with","have","from","they","will",
    "been","were","are","was","had","has","but","not","you","your",
    "about","when","what","just","like","get","got","use","used","also",
    "really","even","still","time","said","went","come","back","one",
    "would","could","should","very","well","all","its","their","there",
    "then","than","too","into","out","can","did","does","dont","didnt",
    "cant","ive","thats","wont","more","some","any","only",
    "being","after","first","second","way","day","week","month","year",
    "two","three","four","five","star","stars","review","bought","purchase",
    "buy","item","order","ordered","received","product","products",
    "thing","things","make","made","take","took","give","given",
    "going","much","many","lot","few","every","other",
    "need","needed","tried","try","think","thought","know","known","seen",
    "see","look","looked","want","wanted","seem","seemed","good","bad",
    "great","nice","fine","okay","awful","terrible","horrible","poor",
    "best","worst","better","worse","well","new","old","same",
    "different","last","next","right","wrong","before","again","long",
    "little","big","small","high","low","hard","easy","never","always",
    "laptop","computer","dell","fusiontech","machine","device","unit",
    "system","windows","model","version","update","driver","software",
    # Spanish stopwords
    "que","los","las","con","del","una","por","para","como","pero",
    "todo","bien","muy","sin","sobre","cuando","este","esta","son",
    "mas","hay","tiene","entre","ser","sus","cada","hasta","donde",
}

LEMMA_MAP = {
    "crashes":"crash","crashed":"crash","crashing":"crash",
    "freezes":"freeze","frozen":"freeze","freezing":"freeze",
    "overheats":"overheat","overheating":"overheat","overheated":"overheat",
    "batteries":"battery","charging":"charge","charged":"charge",
    "screens":"screen","displays":"display","keyboards":"keyboard",
    "hinges":"hinge","keys":"key","fans":"fan",
    "noises":"noise","noisy":"noise","loud":"noise",
    "connections":"connection","disconnects":"disconnect","disconnected":"disconnect",
    "returns":"return","returned":"return","refunds":"refund","refunded":"refund",
    "replacements":"replacement","replaced":"replace",
    "issues":"issue","problems":"problem","errors":"error",
    "customers":"customer","services":"service","agents":"agent",
    "slower":"slow","slowest":"slow","sluggish":"slow",
    "broken":"break","broke":"break","breaking":"break","breaks":"break",
    "lags":"lag","lagging":"lag",
}

def preprocess(text):
    text = str(text).lower()
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"[^a-z\s]", " ", text)
    tokens = text.split()
    result = []
    for t in tokens:
        t = LEMMA_MAP.get(t, t)
        if t not in STOP and len(t) > 3:
            result.append(t)
    return " ".join(result)

neg["processed"] = neg["text_clean"].apply(preprocess)
neg = neg[neg["processed"].str.split().str.len() >= 5]
print(f"After text cleaning : {len(neg):,} usable negative reviews\n")

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5 – LEXICON-BASED SENTIMENT SCORE
# ═══════════════════════════════════════════════════════════════════════════════
NEGATIVE_WORDS = {
    "overheat":3,"hot":2,"heat":2,"thermal":2,
    "crash":3,"freeze":3,"reboot":2,
    "broken":3,"break":3,"defective":3,"dead":3,"fail":3,"failure":3,
    "slow":2,"sluggish":2,"lag":2,"bloatware":2,
    "battery":1,"drain":2,"charge":2,
    "hinge":3,"screen":1,"display":1,"flicker":3,"blurry":2,
    "noise":2,"loud":2,"fan":1,
    "support":1,"service":1,"return":2,"refund":2,"warranty":2,"replace":2,
    "keyboard":1,"key":1,"stuck":2,
    "wifi":2,"bluetooth":2,"connection":2,"disconnect":3,
    "waste":3,"junk":3,"garbage":3,"terrible":2,"horrible":2,
    "awful":2,"useless":3,"disappointing":2,"disappointed":2,"worst":3,
}

def sentiment_score(text):
    return sum(NEGATIVE_WORDS.get(t, 0) for t in str(text).lower().split())

neg["neg_score"] = neg["processed"].apply(sentiment_score)

# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 6 – LDA TOPIC MODELING (single fit, used by ALL charts)
# ═══════════════════════════════════════════════════════════════════════════════
N_TOPICS    = 10
N_TOP_WORDS = 12

vectorizer = CountVectorizer(
    max_df=0.90, min_df=4, max_features=1500, ngram_range=(1, 2),
)
dtm           = vectorizer.fit_transform(neg["processed"])
feature_names = vectorizer.get_feature_names_out()

lda = LatentDirichletAllocation(
    n_components=N_TOPICS, random_state=42, max_iter=25, learning_method="batch",
)
lda.fit(dtm)

def get_top_words(model, feature_names, n=12):
    return [
        [feature_names[i] for i in comp.argsort()[-n:][::-1]]
        for comp in model.components_
    ]

topic_words = get_top_words(lda, feature_names, N_TOP_WORDS)

print("=== RAW LDA TOPICS ===")
for i, words in enumerate(topic_words):
    print(f"  Topic {i:>2}: {', '.join(words[:8])}")
print()

# !! Update these labels after reviewing the raw topics above !!
TOPIC_LABELS = [
    "Overheating & Thermal Issues",
    "System Crashes & Freezes",
    "Battery & Charging Problems",
    "Screen & Display Issues",
    "Keyboard & Build Quality",
    "Slow Performance & Bloatware",
    "WiFi & Connectivity Drops",
    "Customer Support & Returns",
    "Fan Noise & Vibration",
    "Dead-on-Arrival & Defects",
]

doc_topic               = lda.transform(dtm)
neg["dominant_topic"]   = doc_topic.argmax(axis=1)
neg["topic_label"]      = neg["dominant_topic"].map(lambda i: TOPIC_LABELS[i])
neg["topic_confidence"] = doc_topic.max(axis=1)

topic_counts = neg["topic_label"].value_counts().reset_index()
topic_counts.columns = ["topic", "count"]
topic_counts["pct"]  = (topic_counts["count"] / len(neg) * 100).round(1)

top3_labels  = topic_counts.head(3)["topic"].tolist()
top3_indices = [TOPIC_LABELS.index(l) for l in top3_labels]

print("=== TOP 10 NEGATIVE REVIEW TOPICS ===")
for rank, (_, row) in enumerate(topic_counts.iterrows(), 1):
    print(f"  #{rank:<2} {row['topic']:<38}  {row['count']:>4} reviews  ({row['pct']}%)")

# ═══════════════════════════════════════════════════════════════════════════════
# COLOUR PALETTE (shared by all charts)
# ═══════════════════════════════════════════════════════════════════════════════
DELL_BLUE   = "#007DB8"
DELL_DARK   = "#1A1A2E"
WARN_RED    = "#E63946"
WARN_ORANGE = "#F4A261"
WARN_YELLOW = "#E9C46A"
LIGHT_GREY  = "#F5F7FA"
MID_GREY    = "#DEE2E6"

def bar_color(rank, total):
    if rank < total * 0.3: return WARN_RED
    if rank < total * 0.6: return WARN_ORANGE
    return WARN_YELLOW

# ═══════════════════════════════════════════════════════════════════════════════
# CHART 01 – Topic frequency bar chart
# ═══════════════════════════════════════════════════════════════════════════════
fig1, ax = plt.subplots(figsize=(12, 7))
fig1.patch.set_facecolor(LIGHT_GREY)
ax.set_facecolor(LIGHT_GREY)

s = topic_counts.sort_values("count")
n = len(s)
colors = [bar_color(i, n) for i in range(n)]
bars   = ax.barh(s["topic"], s["count"], color=colors,
                 edgecolor="white", linewidth=0.8, height=0.65)

for bar, (_, row) in zip(bars, s.iterrows()):
    w = bar.get_width()
    ax.text(w + 0.4, bar.get_y() + bar.get_height() / 2,
            f"{int(w)}  ({row['pct']}%)",
            va="center", ha="left", fontsize=9.5, color="#333", fontweight="bold")

ax.set_xlabel("Number of Negative Reviews", fontsize=11, color="#333")
ax.set_title(
    "Top 10 Customer Pain Points in Negative Reviews\n"
    f"FusionTech Systems  |  Last 24 Months  |  {len(neg):,} Negative Reviews Analyzed",
    fontsize=13, fontweight="bold", color=DELL_DARK, pad=14,
)
ax.set_xlim(0, s["count"].max() * 1.30)
ax.tick_params(axis="y", labelsize=10)
ax.tick_params(axis="x", labelsize=9)
ax.spines[["top","right","left"]].set_visible(False)
ax.xaxis.grid(True, linestyle="--", alpha=0.4, color=MID_GREY)
ax.set_axisbelow(True)
ax.legend(handles=[
    mpatches.Patch(color=WARN_RED,    label="Critical  (Top 3)"),
    mpatches.Patch(color=WARN_ORANGE, label="High Priority (4-6)"),
    mpatches.Patch(color=WARN_YELLOW, label="Moderate  (7-10)"),
], loc="lower right", framealpha=0.85, fontsize=9)

plt.tight_layout()
fig1.savefig("01_topic_barchart.png", dpi=150, bbox_inches="tight")
print("\nSaved: 01_topic_barchart.png")
plt.close(fig1)

# ═══════════════════════════════════════════════════════════════════════════════
# CHART 02 – Word frequency bubble chart
# ═══════════════════════════════════════════════════════════════════════════════
all_tokens = " ".join(neg["processed"].tolist()).split()
word_freq  = Counter(all_tokens).most_common(40)
words_wf, freqs_wf = zip(*word_freq)
max_f  = max(freqs_wf)
sizes  = [800 * (f / max_f) + 60 for f in freqs_wf]
b_cols = [WARN_RED if f/max_f > 0.6 else WARN_ORANGE if f/max_f > 0.3 else DELL_BLUE
          for f in freqs_wf]

rng   = np.random.default_rng(42)
x_pos = rng.uniform(0.5, 13.5, len(words_wf))
y_pos = rng.uniform(0.5, 5.5,  len(words_wf))

fig2, ax2 = plt.subplots(figsize=(14, 6))
fig2.patch.set_facecolor("white")
ax2.set_facecolor("white")
ax2.scatter(x_pos, y_pos, s=sizes, c=b_cols, alpha=0.72,
            edgecolors="white", linewidths=0.8)
for x, y, w, f in zip(x_pos, y_pos, words_wf, freqs_wf):
    ax2.text(x, y, w, ha="center", va="center",
             fontsize=max(6, min(13, 6 + 7 * f / max_f)),
             fontweight="bold" if f / max_f > 0.5 else "normal",
             color="white" if f / max_f > 0.4 else DELL_DARK)
ax2.legend(handles=[
    mpatches.Patch(color=WARN_RED,    label="Very High Frequency"),
    mpatches.Patch(color=WARN_ORANGE, label="High Frequency"),
    mpatches.Patch(color=DELL_BLUE,   label="Moderate Frequency"),
], loc="lower right", fontsize=9, framealpha=0.85)
ax2.set_title("Most Frequent Terms in Negative Reviews (Last 24 Months)",
              fontsize=13, fontweight="bold", color=DELL_DARK, pad=12)
ax2.axis("off")
plt.tight_layout()
fig2.savefig("02_word_frequency.png", dpi=150, bbox_inches="tight")
print("Saved: 02_word_frequency.png")
plt.close(fig2)

# ═══════════════════════════════════════════════════════════════════════════════
# CHART 03 – Sentiment: rating split pie + intensity histogram
# ═══════════════════════════════════════════════════════════════════════════════
fig3, axes3 = plt.subplots(1, 2, figsize=(13, 5))
fig3.patch.set_facecolor(LIGHT_GREY)

rating_counts = neg["rating"].value_counts().sort_index()
axes3[0].pie(
    rating_counts.values,
    labels=[f"Star {r}  ({v})" for r, v in zip(rating_counts.index, rating_counts.values)],
    autopct="%1.1f%%", colors=[WARN_RED, WARN_ORANGE], startangle=140,
    textprops={"fontsize": 11}, wedgeprops={"edgecolor": "white", "linewidth": 1.5},
)
axes3[0].set_title("1-Star vs 2-Star Split", fontsize=12, fontweight="bold", color=DELL_DARK)
axes3[0].set_facecolor(LIGHT_GREY)

med  = neg["neg_score"].median()
mean = neg["neg_score"].mean()
axes3[1].hist(neg["neg_score"], bins=25, color=DELL_BLUE, edgecolor="white", linewidth=0.5)
axes3[1].axvline(med,  color=WARN_RED,    ls="--", lw=2, label=f"Median = {med:.0f}")
axes3[1].axvline(mean, color=WARN_ORANGE, ls=":",  lw=2, label=f"Mean   = {mean:.1f}")
axes3[1].set_xlabel("Negative Intensity Score", fontsize=11)
axes3[1].set_ylabel("Reviews", fontsize=11)
axes3[1].set_title("Negative Sentiment Intensity Distribution",
                   fontsize=12, fontweight="bold", color=DELL_DARK)
axes3[1].legend(fontsize=10)
axes3[1].spines[["top","right"]].set_visible(False)
axes3[1].set_facecolor(LIGHT_GREY)

fig3.suptitle("Sentiment Analysis | Negative Reviews | FusionTech Systems",
              fontsize=13, fontweight="bold", color=DELL_DARK, y=1.02)
plt.tight_layout()
fig3.savefig("03_sentiment.png", dpi=150, bbox_inches="tight")
print("Saved: 03_sentiment.png")
plt.close(fig3)

# ═══════════════════════════════════════════════════════════════════════════════
# CHART 04 – Top keywords for 3 critical topics
# ═══════════════════════════════════════════════════════════════════════════════
crit_colors = [WARN_RED, "#C1121F", "#9D0208"]

fig4, axes4 = plt.subplots(1, 3, figsize=(16, 5.5))
fig4.patch.set_facecolor(LIGHT_GREY)

for ax_i, (t_idx, label) in enumerate(zip(top3_indices, top3_labels)):
    pairs = []
    for w in topic_words[t_idx][:10]:
        matches = np.where(feature_names == w)[0]
        if len(matches):
            pairs.append((w, lda.components_[t_idx][matches[0]]))
    if not pairs:
        continue
    wf, sf = zip(*pairs)
    axes4[ax_i].barh(list(wf)[::-1], list(sf)[::-1],
                     color=crit_colors[ax_i], edgecolor="white")
    axes4[ax_i].set_title(f"#{ax_i+1} Critical: {label}",
                          fontsize=10, fontweight="bold", color=DELL_DARK)
    axes4[ax_i].spines[["top","right","left"]].set_visible(False)
    axes4[ax_i].set_xlabel("LDA Word Weight", fontsize=8)
    axes4[ax_i].tick_params(labelsize=9)
    axes4[ax_i].set_facecolor(LIGHT_GREY)

fig4.suptitle("Top Keywords - 3 Most Critical Customer Pain Points",
              fontsize=13, fontweight="bold", color=DELL_DARK)
plt.tight_layout()
fig4.savefig("04_top3_keywords.png", dpi=150, bbox_inches="tight")
print("Saved: 04_top3_keywords.png")
plt.close(fig4)

# ═══════════════════════════════════════════════════════════════════════════════
# CHART 05 – Monthly trend
# ═══════════════════════════════════════════════════════════════════════════════
neg["month"]     = neg["date"].dt.to_period("M")
monthly          = neg.groupby("month").size().reset_index(name="total")
monthly["month_str"] = monthly["month"].astype(str)

for label in top3_labels:
    tmp = (neg[neg["topic_label"] == label]
           .groupby("month").size().reset_index(name=label))
    tmp["month_str"] = tmp["month"].astype(str)
    monthly = monthly.merge(tmp[["month_str", label]], on="month_str", how="left")
    monthly[label] = monthly[label].fillna(0)

fig5, ax5 = plt.subplots(figsize=(13, 5))
fig5.patch.set_facecolor(LIGHT_GREY)
ax5.set_facecolor(LIGHT_GREY)

x = range(len(monthly))
ax5.fill_between(x, monthly["total"], alpha=0.12, color=DELL_BLUE)
ax5.plot(x, monthly["total"], color=DELL_BLUE, lw=2.5,
         label="All Negative Reviews", marker="o", ms=4)

for label, color in zip(top3_labels, [WARN_RED, WARN_ORANGE, WARN_YELLOW]):
    ax5.plot(x, monthly[label], color=color, lw=1.8, ls="--",
             label=label, marker="s", ms=3)

ticks = monthly["month_str"].tolist()
ax5.set_xticks(list(x))
ax5.set_xticklabels([t if i % 3 == 0 else "" for i, t in enumerate(ticks)],
                    rotation=45, ha="right", fontsize=8)
ax5.set_ylabel("Negative Reviews", fontsize=11)
ax5.set_title("Monthly Trend: Negative Reviews and Top 3 Pain Points",
              fontsize=13, fontweight="bold", color=DELL_DARK, pad=12)
ax5.legend(fontsize=9, loc="upper left", framealpha=0.85)
ax5.spines[["top","right"]].set_visible(False)
ax5.xaxis.grid(True, ls="--", alpha=0.3, color=MID_GREY)
ax5.yaxis.grid(True, ls="--", alpha=0.3, color=MID_GREY)
ax5.set_axisbelow(True)
plt.tight_layout()
fig5.savefig("05_monthly_trend.png", dpi=150, bbox_inches="tight")
print("Saved: 05_monthly_trend.png")
plt.close(fig5)

# ═══════════════════════════════════════════════════════════════════════════════
# CHART 06 – Two-panel LDA slide chart (topic bar + confidence histogram)
# ═══════════════════════════════════════════════════════════════════════════════
fig6 = plt.figure(figsize=(16, 7))
fig6.patch.set_facecolor(LIGHT_GREY)
gs   = gridspec.GridSpec(1, 2, width_ratios=[2.2, 1], wspace=0.08)

ax_bar = fig6.add_subplot(gs[0])
ax_bar.set_facecolor(LIGHT_GREY)

s2     = topic_counts.sort_values("count")
n2     = len(s2)
cols2  = [bar_color(i, n2) for i in range(n2)]
bars2  = ax_bar.barh(s2["topic"], s2["count"], color=cols2,
                     edgecolor="white", linewidth=0.9, height=0.68)

for bar, (_, row) in zip(bars2, s2.iterrows()):
    w = bar.get_width()
    ax_bar.text(w + 0.4, bar.get_y() + bar.get_height() / 2,
                f"{int(w)} reviews  ({row['pct']}%)",
                va="center", ha="left", fontsize=9, color="#333", fontweight="bold")

ax_bar.set_xlabel("Number of Negative Reviews", fontsize=11, color="#555")
ax_bar.set_title(
    f"10 Pain Point Clusters Discovered by LDA\n"
    f"{len(neg)} Negative Reviews  |  Last 24 Months",
    fontsize=12, fontweight="bold", color=DELL_DARK, pad=12,
)
ax_bar.set_xlim(0, s2["count"].max() * 1.45)
ax_bar.tick_params(axis="y", labelsize=9.5)
ax_bar.tick_params(axis="x", labelsize=8.5)
ax_bar.spines[["top","right","left"]].set_visible(False)
ax_bar.xaxis.grid(True, linestyle="--", alpha=0.35, color=MID_GREY)
ax_bar.set_axisbelow(True)
ax_bar.legend(handles=[
    mpatches.Patch(color=WARN_RED,    label="Critical  (Top 3)"),
    mpatches.Patch(color=WARN_ORANGE, label="High Priority (4-6)"),
    mpatches.Patch(color=WARN_YELLOW, label="Moderate  (7-10)"),
], loc="lower right", framealpha=0.85, fontsize=8.5)

ax_conf = fig6.add_subplot(gs[1])
ax_conf.set_facecolor(LIGHT_GREY)
conf_data = neg["topic_confidence"]
ax_conf.hist(conf_data, bins=18, color=DELL_BLUE, edgecolor="white", linewidth=0.6)
ax_conf.axvline(conf_data.median(), color=WARN_RED, ls="--", lw=2,
                label=f"Median\n{conf_data.median():.2f}")
ax_conf.axvline(conf_data.mean(),   color=WARN_ORANGE, ls=":", lw=2,
                label=f"Mean\n{conf_data.mean():.2f}")
ax_conf.set_xlabel("Topic Assignment Confidence", fontsize=10, color="#555")
ax_conf.set_ylabel("Number of Reviews", fontsize=10, color="#555")
ax_conf.set_title("How Cleanly Do\nTopics Separate?",
                  fontsize=11, fontweight="bold", color=DELL_DARK, pad=12)
ax_conf.legend(fontsize=9, framealpha=0.85)
ax_conf.spines[["top","right"]].set_visible(False)
ax_conf.tick_params(labelsize=9)
ax_conf.text(0.5, 0.93, "Higher score = review\nclearly maps to one topic",
             transform=ax_conf.transAxes, fontsize=8.5, color="#555",
             ha="center", va="top",
             bbox=dict(boxstyle="round,pad=0.4", facecolor="white",
                       edgecolor=MID_GREY, alpha=0.85))

fig6.suptitle("LDA Topic Modeling  |  Unsupervised Discovery of Customer Pain Points",
              fontsize=13, fontweight="bold", color=DELL_DARK, y=1.01)
plt.tight_layout()
fig6.savefig("06_lda_slide_chart.png", dpi=150, bbox_inches="tight")
print("Saved: 06_lda_slide_chart.png")
plt.close(fig6)

# ═══════════════════════════════════════════════════════════════════════════════
# CHART 07 – 2-year overall rating distribution (seaborn countplot)
# ═══════════════════════════════════════════════════════════════════════════════
plt.figure(figsize=(8, 5))
sns.countplot(data=df_last_24_sns, x="rating", order=[1, 2, 3, 4, 5],
              hue="rating", palette="coolwarm_r", legend=False)

timeframe_title = (
    f"2-Year Customer Sentiment Trends\n"
    f"({start_date_sns.strftime('%B %Y')} to {latest.strftime('%B %Y')})"
)
plt.title(timeframe_title, fontsize=14, fontweight="bold", pad=15)
plt.xlabel("Customer Rating (1-5 Stars)", fontweight="bold")
plt.ylabel("Number of Reviews", fontweight="bold")
plt.tight_layout()
plt.savefig("07_rating_distribution.png", dpi=150, bbox_inches="tight")
print("Saved: 07_rating_distribution.png")
plt.close()

# ═══════════════════════════════════════════════════════════════════════════════
# EXPORT CSV
# ═══════════════════════════════════════════════════════════════════════════════
export_cols = ["date", "rating", "title_x", "text_clean",
               "dominant_topic", "topic_label", "topic_confidence",
               "neg_score", "main_category", "title_y"]
neg[export_cols].to_csv("08_negative_reviews_analyzed.csv", index=False)
print("Saved: 08_negative_reviews_analyzed.csv")

# ═══════════════════════════════════════════════════════════════════════════════
# FINAL SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*58)
print("  FUSIONTECH ANALYSIS COMPLETE")
print("="*58)
print(f"  Date window       : {cutoff.date()} to {latest.date()}")
print(f"  Total reviews     : {len(df):,}")
print(f"  Negative reviews  : {len(neg):,}  ({len(neg)/len(df)*100:.1f}%)")
print(f"  Avg neg intensity : {neg['neg_score'].mean():.1f}")
print(f"\n  TOP 3 CRITICAL PAIN POINTS:")
for rank, (_, row) in enumerate(topic_counts.head(3).iterrows(), 1):
    print(f"    #{rank}  {row['topic']:<40} {row['count']:>4}  ({row['pct']}%)")
print("="*58)
print("\nAll charts saved to current directory.")
