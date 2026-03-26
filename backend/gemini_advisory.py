import os
from google import genai
from google.genai import types

def get_agricultural_advisory(
    crop_type: str,
    detected_label: str,
    language: str = "sw",
    severity: float = 0.8
):
    """
    Generates a multi-lingual agricultural advisory using Gemini.
    """
    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    
    system_instruction = """
    You are 'Shamba AI', a senior agronomist specializing in East African smallholder farming.
    Your goal is to provide concise, culturally relevant, and actionable advice.
    Ground your advice in local practices (e.g., using neem oil, crop rotation, panga for pruning).
    Always respond in the farmer's preferred language and provide an English translation.
    Keep responses under 80 words.
    """
    
    user_prompt = f"""
    Crop: {crop_type}
    Issue Detected: {detected_label}
    Severity Score: {severity}/1.0
    Preferred Language: {language} (Swahili, Amharic, Luganda, or English)
    
    Please provide:
    1. Diagnosis
    2. Immediate Action
    3. Urgency Level (Low, Medium, High)
    """

    response = client.models.generate_content(
        model="gemini-1.5-flash",
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.7,
        ),
        contents=user_prompt
    )
    
    return response.text

# Example usage:
# print(get_agricultural_advisory("Maize", "Fall Armyworm", "sw"))
