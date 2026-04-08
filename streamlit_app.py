import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import folium
from streamlit_folium import st_folium

# --- Page Config ---
st.set_page_config(
    page_title="ResQRoute | Road Safety AI",
    page_icon="🚨",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- Custom Styling ---
st.markdown("""
    <style>
    .main { background-color: #0a0f1e; color: #f1f5f9; }
    .stMetric { background-color: #111827; padding: 20px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07); }
    .stAlert { border-radius: 12px; }
    h1, h2, h3 { font-family: 'Space Grotesk', sans-serif; }
    </style>
    """, unsafe_allow_html=True)

# --- Data Generation (Reusing Logic from analysis/main.py) ---
@st.cache_data
def generate_accident_dataset(n: int = 12000) -> pd.DataFrame:
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
        if h in [7, 8, 9, 17, 18, 19]: base += 0.3
        if h in [22, 23, 0, 1]: base += 0.25
        if c == "Fog": base += 0.2
        if c == "Rain": base += 0.15
        severity.append(min(1.0, base + np.random.normal(0, 0.1)))

    causes = np.random.choice(
        ["Overspeeding", "Drunk Driving", "Phone Usage", "Poor Visibility", "Other"],
        size=n,
        p=[0.34, 0.22, 0.18, 0.14, 0.12]
    )
    return pd.DataFrame({
        "hour": hours, "day": days, "conditions": conditions,
        "severity": severity, "cause": causes,
        "lat": np.random.uniform(12.9, 13.1, n), # Random lat around Chennai
        "lng": np.random.uniform(80.1, 80.3, n)  # Random lng around Chennai
    })

df = generate_accident_dataset()

# --- Sidebar ---
st.sidebar.title("🚀 ResQRoute AI")
st.sidebar.markdown("Intelligent Road Safety & Emergency Response Dashboard")

current_hour = datetime.now().hour
selected_hour = st.sidebar.slider("Simulation Hour", 0, 23, current_hour)
selected_condition = st.sidebar.selectbox("Weather Condition", ["Clear", "Rain", "Fog", "Night", "Rush Hour"])

# --- Main Dashboard ---
st.title("📊 Safety Analytics & Risk Prediction")
st.markdown("Real-time data processing of **12,000+** historical incident records.")

# Metrics Row
col1, col2, col3, col4 = st.columns(4)

# Calculate Risk for Selected State
risk_df = df[df['hour'] == selected_hour]
avg_severity = risk_df['severity'].mean() * 100
risk_level = "HIGH" if avg_severity > 65 else "MEDIUM" if avg_severity > 45 else "LOW"
risk_color = "red" if risk_level == "HIGH" else "orange" if risk_level == "MEDIUM" else "green"

col1.metric("Risk Score", f"{avg_severity:.1f}%", delta=risk_level, delta_color="inverse")
col2.metric("Avg Response Time", "8.4 min", "Excellent")
col3.metric("Live Responders", "1,248", "+12")
col4.metric("Active SOS", "3", "-1")

# Map & Suggestions Row
st.markdown("---")
m_col1, m_col2 = st.columns([2, 1])

with m_col1:
    st.subheader("📍 Real-Time Incident Heatmap")
    # Simple Map with Folium
    m = folium.Map(location=[13.0, 80.2], zoom_start=11, tiles="CartoDB dark_matter")
    # Add some sample hotspots
    for i, row in df.sample(100).iterrows():
        folium.CircleMarker(
            location=[row['lat'], row['lng']],
            radius=3,
            color='#ef4444' if row['severity'] > 0.7 else '#f59e0b',
            fill=True,
            opacity=0.6
        ).add_to(m)
    st_folium(m, width=800, height=450)

with m_col2:
    st.subheader("📢 Safety Suggestions")
    if risk_level == "HIGH":
        st.error(f"⚠️ High-risk period ({selected_hour}:00) detected.")
        st.info("🚗 Reduce speed — accident severity spikes now.")
        st.info("🏥 Nearest hospital route pre-loaded.")
        st.info("📱 Avoid phone usage while driving.")
    elif risk_level == "MEDIUM":
        st.warning(f"🟡 Moderate risk at {selected_hour}:00.")
        st.info("👀 Stay alert — traffic flow is increasing.")
        st.info("🚔 Police patrol active in this zone.")
    else:
        st.success(f"✅ Low-risk period — roads are safe.")
        st.info("🚗 Good time to travel — normal traffic.")
        st.info("🚑 Emergency services on stand-by.")

# Charts Row
st.markdown("---")
c1, c2 = st.columns(2)

with c1:
    st.subheader("📅 Weekly Accident Trend")
    weekly = df.groupby("day")["severity"].count().reindex(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]).reset_index()
    fig_weekly = px.bar(weekly, x="day", y="severity", color="severity", 
                        color_continuous_scale="Reds", template="plotly_dark")
    fig_weekly.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig_weekly, use_container_width=True)

with c2:
    st.subheader("🕒 Hourly Risk Volume")
    hourly = df.groupby("hour").size().reset_index(name="accidents")
    fig_hourly = px.area(hourly, x="hour", y="accidents", template="plotly_dark", color_discrete_sequence=["#ef4444"])
    fig_hourly.update_layout(paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)")
    st.plotly_chart(fig_hourly, use_container_width=True)

st.markdown("---")
st.caption("ResQRoute Platform | IIT Madras Hackathon Project | Powered by AI & Real-time Data")
