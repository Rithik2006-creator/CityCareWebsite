import streamlit as st
import pandas as pd
import plotly.express as px

# Load your dataset
df = pd.read_csv("Waste_Management_and_Recycling_India.csv")  # Replace with your actual file name

st.set_page_config(page_title="Waste Management Dashboard", layout="wide")
st.title("🗑️ Urban Waste Management Dashboard")

# Sidebar filters
st.sidebar.header("🔍 Filter Data")
selected_city = st.sidebar.selectbox("City/District", df["City/District"].unique())
selected_year = st.sidebar.slider("Year", int(df["Year"].min()), int(df["Year"].max()))

filtered_df = df[(df["City/District"] == selected_city) & (df["Year"] == selected_year)]

# Top KPIs
st.markdown("### 📊 Key Metrics")
col1, col2, col3 = st.columns(3)
col1.metric("Waste Generated (Tons/Day)", filtered_df["Waste Generated (Tons/Day)"].sum())
col2.metric("Recycling Rate (%)", f"{filtered_df['Recycling Rate (%)'].mean():.1f}%")
col3.metric("Efficiency Score", f"{filtered_df['Municipal Efficiency Score (1-10)'].mean():.1f}")

# Waste Type Distribution
st.markdown("### 🧪 Waste Type Distribution")
fig1 = px.pie(filtered_df, names="Waste Type", values="Waste Generated (Tons/Day)", hole=0.4,
              title="Waste Breakdown by Type")
st.plotly_chart(fig1, use_container_width=True)

# Disposal Method Breakdown
st.markdown("### 🏭 Disposal Method Breakdown")
fig2 = px.histogram(filtered_df, x="Disposal Method", color="Disposal Method",
                    title="Disposal Methods Used", text_auto=True)
st.plotly_chart(fig2, use_container_width=True)

# Landfill Capacity Map
st.markdown("### 🗺️ Landfill Locations and Capacity")
df["Latitude"] = df["Landfill Location (Lat, Long)"].str.extract(r"\((.*),")[0].astype(float)
df["Longitude"] = df["Landfill Location (Lat, Long)"].str.extract(r", (.*)\)")[0].astype(float)
fig3 = px.scatter_mapbox(df, lat="Latitude", lon="Longitude", size="Landfill Capacity (Tons)",
                         hover_name="Landfill Name", zoom=4,
                         mapbox_style="carto-positron", title="Landfill Sites")
st.plotly_chart(fig3, use_container_width=True)

# Awareness Campaigns vs Recycling Rate
st.markdown("### 📣 Campaigns vs Recycling Rate")
fig4 = px.scatter(filtered_df, x="Awareness Campaigns Count", y="Recycling Rate (%)",
                  color="City/District", size="Population Density (People/km²)",
                  title="Impact of Awareness Campaigns")
st.plotly_chart(fig4, use_container_width=True)

# Footer
st.markdown("---")
st.caption("Data Source: Municipal Waste Records | Dashboard by Aditya")
