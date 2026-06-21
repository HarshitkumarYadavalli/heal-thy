# 🥬 Heal-Thy Wellness Platform

Heal-Thy is a personal fitness and wellness dashboard designed to calculate metabolic metrics (BMR, TDEE, BMI), track daily food/water intake, log weight history, provide step-by-step workout timers, and generate personalized 7-day daywise diet and exercise plans powered by the **Google Gemini AI API**.

The application is structured to run as a secure serverless platform using **Firebase (Authentication, Firestore, and Cloud Functions)**, with a fully responsive responsive layout (desktop Left Sidebar / mobile Bottom Tab Bar) supporting dark and light themes.

---

## 🚀 Key Features

*   **7-Day Daywise Plan**: Customized breakfast, lunch, snack, dinner, and workout guidelines generated day-by-day. Supports medical filters (e.g., Low-Glycemic meals for **Diabetic** conditions).
*   **AI Calorie Estimator**: Logs meals via natural language input and parses caloric/macro estimations on the fly.
*   **Weight Tracker & Line Graph**: Logs current weight and visualizes weight patterns over time using a custom responsive SVG historical line chart.
*   **Metabolic Energy Ring**: Compares daily logged calories against calculated Mifflin-St Jeor TDEE limits to track deficits/surpluses.
*   **Weight Projection Graph**: Predicts weight trajectory over the next 4 weeks based on target calorie logs.
*   **Goal Milestones Feed**: Tracks achievements (Calorie targets, water intake cups, protein levels) with custom chronological badges saved in database records.
*   **Workout Timer Player**: Guided exercise circuit timers with animated countdown loops.

---

## 🛠️ Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS (v3), Lucide React
*   **Backend & DB**: Firebase Auth, Firestore Database, Cloud Functions (Node.js v20)
*   **AI Engine**: Google Gemini API (`gemini-2.5-flash`)

---

## 💻 Local Development Setup

### Prerequisites
*   Node.js (version 18 or 20+ recommended)
*   npm (installed with Node)
*   Firebase CLI (optional, if you want to deploy Cloud Functions / Emulators)

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/heal-thy.git
cd heal-thy
```

### Step 2: Install Dependencies
```bash
# Install frontend packages
npm install

# Install firebase function packages
cd functions
npm install
cd ..
```

### Step 3: Environment Configuration
Create a `.env` file in the root directory and add your project configurations:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Local client-side fallback fallback key (Optional: secure functions run this server-side)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

For the Cloud Functions environment variables, configure the key on your Firebase project CLI:
```bash
firebase functions:secrets:set GEMINI_API_KEY="your_gemini_api_key"
```

### Step 4: Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🐳 Docker Deployment

The application features a production Nginx Docker container. To build and run it locally:

### 1. Build the Docker Image
```bash
docker build -t heal-thy .
```

### 2. Run the Container
```bash
docker run -d -p 8080:80 heal-thy
```
The application will be accessible at [http://localhost:8080](http://localhost:8080).

---

## 🚢 Continuous Integration & Deployment (CI/CD)

The project includes pre-configured **GitHub Actions Workflows** under the `.github/workflows/` directory:

1.  **GitHub Pages Deployment (`deploy.yml`)**:
    *   Triggers automatically on pushes to the `main` branch.
    *   Builds the static client assets and commits them to the `gh-pages` branch.
    *   **Setup**: In your GitHub Repository Settings -> Pages, select the `gh-pages` branch as your deployment source.
2.  **Docker Publishing (`docker-publish.yml`)**:
    *   Builds and pushes the production Docker image to the **GitHub Container Registry (GHCR)**.
    *   Accessible via: `ghcr.io/your_github_username/heal-thy:latest`.
