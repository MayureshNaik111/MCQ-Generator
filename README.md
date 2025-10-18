# MCQ Generator

A web application to generate multiple-choice questions (MCQs) dynamically.
Frontend built with **Next.js 15**, backend with **FastAPI**.

---

## Features

- Enter a topic and generate MCQs.
- Dynamic question and option display.
- Backend API powered by FastAPI.
- Fully deployable: Frontend on Vercel, Backend on Render.

---

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, TailwindCSS
- **Backend:** FastAPI, Python
- **Deployment:** Vercel (frontend), Render (backend)

---

## Setup Instructions

### Frontend

1. Clone the repo:
    ```bash
    git clone https://github.com/MayureshNaik111/MCQ-Generator.git
    cd frontend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Run locally:
    ```bash
    npm run dev
    ```
4. Build for production:
    ```bash
    npm run build
    npm start
    ```

### Backend

1. Navigate to backend folder:
    ```bash
    cd backend
    ```
2. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3. Run locally:
    ```bash
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
    ```

### Environment Variables

* **Frontend:** Create a `.env.local` file with:
    ```env
    NEXT_PUBLIC_API_URL=https://mcq-generator-wckk.onrender.com
    ```
* **Backend:** Use a `.env` file for API keys or DB connections (if any).

### Deployment

* **Frontend:** Push to GitHub → Connect repo on Vercel → Set env vars → Deploy.
* **Backend:** Push to GitHub → Connect repo on Render → Set start command (`uvicorn main:app --host 0.0.0.0 --port 10000`) → Deploy.

---

## Notes

* Ensure **CORS** is enabled in the backend for the frontend domain.
* TypeScript lint warnings typically do not block deployment.
