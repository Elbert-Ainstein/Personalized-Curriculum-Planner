import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI  # <-- Import the OpenAI library
from typing import Optional, List
from curriculum import COURSE_CONTENT as PYTHON_COURSE, ALGEBRA1_COURSE_CONTENT

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

# Example: Add more courses here
COURSES = {
    "python-basics": PYTHON_COURSE,
    "algebra-1": ALGEBRA1_COURSE_CONTENT,
    # "js-basics": JS_COURSE_CONTENT, # Add more as needed
}

@app.get("/courses")
def list_courses():
    return [{"id": cid, "title": c["title"]} for cid, c in COURSES.items()]

@app.get("/start_lesson_multi")
def start_lesson_multi(course_id: str = Query(...)):
    course = COURSES.get(course_id)
    if not course:
        return {"error": "Invalid course ID."}
    first_module = course["modules"][0]
    system_prompt = """You are a friendly and encouraging AI programming tutor. Your goal is to explain concepts to a brand new student. \nUse simple, welcoming language. \n**Format your output using Markdown.** Use backticks for `code` and code blocks for examples."""
    user_prompt = f"Please start the lesson by explaining this concept: '{first_module['explanation']}'"
    ai_explanation = get_ai_response(system_prompt, user_prompt)
    return {
        "module_id": first_module["id"],
        "message": ai_explanation,
        "expects_code": bool(first_module.get("question")),
        "course_id": course_id,
        "question": first_module.get("question"),
    }

@app.post("/submit_answer_multi")
def submit_answer_multi(
    student_answer: StudentAnswer,
    course_id: str = Query(...)
):
    course = COURSES.get(course_id)
    if not course:
        return {"error": "Invalid course ID."}
    module_id = student_answer.module_id
    user_code = student_answer.answer
    current_module = next((m for m in course["modules"] if m["id"] == module_id), None)
    if not current_module:
        return {"error": "Invalid module ID."}
    # Feedback prompt: more guiding and hinting for non-code courses
    if course_id == "python-basics":
        feedback_system_prompt = """You are a helpful and patient AI programming tutor. Your role is to analyze a student's code and provide constructive feedback.\n- If the code is correct, praise them enthusiastically.\n- If the code is incorrect, gently point out the mistake without giving the direct answer.\n- **Format your entire response using Markdown.** Use backticks for `code` and bold for emphasis.\n- Keep your feedback concise (2-4 sentences)."""
        feedback_user_prompt = f"""The student was asked this question: '{current_module['question']}'\n\nThey submitted the following code:\n`{user_code}`\n\nThe key components of a correct answer are: {current_module['answer_keywords']}. Please provide feedback based on their submission."""
    else:
        feedback_system_prompt = """You are a helpful and patient AI math tutor. Your role is to analyze a student's answer and provide constructive, guiding feedback.\n- If the answer is correct, praise them and briefly explain why.\n- If the answer is incorrect, do NOT give the answer, but ask a guiding question or give a hint to help them think.\n- Always restate the assignment/question clearly.\n- **Format your response using Markdown.**\n- Keep your feedback concise (2-4 sentences)."""
        feedback_user_prompt = f"""The student was asked this question: '{current_module['question']}'\n\nThey submitted the following answer:\n`{user_code}`\n\nThe key components of a correct answer are: {current_module['answer_keywords']}. Please provide feedback based on their submission."""
    ai_feedback = get_ai_response(feedback_system_prompt, feedback_user_prompt)
    next_module_id = module_id + 1
    next_module = next((m for m in course["modules"] if m["id"] == next_module_id), None)
    response_data = {"feedback": ai_feedback}
    if next_module:
        is_correct = any(word in ai_feedback.lower() for word in ["correct", "great", "exactly", "perfect", "well done"])
        if is_correct and next_module.get("explanation"):
            next_explanation_system_prompt = """You are an AI tutor. Seamlessly transition to the next topic. \nExplain the following concept simply and clearly.\n**Use Markdown for formatting, especially for code examples.**"""
            next_explanation_user_prompt = f"Explain this next concept: '{next_module['explanation']}'"
            next_explanation = get_ai_response(next_explanation_system_prompt, next_explanation_user_prompt)
            response_data.update({
                "next_module_id": next_module["id"],
                "next_explanation": next_explanation,
                "next_question": next_module.get("question"),
                "expects_code": bool(next_module.get("question")),
            })
        elif not is_correct:
            response_data.update({
                "next_module_id": current_module["id"],
                "next_explanation": "Give it another try!",
                "next_question": current_module["question"],
                "expects_code": bool(current_module.get("question")),
            })
    else:
        response_data["next_module_id"] = None
        response_data["expects_code"] = False
    # Always include the assignment/question for clarity
    response_data["question"] = next_module.get("question") if next_module else None
    return response_data