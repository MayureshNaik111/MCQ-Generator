from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
import os, re, asyncio

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://mcq-generator-chi.vercel.app",  # Vercel frontend URL
        "http://localhost:3000",                 # Local frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini client once
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class TopicRequest(BaseModel):
    topic: str

@app.post("/generate_mcqs")
async def generate_mcqs(request: TopicRequest):
    topic = request.topic.strip()
    if not topic:
        raise HTTPException(status_code=400, detail="Topic is required")

    prompt = (
        f"Generate 5 multiple-choice questions (MCQs) about {topic}.\n"
        "Each MCQ should have:\n"
        "- A question\n"
        "- Four options labeled a, b, c, and d\n"
        "- The correct answer in the format: Correct Answer: <option letter>\n"
        "- A short explanation in the format: Explanation: <text>\n"
        "Separate each MCQ with a clear line like ---."
    )

    try:
        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    max_output_tokens=800,
                    top_p=0.9,
                ),
            ),
        )

        text = getattr(response, "text", None)
        if not text and hasattr(response, "candidates"):
            candidates = response.candidates
            if candidates and hasattr(candidates[0].content, "parts"):
                parts = candidates[0].content.parts
                text = " ".join(
                    p.text for p in parts if hasattr(p, "text")
                ).strip()

        if not text:
            raise HTTPException(status_code=500, detail="No MCQs generated")

        mcq_blocks = re.split(r"-{3,}", text)
        mcqs = []
        for block in filter(None, map(str.strip, mcq_blocks)):
            answer = re.search(r"Correct Answer:\s*([a-dA-D])", block)
            explanation = re.search(r"Explanation:\s*(.+)", block)
            clean_text = "\n".join(
                line for line in block.splitlines()
                if not line.lower().startswith(("correct answer:", "explanation:"))
            )

            mcqs.append({
                "question": clean_text,
                "correct_answer": answer.group(1).lower() if answer else None,
                "explanation": explanation.group(1).strip() if explanation else None,
            })

        return {"mcqs": mcqs}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
