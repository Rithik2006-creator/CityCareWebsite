import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px

# -----------------------------
# Generate Demo Data
# -----------------------------
years = list(range(2020, 2026))
wards = [f"Ward {i}" for i in range(1, 57)]
waste_types = ["Organic", "Plastic", "E-Waste", "Mixed"]

# Waste Management Dataset
waste_rows = []
for year in years:
    for ward in wards:
        for wtype in waste_types:
            amount = np.random.randint(50, 250)
            recycle_rate = np.random.randint(25, 70)
            efficiency = np.random.randint(60, 85)
            waste_rows.append([year, ward, wtype, amount, recycle_rate, efficiency])

waste_df = pd.DataFrame(waste_rows, columns=[
    "Year", "Ward", "Waste_Type", "Amount_Tons", "Recycling_Rate_%", "Municipal_Efficiency_%"
])

# Potholes Dataset
pothole_rows = []
for year in years:
    for ward in wards:
        potholes = np.random.randint(10, 80)
        efficiency = np.random.randint(60, 85)
        pothole_rows.append([year, ward, potholes, efficiency])

potholes_df = pd.DataFrame(pothole_rows, columns=[
    "Year", "Ward", "Potholes_Reported", "Municipal_Efficiency_%"
])

# Water Leakage Dataset
leakage_rows = []
for year in years:
    for ward in wards:
        leakage_cases = np.random.randint(5, 30)
        efficiency = np.random.randint(60, 85)
        leakage_rows.append([year, ward, leakage_cases, efficiency])

leakage_df = pd.DataFrame(leakage_rows, columns=[
    "Year", "Ward", "Water_Leakage_Cases", "Municipal_Efficiency_%"
])


st.set_page_config(page_title="Ambernath Civic Dashboard", layout="wide")

st.title("Ambernath Municipal Dashboard")
st.sidebar.header("Filters")

selected_year = st.sidebar.selectbox("Select Year", years)

# Waste Management Section
st.subheader("🗑️ Waste Management")
filtered_waste = waste_df[waste_df["Year"] == selected_year]
fig_waste = px.bar(filtered_waste, x="Ward", y="Amount_Tons", color="Waste_Type",
                   title=f"Waste Amount by Ward ({selected_year})")
st.plotly_chart(fig_waste, use_container_width=True)

fig_recycle = px.scatter(
    filtered_waste,
    x="Amount_Tons",
    y="Recycling_Rate_%",
    color="Ward",                     
    size="Municipal_Efficiency_%",    
    hover_data=["Waste_Type"],        
    title=f"Recycling Rate vs Waste Amount ({selected_year})"
)
st.plotly_chart(fig_recycle, use_container_width=True)



# Potholes Section
st.subheader("🛣️ Potholes Reported")
filtered_potholes = potholes_df[potholes_df["Year"] == selected_year]
fig_potholes = px.bar(filtered_potholes, x="Ward", y="Potholes_Reported",
                      color="Municipal_Efficiency_%", title=f"Potholes Reported by Ward ({selected_year})")
st.plotly_chart(fig_potholes, use_container_width=True)

# Water Leakage Section
st.subheader("💧 Water Leakage Cases")
filtered_leakage = leakage_df[leakage_df["Year"] == selected_year]
fig_leakage = px.bar(filtered_leakage, x="Ward", y="Water_Leakage_Cases",
                     color="Municipal_Efficiency_%", title=f"Water Leakage Cases by Ward ({selected_year})")
st.plotly_chart(fig_leakage, use_container_width=True)

# Summary Metrics
st.markdown("### 📊 Key Indicators")
col1, col2, col3 = st.columns(3)
col1.metric("Total Waste (Tons)", filtered_waste["Amount_Tons"].sum())
col2.metric("Total Potholes", filtered_potholes["Potholes_Reported"].sum())
col3.metric("Total Leakage Cases", filtered_leakage["Water_Leakage_Cases"].sum())