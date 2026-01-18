import requests

API_KEY = "AIzaSyBB88s-lPwdddY24PkKQMlWHwPgzLYfayk" # Your Key

def list_models():
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
    
    try:
        response = requests.get(url)
        data = response.json()
        
        if "models" in data:
            print("✅ AVAILABLE MODELS:")
            for model in data["models"]:
                # We only care about models that support "generateContent"
                if "generateContent" in model["supportedGenerationMethods"]:
                    print(f" - {model['name']}")
        else:
            print("❌ ERROR:", data)
            
    except Exception as e:
        print(f"Connection Failed: {e}")

if __name__ == "__main__":
    list_models()