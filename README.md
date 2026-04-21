# AI Interview

AI Interview is a full-stack mock interview platform that helps users practice interviews based on their resume, role, experience level, skills, and projects. The app generates interview questions with AI, lets candidates answer them in a timed interview flow, evaluates each answer, and produces a performance report with scores and feedback.

## Features

- Google/Firebase authentication
- Resume PDF upload and AI-powered resume parsing
- Role, experience, project, and skill-based interview question generation
- Timed interview rounds with easy, medium, and hard questions
- Microphone transcription using Deepgram
- AI answer evaluation for confidence, communication, correctness, and final score
- Interview history and detailed reports
- Razorpay payment integration for buying interview credits
- MongoDB persistence for users, interviews, and payments

## Tech Stack

### Frontend

- React 19
- Vite
- Tailwind CSS
- Redux Toolkit
- React Router
- Firebase Authentication
- Deepgram SDK
- Axios
- jsPDF and Recharts for reports

### Backend

- Node.js
- Express
- MongoDB with Mongoose
- JWT authentication with cookies
- OpenRouter API for AI generation and evaluation
- Razorpay for payments
- pdfjs-dist for resume PDF text extraction
- Multer for file uploads

## Project Structure

```text
AI-Interview/
  client/                 React/Vite frontend
    src/
      components/         Interview flow and shared UI components
      pages/              Route pages such as Home, Pricing, Interview, Reports
      redux/              Redux store and user state
      config/             Deepgram client setup
      utils/              Firebase setup

  server/                 Express backend
    config/               Database and token helpers
    controllers/          Auth, user, interview, and payment logic
    middleware/           Auth and file upload middleware
    models/               MongoDB schemas
    routes/               API route definitions
    services/             OpenRouter and Razorpay services
```

## How It Works

1. The user signs in with Google through Firebase.
2. The backend creates or finds the user and stores authentication in a cookie-based JWT session.
3. The user uploads a resume PDF and selects interview details such as role, experience, and interview mode.
4. The backend extracts text from the PDF and sends it to OpenRouter to identify role, experience, projects, and skills.
5. The backend asks OpenRouter to generate five interview questions with increasing difficulty.
6. Starting an interview costs credits from the user account.
7. The frontend presents each question with a timer and can transcribe spoken answers using Deepgram.
8. Each submitted answer is evaluated by AI for confidence, communication, correctness, final score, and short feedback.
9. When the interview ends, the backend calculates the final report and stores the interview.
10. The user can view previous interviews and open detailed reports later.

## Prerequisites

Install these before running the project:

- Node.js
- npm
- MongoDB database connection string
- Firebase project for Google authentication
- OpenRouter API key
- Deepgram API key
- Razorpay account and keys

## Environment Variables

Create a `.env` file inside `server/`:

```env
PORT=8000
MONGODB_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
OPENROUTER_API_KEY=your_openrouter_api_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

Create a `.env` file inside `client/`:

```env
VITE_FIREBASE_APIKEY=your_firebase_api_key
VITE_DEEPGRAM_API_KEY=your_deepgram_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

The frontend currently expects the backend to run at:

```text
http://localhost:8000
```

The backend allows frontend requests from:

```text
http://localhost:5173
```

## Setup

Clone the repository:

```bash
git clone https://github.com/mridul100503/AI-Interview.git
cd AI-Interview
```

Install frontend dependencies:

```bash
cd client
npm install
```

Install backend dependencies:

```bash
cd ../server
npm install
```

Add the required `.env` files in both `client/` and `server/`.

## Running Locally

Start the backend:

```bash
cd server
npm run dev
```

Start the frontend in a second terminal:

```bash
cd client
npm run dev
```

Open the app in your browser:

```text
http://localhost:5173
```

## Available Scripts

Frontend scripts:

```bash
npm run dev       # Start Vite development server
npm run build     # Build production frontend
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

Backend scripts:

```bash
npm run dev       # Start Express server with nodemon
```

## API Overview

The backend exposes these route groups:

```text
/api/auth          Authentication routes
/api/user          Current user and user data routes
/api/interview     Resume analysis, question generation, answers, reports
/api/payment       Razorpay order creation and payment verification
```

## Notes

- Do not commit `.env` files. They contain API keys and secrets.
- `node_modules/` and build outputs are ignored by Git.
- Interview generation requires at least 50 user credits.
- Resume upload expects a PDF file.
- Microphone transcription requires browser microphone permission and a valid Deepgram key.
