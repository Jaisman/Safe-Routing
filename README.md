🛡️ **SafeRoute – AI Powered Safer Route Navigation**

SafeRoute is an **AI-powered route safety analysis system** that helps users choose safer travel paths instead of just the fastest or shortest ones.

Traditional navigation apps optimize for time or distance, but SafeRoute analyzes multiple environmental and crime-related factors to calculate a **route safety score** and detect high-risk hotspots.

The system uses crime data, lighting information, nightlife density, CCTV coverage, police proximity, and user reports to estimate safety along a route.
🚀 **Features**
🔍 AI-Based Route Safety Scoring

Each route is analyzed using multiple safety indicators to generate a 0–100 safety score.

⚠️ Hotspot Detection

Dangerous sections of a route are detected and marked as risk hotspots.

🧠 Multi-Factor Safety Analysis

**The model evaluates several environmental features:**

Street lighting levels

Nearby nightlife density

Building density

CCTV camera coverage

Distance to police stations

Nearby crime reports

User reported incidents

Time-of-day risk multiplier

🗺️ Route Sampling

Instead of evaluating every coordinate, the system samples key points along the route for efficient processing.

⚡ Parallel Data Fetching

Uses asynchronous requests to gather data from multiple services simultaneously for faster analysis.

🛑 Dark Spot Detection

Identifies unlit high-risk zones where crime risk is higher due to poor lighting.

⚙️ **Installation**

1️⃣ Clone the repository

git clone https://github.com/Jaisman/Safe-Routing.git

cd safety-navigator

2️⃣ Install dependencies

npm install 
npm install react-leaflet

3️⃣ Configure environment variables

Create a .env file:

ORS_API_KEY=your_openrouteservice_api_key
MONGO_URI=your_mongodb_uri

4️⃣ Run the server

npm run dev

Server will run on:

http://localhost:5000


