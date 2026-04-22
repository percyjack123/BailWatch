from dotenv import load_dotenv
load_dotenv()

import os
from google import genai

print("=== GEMINI DEBUG TEST ===")

api_key = os.getenv("GEMINI_API_KEY")
print("API Key found:", bool(api_key))
print("API Key preview:", api_key[:12] + "..." if api_key else "NONE - CHECK YOUR .env FILE")

if not api_key:
    print("\nFIX: Create a .env file in this folder with:")
    print("GEMINI_API_KEY=your_actual_key_here")
    exit(1)

print("\nCreating Gemini client...")
client = genai.Client(api_key=api_key)
print("Client created OK")

print("\nCalling Gemini...")
response = client.models.generate_content(
    model="gemini-2.0-flash",
    contents="Say hello in one sentence."
)

print("Response received")
print("Candidates count:", len(response.candidates))
print("Finish reason:", response.candidates[0].finish_reason)
print("Parts count:", len(response.candidates[0].content.parts))
print("Text:", response.candidates[0].content.parts[0].text)
print("\n=== SUCCESS ===")