import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI  # <-- Import the OpenAI library

# --- Configuration ---
load_dotenv()
API_KEY = os.getenv("DEEPSEEK")

# Check if the API key is loaded
if not API_KEY:
    raise ValueError("AI_API_KEY not found. Please set it in your .env file.")

# Initialize the DeepSeek client using the OpenAI SDK structure
client = OpenAI(api_key=API_KEY, base_url="https://api.deepseek.com")

# --- App Setup ---
app = FastAPI()

# CORS Middleware to allow frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---
class StudentAnswer(BaseModel):
    module_id: int
    answer: str

# --- AI Interaction Logic (Refactored) ---
def get_ai_response(system_prompt: str, user_prompt: str):
    """
    Gets a response from the DeepSeek API using a system and user prompt.
    """
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            stream=False,
            temperature=0.7, # A little creativity is good for a tutor
            max_tokens=250,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"DeepSeek API call failed: {e}")
        return "Sorry, I'm having a technical issue at the moment. Please try again."

# --- API Endpoints (Updated to use new AI function) ---
from curriculum import COURSE_CONTENT

@app.get("/start_lesson")
def start_lesson():
    first_module = COURSE_CONTENT["modules"][0]
    
    # ADD MARKDOWN INSTRUCTION
    system_prompt = """You are a friendly and encouraging AI programming tutor. Your goal is to explain concepts to a brand new student. 
    Use simple, welcoming language. 
    **Format your output using Markdown.** Use backticks for `code` and code blocks for examples."""
    
    user_prompt = f"Please start the lesson by explaining this concept: '{first_module['explanation']}'"
    ai_explanation = get_ai_response(system_prompt, user_prompt)
    return {"module_id": first_module["id"], "message": ai_explanation}


@app.post("/submit_answer")
def submit_answer(student_answer: StudentAnswer):
    """Processes a student's answer, gives feedback, and provides the next step."""
    module_id = student_answer.module_id
    user_code = student_answer.answer

    # Find the current module
    current_module = next((m for m in COURSE_CONTENT["modules"] if m["id"] == module_id), None)
    if not current_module:
        return {"error": "Invalid module ID."}

    # --- Generate Feedback ---
    feedback_system_prompt = """You are a helpful and patient AI programming tutor. Your role is to analyze a student's code and provide constructive feedback.
    - If the code is correct, praise them enthusiastically.
    - If the code is incorrect, gently point out the mistake without giving the direct answer.
    - **Format your entire response using Markdown.** Use backticks for `code` and bold for emphasis.
    - Keep your feedback concise (2-4 sentences)."""
    
    feedback_user_prompt = f"""The student was asked this question: '{current_module['question']}'
    
    They submitted the following code:
    `{user_code}`

    The key components of a correct answer are: {current_module['answer_keywords']}. Please provide feedback based on their submission."""

    ai_feedback = get_ai_response(feedback_system_prompt, feedback_user_prompt)

    # --- Determine the Next Step ---
    next_module_id = module_id + 1
    next_module = next((m for m in COURSE_CONTENT["modules"] if m["id"] == next_module_id), None)
    
    response_data = {"feedback": ai_feedback}
    
    # If there is a next module, prepare the next explanation and question
    if next_module:
        # Check if the student's answer was likely correct before proceeding
        # A simple heuristic: check if feedback contains positive words.
        # This is a simple MVP trick; a real system would have better validation.
        is_correct = any(word in ai_feedback.lower() for word in ["correct", "great", "exactly", "perfect", "well done"])

        if is_correct and next_module.get("explanation"):
            # ADD MARKDOWN INSTRUCTION
            next_explanation_system_prompt = """You are an AI tutor. Seamlessly transition to the next topic. 
            Explain the following concept simply and clearly.
            **Use Markdown for formatting, especially for code examples.**"""
            next_explanation_user_prompt = f"Explain this next concept: '{next_module['explanation']}'"
            next_explanation = get_ai_response(next_explanation_system_prompt, next_explanation_user_prompt)
        elif not is_correct:
            # If the answer was wrong, don't move on. Let them try again.
            response_data.update({
                "next_module_id": current_module["id"], # Stay on the same module
                "next_explanation": "Give it another try!",
                "next_question": current_module["question"]
            })
    else: # End of course
        response_data["next_module_id"] = None

    return response_data