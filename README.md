<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

<h1>🌱 Shamba AI</h1>

<p><strong>An AI-driven agricultural advisory platform for East African smallholder farmers.</strong><br/>
Photograph a sick crop — get an instant diagnosis and localized advice in your language, even offline.</p>

<p>
  <img src="https://img.shields.io/badge/Powered%20by-Gemini%20API-4285F4?style=flat-square&logo=google&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vision-Cloud%20Vision%20API-34A853?style=flat-square&logo=google-cloud&logoColor=white"/>
  <img src="https://img.shields.io/badge/ML-Vertex%20AI-FF6D00?style=flat-square&logo=google-cloud&logoColor=white"/>
  <img src="https://img.shields.io/badge/Backend-Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black"/>
  <img src="https://img.shields.io/badge/Runtime-Node.js-339933?style=flat-square&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/License-MIT-lightgrey?style=flat-square"/>
</p>

<p>
  <a href="https://ai.studio/apps/0a7332db-95fe-4f74-89a9-22762e138e49">
    <img src="https://img.shields.io/badge/▶%20Open%20in%20AI%20Studio-1a73e8?style=for-the-badge&logo=google&logoColor=white"/>
  </a>
</p>

</div>

---

## 📌 Overview

Smallholder farmers across Kenya, Tanzania, and Uganda face a persistent **"Extension Gap"** — no affordable, instant access to agronomic expertise when their crops are failing. Shamba AI closes this gap by combining Google's AI stack into a single, mobile-first advisory tool that works even in areas with no internet connectivity.

| Problem | Shamba AI Solution |
|---|---|
| No access to agronomists | Gemini-powered conversational advisory, 24/7 |
| Crop disease goes undiagnosed | Vision API + Vertex AI image diagnosis pipeline |
| Advice not in local language | Multi-lingual support: Swahili, Amharic, Luganda, English |
| No connectivity in rural areas | Offline-first PWA with background sync queue |
| Unpredictable planting seasons | Climate-smart schedules from live weather data |

---

## 🏗️ Architecture

```
Farmer Device (PWA)
        │
        ├── [OFFLINE] Image captured → IndexedDB queue
        │
        └── [ONLINE]  ──► Firebase Storage (image upload)
                               │
                        Cloud Function (trigger)
                               │
                    ┌──────────┴──────────┐
                    │                     │
              Vision API           Vertex AI Endpoint
           (pest/disease          (custom crop stress
            detection)             classifier — fallback)
                    │                     │
                    └──────────┬──────────┘
                               │
                         Gemini API
                    (advisory generation +
                     multi-lingual response)
                               │
                        Firestore (result)
                               │
                     ← Farmer notification
```

---

## ✨ Key Features

- **🔍 Image-Based Diagnosis** — Snap a photo of a diseased crop; Vision API detects pests, disease, and malnutrition markers in seconds.
- **🧠 AI Advisory** — Gemini synthesizes the diagnosis into plain-language, actionable advice grounded in East African agricultural context.
- **🌍 Multi-lingual** — Responds in the farmer's preferred language (Swahili, Amharic, Luganda, or English) with domain-appropriate vocabulary.
- **📶 Offline-First** — Captures and queues diagnoses without connectivity; auto-syncs when the network resumes via Firebase background sync.
- **🌦️ Climate-Smart Scheduling** — Generates planting calendars by combining local weather forecasts with regional crop calendars.
- **🔐 Secure Farmer Profiles** — Firebase Auth + Firestore security rules ensure farmers only access their own data and advisory history.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| AI Studio / Prototyping | Google AI Studio |
| Conversational AI | Gemini API (`gemini-2.5-pro`) |
| Image Recognition | Google Cloud Vision API |
| Custom ML Model | Vertex AI (AutoML Vision / custom endpoint) |
| Database & Sync | Firebase Firestore (with offline persistence) |
| Auth | Firebase Authentication |
| Backend Logic | Firebase Cloud Functions (Node.js / TypeScript) |
| File Storage | Firebase Storage |
| Frontend | Progressive Web App (PWA) |
| Weather Data | Open-Meteo / NASA POWER API |

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A [Google AI Studio](https://ai.studio) account
- A [Firebase](https://firebase.google.com/) project with Firestore, Auth, and Storage enabled
- A [Google Cloud](https://console.cloud.google.com/) project with Vision API and Vertex AI APIs enabled

### Local Setup

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

Copy the example env file and populate it with your credentials:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
FIREBASE_PROJECT_ID=your_firebase_project_id
VERTEX_AI_ENDPOINT=your_vertex_endpoint_url
VISION_API_KEY=your_vision_api_key
```

> ⚠️ Never commit `.env.local` to version control. It is already listed in `.gitignore`.

**4. Start the development server**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 🌐 Open in AI Studio

Prototype and iterate on the Gemini conversational layer directly in Google AI Studio:

**[→ Open Shamba AI in AI Studio](https://ai.studio/apps/0a7332db-95fe-4f74-89a9-22762e138e49)**

---

## 📁 Project Structure

```
shamba-ai/
├── app/                   # Frontend PWA (pages, components)
├── functions/             # Firebase Cloud Functions (TypeScript)
│   └── src/
│       ├── diagnosisQueue.ts   # Vision API + Vertex AI trigger
│       └── advisory.ts         # Gemini advisory generation
├── firestore.rules        # Firestore security rules
├── storage.rules          # Firebase Storage security rules
├── public/                # Static assets + service worker
├── .env.example           # Environment variable template
└── README.md
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# Simulate offline conditions (Chrome DevTools → Network → Offline)
npm run dev
# Then toggle offline mode in browser DevTools to test the sync queue

# Emulate Firebase locally
npm run firebase:emulate
```

---

## 🌍 Deployment Considerations

- **Low-bandwidth targets**: PWA bundle is code-split and image assets are lazy-loaded. Target initial load under 200 KB gzipped.
- **Device diversity**: Tested on entry-level Android devices (2 GB RAM, Android 10+).
- **Vertex AI autoscaling**: Configured for near-zero baseline (off-season) with burst capacity during planting seasons.
- **Gemini cost management**: Repeated advisory templates are cached; low-priority requests are batched.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push and open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>Built for East African farmers. Powered by Google AI.</sub>
</div>
