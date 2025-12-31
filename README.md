
---

```markdown
# ⚡ Knect
**The Hyper-Local Social Graph for Communities**

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Tech Stack](https://img.shields.io/badge/Stack-React%20Native%20%7C%20Supabase-blue)
![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20iOS-lightgrey)

> **"Don't just collect contacts. Remember where you met."**

Knect is a real-time mobile application that bridges the physical and digital worlds. It allows users to instantly connect via QR codes, automatically capturing the **geospatial context** of the meeting. It replaces traditional business cards with a dynamic, location-aware social graph.

---

## 📱 App Screenshots
| **The Radar (Home)** | **Scan & Connect** | **Spatial Grid** |
|:---:|:---:|:---:|
| ![Radar Screen](https://via.placeholder.com/200x400?text=Radar+UI) | ![Scanner](https://via.placeholder.com/200x400?text=QR+Scanner) | ![Map Grid](https://via.placeholder.com/200x400?text=Google+Maps) |
| *Real-time list of connections* | *Instant mutual linking* | *Visual history of meetings* |

---

## 🚀 Key Features

### 🔗 1. Mutual "Flash" Connections
Unlike LinkedIn (Request -> Accept), Knect uses a **Bi-Directional Handshake**.
- User A scans User B.
- The system instantaneously creates **two** database records.
- **Result:** Both users appear in each other's lists immediately.

### 📍 2. Geospatial Memory
Every connection is tagged with high-precision GPS coordinates.
- **The "Grid" Tab:** Visualizes your network on an interactive Google Map.
- **Context:** Remember exactly *where* you met someone (e.g., "The Huddle Global Summit" vs "College Canteen").

### ⚡ 3. Real-Time Sync
Powered by **Supabase Realtime**.
- No "Pull to Refresh" needed.
- When someone scans you, your device vibrates and the UI updates **instantly**.

### 🔐 4. Secure Identity
- Full Authentication system (Sign Up/Login).
- Encrypted data transmission.
- Row Level Security (RLS) ensures you only fetch your own data.

---

## 🛠️ Tech Stack

**Frontend:**
* **Framework:** React Native (Expo SDK 52)
* **Language:** JavaScript (ES6+)
* **Navigation:** React Navigation (Tabs & Stacks)
* **Maps:** React Native Maps (Google Maps SDK)

**Backend (BaaS):**
* **Database:** Supabase (PostgreSQL)
* **Auth:** Supabase Auth (JWT)
* **Storage:** Supabase Storage (Profile Avatars)
* **Realtime:** PostgreSQL Replication

**DevOps:**
* **Build Tool:** EAS (Expo Application Services)
* **CI/CD:** EAS Build (Cloud compilation)

---

## ⚙️ Architecture: The "Mutual Logic"

One of the core engineering challenges was ensuring connections are mutual without a pending state. Here is the logic flow:

```javascript
// When User A scans User B:
const mutualConnections = [
  {
    connector_id: Me,            
    connected_to_id: You,
    location: { lat, long },
    timestamp: NOW
  },
  {
    connector_id: You,   
    connected_to_id: Me,         
    location: { lat, long },
    timestamp: NOW
  }
];

// Perform an UPSERT (Update if exists, Insert if new)
await supabase.from('connections').upsert(mutualConnections);

```

---

## 💻 Installation & Setup

Want to run this locally?

**1. Clone the repo**

```bash
git clone [https://github.com/your-username/knect-mobile.git](https://github.com/your-username/knect-mobile.git)
cd knect-mobile

```

**2. Install Dependencies**

```bash
npm install

```

**3. Configure Environment**
Create a `.env` file or export secrets in your terminal:

```bash
export EXPO_PUBLIC_SUPABASE_URL="your-supabase-url"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

```

**4. Run Simulator**

```bash
npx expo start

```

---

## 🗺️ Roadmap

* [x] **v1.0:** Core Scanning & List View
* [x] **v1.1:** Google Maps Integration
* [x] **v2.0:** Real-time Auto-Refresh & Mutual Logic
* [ ] **v3.0:** NFC "Tap to Connect" support
* [ ] **v4.0:** Blockchain Verification for high-value networking events

---

## 👤 Author

**Caine Benoy**

* *BCA Student & TinkerHub Campus Lead*
* *Sahrdaya College of Advanced Studies*

---

*"Building the future of networking, one scan at a time."*

```
