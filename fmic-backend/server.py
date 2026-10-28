from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)  # Allows your Vercel web app to talk to your local laptop server

@app.route('/api/process-testimony', methods=['POST'])
def process_testimony():
    data = request.json
    member_name = data.get('memberName', 'Testimony')
    service_date = data.get('serviceDate', '2026-10-27')
    case_desc = data.get('caseDescription', '')
    
    print(f"📥 Received Request from Vercel Web App:")
    print(f"   - Member: {member_name}")
    print(f"   - Date: {service_date}")
    print(f"   - Case: {case_desc}")
    
    # Standardized Naming Rule
    clean_name = "".join(c if c.isalnum() else "_" for c in member_name)
    output_filename = f"{clean_name}_{service_date}_clip.mp4"
    
    # Placeholder for FFmpeg execution on local recorded files or archives
    # subprocess.run(["ffmpeg", ...])
    
    return jsonify({
        "status": "success",
        "message": f"Successfully processed clip for {member_name}",
        "filename": output_filename
    })

if __name__ == '__main__':
    print("🚀 FMIC Local Backend Bridge Running on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000)
