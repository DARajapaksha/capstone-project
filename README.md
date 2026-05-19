# 🎓 Secure Identity Verification System for Online Exams

A blockchain-backed, AI-powered identity verification system integrated into a student portal. This capstone project ensures academic integrity for online examinations through real-time liveness detection, document verification, and immutable verification records.

## ✨ Features

- **🔒 Secure Authentication:** Firebase-backed student login and registration.
- **👩‍🎓 Student Dashboard:** Premium UI for browsing available exams, tracking enrolled exams, and monitoring academic activity.
- **🛡️ Identity Verification Engine:**
  - Multi-step verification flow (Upload ID, Capture Selfie).
  - AI-based Liveness Detection to prevent spoofing.
  - Document & Face matching using AI.
- **🔗 Blockchain Integration:** Verification results and hashes are stored immutably to prevent tampering.
- **⚙️ Profile Management:** Real-time profile state management with local storage persistence and custom profile picture uploads.
- **🔔 Notifications:** Interactive notification drawer with read/unread state tracking.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 with Vite
- **Routing:** React Router DOM
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** React Context API & Context Providers
- **Authentication:** Firebase Auth

### Backend & AI / Blockchain (In Progress)
- **AI Service:** Facial recognition and liveness detection.
- **Blockchain:** Smart contracts for immutable identity record storage.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Firebase account (for authentication setup)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DARajapaksha/capstone-project.git
   cd capstone-project
   ```

2. **Setup the Frontend:**
   ```bash
   cd frontend
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the `frontend` directory and add your Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`.

## 📁 Project Structure

```text
capstone-project/
├── frontend/                 # React Vite application
│   ├── src/
│   │   ├── components/       # Reusable UI components (Nav, Sidebar, Alerts)
│   │   ├── contexts/         # React Context (e.g., ProfileContext)
│   │   ├── firebase/         # Firebase configuration and initialization
│   │   ├── layouts/          # Application layouts (StudentLayout)
│   │   └── pages/            # Main application pages
│   │       ├── auth/         # Login & Registration
│   │       ├── student/      # Dashboard, Profile, Activity, Exams
│   │       └── VerificationPage.jsx # Core Identity Verification Flow
├── ai-service/               # AI Liveness and Recognition APIs (WIP)
└── blockchain/               # Smart Contracts & Web3 integration (WIP)
```

## 👥 Contributors

- **DARajapaksha** - *Capstone Developer*

## 📄 License

This project is developed as an academic capstone project.
