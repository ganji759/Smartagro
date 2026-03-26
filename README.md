<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

<h1>🌱 Shamba AI</h1>

<p><strong>AI-driven agricultural advisory for East African smallholder farmers.</strong><br/>
Photograph a sick crop — get an instant diagnosis and localized farming advice in your language, even without internet.</p>

<p>
  <a href="https://shamba-ai-500291060983.us-west1.run.app/">
    <img src="https://img.shields.io/badge/🌐%20Live%20App-Shamba%20AI-2e7d32?style=for-the-badge"/>
  </a>
  &nbsp;
  <a href="https://ai.studio/apps/0a7332db-95fe-4f74-89a9-22762e138e49">
    <img src="https://img.shields.io/badge/▶%20AI%20Studio-Prototype-1a73e8?style=for-the-badge&logo=google&logoColor=white"/>
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/Gemini%20API-4285F4?style=flat-square&logo=google&logoColor=white"/>
  <img src="https://img.shields.io/badge/Cloud%20Vision%20API-34A853?style=flat-square&logo=google-cloud&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vertex%20AI-FF6D00?style=flat-square&logo=google-cloud&logoColor=white"/>
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black"/>
  <img src="https://img.shields.io/badge/Cloud%20Run-4285F4?style=flat-square&logo=google-cloud&logoColor=white"/>
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square"/>
</p>

</div>

---

## 📌 Overview

Smallholder farmers across Kenya, Tanzania, and Uganda face a persistent **"Extension Gap"** — no affordable, instant access to agronomic expertise when their crops are failing. Shamba AI closes this gap by combining Google's AI stack into a mobile-first tool that diagnoses crop stress from a photo and delivers actionable advice in the farmer's own language — online or offline.

| Problem | Shamba AI Solution |
|---|---|
| No access to agronomists | Gemini-powered conversational advisory, 24/7 |
| Crop disease goes undiagnosed | Vision API + Vertex AI image diagnosis pipeline |
| Advice not in local language | Swahili, Amharic, Luganda, and English support |
| No connectivity in rural areas | Offline-first PWA with Firebase background sync queue |
| Unpredictable planting seasons | Climate-smart schedules from live weather data |

---

## 🌐 Live Application

The app is deployed and publicly accessible on **Google Cloud Run**:

**👉 [https://shamba-ai-500291060983.us-west1.run.app/](https://shamba-ai-500291060983.us-west1.run.app/)**

> Hosted on Cloud Run (us-west1 region) — containerized, auto-scaling, zero cold-start management overhead.

You can also explore and remix the Gemini conversational layer directly in Google AI Studio:

**[→ Open in AI Studio](https://ai.studio/apps/0a7332db-95fe-4f74-89a9-22762e138e49)**

---

## 🏗️ Architecture

```
Farmer Device (PWA — mobile browser)
        │
        ├── [OFFLINE]  Image captured → IndexedDB queue
        │              UI: "Pending — will sync when connected"
        │
        └── [ONLINE] ──────────────────────────────────────────►
                                                               │
                                                      Firebase Storage
                                                    (image upload on sync)
                                                               │
                                                   Cloud Function (trigger)
                                                               │
                                          ┌────────────────────┴──────────────────┐
                                          │                                       │
                                    Vision API                          Vertex AI Endpoint
                                 (pest / disease /                  (custom crop stress model
                                malnutrition labels)                 — fallback on low confidence)
                                          │                                       │
                                          └────────────────────┬──────────────────┘
                                                               │
                                                         Gemini API
                                               (advisory + language detection
                                                + multi-lingual response)
                                                               │
                                               Firestore (result → farmer profile)
                                                               │
                                               ◄── Farmer receives diagnosis + advice

Deployment: Google Cloud Run (containerized Node.js, us-west1)
```

---

## ✨ Features

### 🔍 Image-Based Crop Diagnosis
Snap a photo of a stressed or diseased crop. Cloud Vision API detects pests, disease markers, and malnutrition indicators. If confidence falls below threshold, a Vertex AI custom model provides secondary classification.

### 🧠 Gemini Advisory Engine
Gemini synthesizes the raw diagnosis labels into plain-language, actionable advice grounded in East African agricultural context — recommending specific treatments, interventions, and urgency level.

### 🌍 Multi-lingual Support
Language is detected natively via Gemini. Responses are delivered in **Swahili**, **Amharic**, **Luganda**, or **English** using domain-appropriate agricultural vocabulary — not generic translation output.

### 📶 Offline-First PWA
Captures and queues diagnoses with zero connectivity. Images are stored in IndexedDB with a `pending` status. A background sync event fires automatically when connectivity resumes, uploading the queue and triggering the full diagnosis pipeline.

### 🌦️ Climate-Smart Planting Schedules
Combines local weather forecast data (Open-Meteo / NASA POWER) with regional crop calendars. Gemini synthesizes both into a plain-language planting advisory for the farmer's location and crop type.

### 🔐 Secure Farmer Profiles
Firebase Authentication gates all data access. Firestore security rules enforce that farmers only access their own advisory history. The diagnosis queue is client write-only and Cloud Function read-only.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Hosting / Runtime** | Google Cloud Run (containerized, us-west1) |
| **Conversational AI** | Gemini API (`gemini-2.5-pro`) |
| **Image Recognition** | Google Cloud Vision API |
| **Custom ML Model** | Vertex AI (AutoML Vision / custom endpoint) |
| **Database** | Firebase Firestore (with offline persistence) |
| **Authentication** | Firebase Authentication |
| **File Storage** | Firebase Storage |
| **Backend Logic** | Firebase Cloud Functions (Node.js / TypeScript) |
| **Frontend** | Progressive Web App (PWA) |
| **Weather Data** | Open-Meteo / NASA POWER API |
| **AI Prototyping** | Google AI Studio |

---

## 🚀 Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [Google Cloud](https://console.cloud.google.com/) project with **Vision API** and **Vertex AI** APIs enabled
- A [Firebase](https://firebase.google.com/) project with **Firestore**, **Auth**, **Storage**, and **Cloud Functions** enabled
- A [Gemini API key](https://aistudio.google.com/app/apikey) from Google AI Studio

### Setup

**1. Clone the repository**

```bash
git clone https://github.com/your-org/shamba-ai.git
cd shamba-ai
```

**2. Install dependencies**

```bash
npm install
```

**3. Configure environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_STORAGE_BUCKET=your_project.appspot.com

# Google Cloud
VERTEX_AI_ENDPOINT=https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT/locations/us-central1/endpoints/YOUR_ENDPOINT:predict
VISION_API_KEY=your_vision_api_key

# Weather
OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1/forecast
```

> ⚠️ `.env.local` is in `.gitignore` — never commit credentials.

**4. Start the development server**

```bash
npm run dev
```

App runs at `http://localhost:3000`.

**5. (Optional) Run Firebase emulators**

```bash
npm run firebase:emulate
```

Spins up local Firestore, Auth, Storage, and Cloud Functions — no real Firebase resources consumed during development.

---

## 🐳 Deploy to Cloud Run

The live app runs as a containerized service on Google Cloud Run. To deploy your own instance:

```bash
# Authenticate
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Build and push container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/shamba-ai

# Deploy
gcloud run deploy shamba-ai \
  --image gcr.io/YOUR_PROJECT_ID/shamba-ai \
  --platform managed \
  --region us-west1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key,FIREBASE_PROJECT_ID=your_project_id
```

> Cloud Run scales to zero off-season (minimal cost) and handles planting-season burst traffic automatically.

---

## 📁 Project Structure

```
shamba-ai/
├── app/                        # Frontend PWA
│   ├── components/             # Camera, advisory card, language selector
│   ├── pages/                  # App routes
│   └── service-worker.js       # Offline sync + background fetch
├── functions/                  # Firebase Cloud Functions (TypeScript)
│   └── src/
│       ├── diagnosisQueue.ts   # Firestore trigger → Vision API → Vertex AI
│       └── advisory.ts         # Gemini advisory generation + language routing
├── firestore.rules             # Firestore security rules
├── storage.rules               # Firebase Storage security rules
├── Dockerfile                  # Cloud Run container definition
├── .env.example                # Environment variable template
└── README.md
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Simulate offline sync queue:
# 1. npm run dev
# 2. Chrome DevTools → Network → Offline
# 3. Submit crop image — verify IndexedDB entry with status: pending
# 4. Set network to Online — verify background sync fires and result appears in UI

# Firebase emulator suite
npm run firebase:emulate

# Simulate low-bandwidth (DevTools → Network → Slow 3G)
# Verify queue holds and advisory loads progressively
```

---

## 🌍 Deployment & Scaling Notes

| Concern | Approach |
|---|---|
| **Low bandwidth** | Code-split PWA, lazy-loaded assets, initial bundle < 200 KB gzipped |
| **Device diversity** | Tested on Android 10+ / 2 GB RAM; no desktop-only APIs used |
| **Burst traffic (planting season)** | Cloud Run scales horizontally; Vertex AI endpoint has min/max replica bounds |
| **Off-season cost** | Cloud Run scales to zero; Firestore billed per operation only |
| **Gemini cost control** | Repeated advisory templates cached; low-priority requests batched |
| **Data privacy** | Farmer location + crop data anonymized before Vertex AI retraining ingestion |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit following [Conventional Commits](https://www.conventionalcommits.org/):
   ```
   feat: add Luganda voice input pipeline
   fix: resolve offline queue flush race condition
   ```
4. Push and open a Pull Request against `main`

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Built for East African farmers. Powered by Google AI.</p>
  <p>
    <a href="https://shamba-ai-500291060983.us-west1.run.app/">🌐 Live App</a> &nbsp;·&nbsp;
    <a href="https://ai.studio/apps/0a7332db-95fe-4f74-89a9-22762e138e49">▶ AI Studio</a> &nbsp;·&nbsp;
    <a href="https://console.cloud.google.com/">☁ Google Cloud Console</a>
  </p>
</div>
