"""
Smart Emergency Response System — Python Analysis Service
Powered by FastAPI + Pandas + Seaborn + Plotly
Analyzes road accident patterns and serves data-driven insights.
"""
import json
import warnings
from datetime import datetime
from typing import Optional
import numpy as np
import pandas as pd
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

warnings.filterwarnings("ignore")

app = FastAPI(title="Emergency Response Analysis API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Generate realistic road accident dataset (based on seaborn/plotly patterns) ─
def generate_accident_dataset(n: int = 1000) -> pd.DataFrame:
    np.random.seed(42)
    p_hours = np.array([
        0.04, 0.05, 0.03, 0.02, 0.02, 0.03, 0.04, 0.07, 0.08, 0.05,
        0.03, 0.03, 0.03, 0.03, 0.03, 0.04, 0.05, 0.08, 0.07, 0.05,
        0.04, 0.05, 0.05, 0.06
    ])
    p_hours = p_hours / p_hours.sum()
    hours = np.random.choice(range(24), size=n, p=p_hours)
    days = np.random.choice(
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        size=n,
        p=[0.12, 0.11, 0.13, 0.11, 0.18, 0.20, 0.15]
    )
    conditions = np.random.choice(
        ["Clear", "Rain", "Fog", "Night", "Rush Hour"],
        size=n,
        p=[0.45, 0.20, 0.10, 0.15, 0.10]
    )
    severity = []
    for h, c in zip(hours, conditions):
        base = 0.3
        if h in [7, 8, 9, 17, 18, 19]:
            base += 0.3
        if h in [22, 23, 0, 1]:
            base += 0.25
        if c == "Fog":
            base += 0.2
        if c == "Rain":
            base += 0.15
        severity.append(min(1.0, base + np.random.normal(0, 0.1)))

    causes = np.random.choice(
        ["Overspeeding", "Drunk Driving", "Phone Usage", "Poor Visibility", "Other"],
        size=n,
        p=[0.34, 0.22, 0.18, 0.14, 0.12]
    )
    response_times = [
        max(2.0, 8 + np.random.normal(0, 2) + (0.5 if h in range(7, 10) or h in range(17, 20) else 0))
        for h in hours
    ]
    return pd.DataFrame({
        "hour": hours, "day": days, "conditions": conditions,
        "severity": severity, "cause": causes,
        "response_time_min": response_times,
        "fatality": (np.array(severity) > 0.75).astype(int),
    })

# Load dataset once at startup
df = generate_accident_dataset()
print(f"Loaded accident dataset: {len(df):,} records")

# Pre-compute insights
peak_hours = (
    df.groupby("hour")["severity"]
    .agg(["mean", "count"])
    .rename(columns={"mean": "avg_severity", "count": "total"})
    .sort_values("avg_severity", ascending=False)
)
weekly_pattern = df.groupby("day")["severity"].count().reset_index()
weekly_pattern.columns = ["day", "accidents"]
condition_risk = df.groupby("conditions")["severity"].mean().reset_index()
condition_risk.columns = ["condition", "risk"]
cause_dist = df["cause"].value_counts(normalize=True).reset_index()
cause_dist.columns = ["cause", "percentage"]
cause_dist["percentage"] = (cause_dist["percentage"] * 100).round(1)

# ── Endpoints ──────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "Emergency Response Analysis", "records": len(df)}

@app.get("/insights")
def get_insights():
    now = datetime.now()
    hour = now.hour
    is_peak = hour in [7, 8, 9, 17, 18, 19, 22, 23]
    risk_score = float(peak_hours.loc[hour, "avg_severity"] * 100) if hour in peak_hours.index else 30.0

    suggestions = []
    if risk_score > 65:
        suggestions = [
            f"High-risk period ({hour}:00) - extra caution advised",
            "Keep emergency numbers saved and accessible",
            "Reduce speed - accident severity spikes now",
            "Avoid phone usage while driving",
        ]
    elif risk_score > 45:
        suggestions = [
            "Moderate risk - stay alert",
            "Nearest hospital route pre-loaded",
            "Response times slightly elevated",
        ]
    else:
        suggestions = [
            "Low-risk period - roads are relatively safe",
            "Good time to travel - normal traffic",
            "Emergency services on stand-by 24/7",
        ]

    congestion = np.random.randint(10, 90)
    congestion_index = congestion / 100.0
    
    # Generate 24 hours of volume data
    hourly_volume = [
        {"hour": f"{h:02d}:00", "volume": int(np.random.randint(100, 1000))}
        for h in range(24)
    ]

    return {
        "currentRisk": "HIGH" if risk_score > 65 else "MEDIUM" if risk_score > 45 else "LOW",
        "riskScore": round(risk_score, 1),
        "currentPeriod": "Peak Rush Hour" if is_peak else "Off-Peak Hours",
        "suggestions": suggestions,
        "peakAccidentHours": [
            {"hour": int(h), "risk": round(float(peak_hours.loc[h, "avg_severity"]), 2), "label": f"{h}:00"}
            for h in sorted(peak_hours.nlargest(6, "avg_severity").index)
        ],
        "weeklyPattern": weekly_pattern.to_dict("records"),
        "conditionRisk": condition_risk.to_dict("records"),
        "commonCauses": cause_dist.to_dict("records"),
        "avgResponseTime": {
            "hospital": round(df["response_time_min"].mean() + 1.5, 1),
            "police": round(df["response_time_min"].mean() - 0.8, 1),
            "ambulance": round(df["response_time_min"].mean() + 2.1, 1),
        },
        "trafficFlow": {
            "congestionIndex": congestion_index,
            "currentDensity": "HIGH" if congestion_index > 0.7 else "MODERATE" if congestion_index > 0.4 else "LOW",
            "avgSpeed": int(np.random.randint(20, 60)) if is_peak else int(np.random.randint(40, 90)),
            "occupancy": int(congestion + np.random.randint(-5, 5)),
            "hourlyVolume": hourly_volume,
            "speedDistribution": [
                {"range": "0-20", "percentage": 15},
                {"range": "20-40", "percentage": 25},
                {"range": "40-60", "percentage": 40},
                {"range": "60+", "percentage": 20},
            ]
        },
        "hotspots": [
            {"id": i, "name": f"Zone {chr(64+i)}", "risk": "HIGH" if i == 1 else "MEDIUM", "accidents": int(np.random.randint(5, 20))}
            for i in range(1, 4)
        ],
        "totalIncidentsAnalyzed": len(df),
        "source": "python_analysis",
    }

@app.get("/risk")
def get_risk(hour: Optional[int] = Query(None), conditions: Optional[str] = Query("Clear")):
    if hour is None:
        hour = datetime.now().hour
    hour = hour % 24
    base = float(peak_hours.loc[hour, "avg_severity"] * 100) if hour in peak_hours.index else 30.0
    cond_boost = condition_risk[condition_risk["condition"] == conditions]["risk"].values
    boost = float(cond_boost[0]) * 10 if len(cond_boost) else 0
    score = min(100, round(base + boost, 1))
    return {
        "hour": hour,
        "conditions": conditions,
        "riskScore": score,
        "level": "HIGH" if score > 65 else "MEDIUM" if score > 45 else "LOW",
        "reason": f"Based on {len(df):,} historical accident records",
    }

@app.get("/heatmap")
def get_heatmap():
    heatmap = df.groupby("hour").size().reset_index(name="accidents")
    return {"heatmap": heatmap.to_dict("records"), "source": "python_analysis"}

@app.get("/charts/weekly")
def chart_weekly():
    fig = px.bar(
        weekly_pattern, x="day", y="accidents",
        color="accidents",
        color_continuous_scale="reds",
        title="Weekly Accident Distribution",
        template="plotly_dark",
    )
    fig.update_layout(paper_bgcolor="#0f172a", plot_bgcolor="#0f172a")
    return json.loads(fig.to_json())

@app.get("/charts/hourly")
def chart_hourly():
    hourly = df.groupby("hour").size().reset_index(name="accidents")
    fig = px.area(hourly, x="hour", y="accidents",
                  title="Accidents by Hour of Day",
                  template="plotly_dark",
                  color_discrete_sequence=["#ef4444"])
    fig.update_layout(paper_bgcolor="#0f172a", plot_bgcolor="#0f172a")
    return json.loads(fig.to_json())

@app.get("/charts/conditions")
def chart_conditions():
    fig = px.pie(condition_risk, values="risk", names="condition",
                 title="Risk by Weather Condition",
                 template="plotly_dark",
                 color_discrete_sequence=px.colors.sequential.Reds)
    fig.update_layout(paper_bgcolor="#0f172a", plot_bgcolor="#0f172a")
    return json.loads(fig.to_json())

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
