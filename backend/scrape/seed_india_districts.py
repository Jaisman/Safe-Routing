import pymongo
import requests
import time
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

# --- CONFIGURATION ---
# Replace with your actual MongoDB connection string
MONGO_URI = "mongodb+srv://safeRouting:safeRouting@cluster0.mwcninw.mongodb.net/"
DB_NAME = "safety_navigator"
COLLECTION_NAME = "districts"

DISTRICT_LIST_URL = "https://raw.githubusercontent.com/imdevskp/covid-19-india-data/master/district_level_latest.csv"

client = pymongo.MongoClient(MONGO_URI)
db = client[DB_NAME]
districts_col = db[COLLECTION_NAME]

geolocator = Nominatim(user_agent="safestride_google_competition")

def get_ncrb_simulated_rate(district_name):
    """
    In a real production environment, you would join this with a CSV 
    downloaded from IndiaDataPortal.com. 
    For the prototype, we use a randomized safety baseline (200-500).
    """
    import random
    return round(random.uniform(150.0, 550.0), 2)

def seed_india():
    print("🚀 Fetching District List from GitHub...")
    response = requests.get(DISTRICT_LIST_URL)
    lines = response.text.split('\n')
    
    districts_to_process = lines[1:] 
    
    districts_col.delete_many({}) # Clear old data
    print(f"🗑️ Cleared old records. Processing {len(districts_to_process)} districts...")

    count = 0
    for line in districts_to_process:
        if not line.strip(): continue
        
        parts = line.split(',')
        if len(parts) < 3: continue
        
        state_name = parts[1].strip()
        district_name = parts[2].strip()
        
        if district_name.lower() in ['unknown', 'total', 'other']: continue

        print(f"📍 Geocoding: {district_name}, {state_name}...")
        
        try:
            location = geolocator.geocode(f"{district_name} District, {state_name}, India")
            
            if location:
                crime_rate = get_ncrb_simulated_rate(district_name)
                risk_multiplier = round(1.0 + (crime_rate / 1000), 2)
                
                doc = {
                    "name": district_name,
                    "state": state_name,
                    "crime_rate": crime_rate,
                    "risk_multiplier": risk_multiplier,
                    "location": {
                        "type": "Point",
                        "coordinates": [location.longitude, location.latitude]
                    },
                    "lastUpdated": time.strftime("%Y-%m-%d")
                }
                
                districts_col.insert_one(doc)
                count += 1
                print(f"✅ Success ({count}): {district_name}")
            else:
                print(f"⚠️ Could not find coordinates for {district_name}")

            time.sleep(1.2) 
            
        except (GeocoderTimedOut, Exception) as e:
            print(f"❌ Error geocoding {district_name}: {e}")
            time.sleep(2)

    districts_col.create_index([("location", "2dsphere")])
    print(f"\n✨ FINISHED. Seeded {count} districts with 2dsphere indexing.")

if __name__ == "__main__":
    seed_india()