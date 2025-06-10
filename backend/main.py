import os
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# --- Configuration ---
# Choose your AI model provider
AI_PROVIDER = "deepseek" # or "gemini"
API_KEY = os.getenv("AI_API_KEY")

# --- App Setup ---
app = FastAPI()

# CORS Middleware: Allows our frontend to talk to our backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for simplicity in MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
# Defines the structure of the data we expect from the frontend
class StudentAnswer(BaseModel):
    module_id: int
    answer: str

# --- AI Interaction Logic ---
def get_ai_response(prompt: str):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    
    if AI_PROVIDER == "gemini":
        # NOTE: This is a simplified example. Check Google's official Gemini API docs for the exact structure.
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" + API_KEY
        headers = {"Content-Type": "application/json"} # Gemini uses API key in URL, not bearer token
        data = {"contents": [{"parts": [{"text": prompt}]}]}
    elif AI_PROVIDER == "deepseek":
        url = "https://api.deepseek.com/chat/completions"
        data = {
            "model": "deepseek-chat",
            "messages": [{"role": "user", "content": prompt}]
        }
    else:
        raise ValueError("Invalid AI_PROVIDER configured")

    try:
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status() # Raises an error for bad responses (4xx or 5xx)
        
        if AI_PROVIDER == "gemini":
            # Extract text from Gemini's specific response structure
            return response.json()['candidates'][0]['content']['parts'][0]['text']
        elif AI_PROVIDER == "deepseek":
            return response.json()['choices'][0]['message']['content']
            
    except requests.exceptions.RequestException as e:
        print(f"API Request failed: {e}")
        return "Sorry, I'm having trouble connecting to my brain right now. Please try again later."


# --- API Endpoints ---
from curriculum import COURSE_CONTENT

@app.get("/start_lesson")
def start_lesson():
    """Returns the very first explanation to kick off the lesson."""
    first_module = COURSE_CONTENT["modules"][0]
    prompt = f"You are a friendly and encouraging AI tutor. Start the lesson by explaining the following concept to a brand new student in a simple, welcoming way. Here is the concept: '{first_module['explanation']}'"
    
    ai_explanation = get_ai_response(prompt)
    return {"module_id": first_module["id"], "message": ai_explanation}


@app.post("/submit_answer")
def submit_answer(student_answer: StudentAnswer):
    """Processes a student's answer, gives feedback, and provides the next step."""
    module_id = student_answer.module_id
    user_code = student_answer.answer

    # Find the current module
    current_module = next((m for m in COURSE_CONTENT["modules"] if m["id"] == module_id), None)
    if not current_module:
        return {"message": "Error: Invalid module ID."}

    # --- Generate Feedback ---
    feedback_prompt = f"""You are a helpful AI programming tutor. A student was asked: '{current_module['question']}'
    They submitted the following code: `{user_code}`
    The key components of a correct answer are: {current_module['answer_keywords']}.
    
    Analyze their answer.
    - If it's correct, praise them enthusiastically.
    - If it's incorrect, gently point out the mistake without giving the direct answer. Guide them to fix it. For example, if they forgot quotes, say 'That's so close! Remember that text values, or strings, need to be wrapped in something special.'
    - Keep your feedback concise (2-3 sentences).
    
    After giving feedback, if their answer was correct, introduce the next topic.
    """
    ai_feedback = get_ai_response(feedback_prompt)

    # --- Determine the Next Step ---
    next_module_id = module_id + 1
    next_module = next((m for m in COURSE_CONTENT["modules"] if m["id"] == next_module_id), None)
    
    response_data = {"feedback": ai_feedback}
    
    # If there is a next module, prepare the next explanation and question
    if next_module:
        next_explanation_prompt = f"You are an AI tutor. Seamlessly transition to the next topic. Explain the following concept simply: '{next_module['explanation']}'"
        next_explanation = get_ai_response(next_explanation_prompt)
        
        response_data.update({
            "next_module_id": next_module["id"],
            "next_explanation": next_explanation,
            "next_question": next_module["question"]
        })
    else: # End of course
        response_data["next_module_id"] = None

    return response_data
