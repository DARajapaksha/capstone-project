# 🎓 Secure Identity Verification System for Online Exams

A comprehensive, multi-layered identity verification system designed to ensure academic integrity for online examinations. It features real-time AI liveness detection, facial matching, blockchain-backed immutable records, and multi-dashboard management.

## ✨ Key Features

- **👩‍🎓 Student Portal:** A premium UI for students to browse exams, enroll, and perform pre-exam identity verification (OTP, ID upload, and Live Selfie matching).
- **🛡️ AI Identity Engine:** A dedicated Python Flask service that analyzes video feeds for liveness detection (anti-spoofing) and performs facial geometry matching between IDs and live captures.
- **👨‍💼 Admin Dashboard:** A centralized management hub for creating exams, tracking enrollments, and permanently deleting/resetting user accounts.
- **👁️ Verifier Dashboard:** A specialized interface for human review of edge-case verifications, allowing staff to approve or reject flagged identity checks.
- **📧 Global OTP Delivery:** Integrated with Nodemailer and Gmail to instantly deliver 6-digit verification codes to any email address globally without domain restrictions.
- **🔗 Blockchain Integration:** Verification results and transaction hashes are immutably logged to the Polygon network to prevent tampering.

## 🛠️ Technology Stack

### Frontends (Web Applications)
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS & Vanilla CSS
- **Icons:** Lucide React
- **Dashboards:** Student Portal, Admin Dashboard, Verifier Dashboard

### Backend API
- **Runtime:** Node.js & Express.js
- **Database:** Firebase Firestore (NoSQL)
- **Authentication:** Firebase Auth & Custom JWT
- **Email Service:** Nodemailer (Gmail App Passwords)
- **Cloud Storage:** Firebase Storage / Cloudinary (for IDs and Selfies)

### AI Microservice
- **Framework:** Python & Flask
- **Libraries:** OpenCV, Dlib, Face_Recognition, NumPy
- **Capabilities:** Deep learning facial embeddings, structural similarity, and blink/motion detection.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **Firebase Account** (Firestore, Storage, and Auth enabled)
- **Gmail Account** (with 2-Step Verification and App Passwords enabled)

### 1. Clone the Repository
```bash
git clone https://github.com/DARajapaksha/capstone-project.git
cd capstone-project
```

### 2. Setup the Node.js Backend
The core API that connects the frontends to Firebase, Blockchain, and the AI service.

```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=5000
AI_SERVICE_URL=http://localhost:5001
JWT_SECRET=your_super_secret_jwt_key

# Nodemailer Setup (for OTPs)
EMAIL_USER=your_project_email@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password

# Firebase Admin SDK path
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```
*Note: You must download your `serviceAccountKey.json` from Firebase Project Settings and place it in the `backend` folder.*

Start the backend:
```bash
npm start
```

### 3. Setup the AI Service (Python)
The facial recognition and liveness detection engine.

```bash
cd ai-service
python -m venv venv
# Activate the virtual environment:
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
python app.py
```
*The AI service will run on `http://localhost:5001`.*

### 4. Setup the Frontends
The project contains three distinct React applications. You will need a separate terminal for each.

**Student Portal:**
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

**Admin Dashboard:**
*(Navigate to the admin folder from the main CODE directory)*
```bash
cd university-blockchain-admin-dashboard
npm install
npm run dev
# Runs on http://localhost:3001
```

**Verifier Dashboard:**
*(Navigate to the verifier folder from the main CODE directory)*
```bash
cd verifier-dashboard
npm install
npm run dev
# Runs on http://localhost:3002
```

*(Note: All frontends require a `.env` file with `VITE_FIREBASE_*` credentials for client-side Auth and Storage).*

---

## 👥 Contributors

- **Dinsanda Amajith** *(@DARajapaksha)*
- **Hashen Dilshan** *(@dilacode007)*
- **Janidu Viduranga** *(@JaniduViduranga)*
- **Anoj Subodha Mohotti** *(@subodha78)*
- **Wathsala Indeevari** *(@WathsalaIndeevari)*

## 📄 License
This project is developed as an academic capstone project.
