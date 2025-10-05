"""
HTML templates for the attendance system
"""

ATTENDANCE_FORM_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Attendance - {subject_name}</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        .container {{ 
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 500px;
            width: 100%;
        }}
        .header {{ text-align: center; margin-bottom: 30px; }}
        .header h1 {{ color: #333; margin-bottom: 10px; font-size: 28px; }}
        .class-info {{ 
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 30px;
            border-left: 4px solid #667eea;
        }}
        .class-info h2 {{ color: #667eea; margin-bottom: 15px; font-size: 20px; }}
        .info-row {{ 
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }}
        .info-label {{ font-weight: 600; color: #555; }}
        .info-value {{ color: #333; }}
        .form-group {{ margin-bottom: 25px; }}
        .form-group label {{ 
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
            font-size: 16px;
        }}
        .form-group input {{ 
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: all 0.3s ease;
        }}
        .form-group input:focus {{ 
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }}
        .submit-btn {{ 
            width: 100%;
            padding: 15px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease;
        }}
        .submit-btn:hover {{ transform: translateY(-2px); }}
        .submit-btn:disabled {{ 
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }}
        .success-message {{ 
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: center;
            font-weight: 600;
        }}
        .error-message {{ 
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            text-align: center;
            font-weight: 600;
        }}
        .footer {{
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
            opacity: 0.7;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Mark Attendance</h1>
        </div>
        
        <div class="class-info">
            <h2>Class Details</h2>
            <div class="info-row">
                <span class="info-label">Subject:</span>
                <span class="info-value">{subject_name}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Class Code:</span>
                <span class="info-value">{class_id}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Date:</span>
                <span class="info-value">{current_date}</span>
            </div>
        </div>

        <form id="attendanceForm">
            <div class="form-group">
                <label for="rollNumber">Enter your Roll Number:</label>
                <input 
                    type="text" 
                    id="rollNumber" 
                    name="rollNumber" 
                    placeholder="e.g., 22CSE1032"
                    required
                    autocomplete="off"
                >
            </div>
            
            <button type="submit" class="submit-btn" id="submitBtn">
                Mark My Attendance
            </button>
        </form>
        
        <div id="message"></div>
        
        <div class="footer">
            Scan successful! Enter your roll number to mark attendance.
        </div>
    </div>

    <script>
        document.getElementById('attendanceForm').addEventListener('submit', async function(e) {{
            e.preventDefault();
            
            const rollNumber = document.getElementById('rollNumber').value.trim();
            const submitBtn = document.getElementById('submitBtn');
            const messageDiv = document.getElementById('message');
            
            if (!rollNumber) {{
                messageDiv.innerHTML = '<div class="error-message">Please enter your roll number</div>';
                return;
            }}
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';
            messageDiv.innerHTML = '';
            
            try {{
                const response = await fetch('/qr/submit-attendance', {{
                    method: 'POST',
                    headers: {{
                        'Content-Type': 'application/json',
                    }},
                    body: JSON.stringify({{
                        token: '{token}',
                        student_id: rollNumber
                    }})
                }});
                
                const result = await response.json();
                
                if (response.ok) {{
                    messageDiv.innerHTML = '<div class="success-message">✅ Attendance marked successfully! You can close this page now.</div>';
                    document.getElementById('rollNumber').value = '';
                    submitBtn.style.display = 'none';
                    document.querySelector('.form-group').style.display = 'none';
                }} else if (response.status === 409) {{
                    messageDiv.innerHTML = '<div class="error-message">⚠️ You have already submitted your attendance for this session.</div>';
                    document.getElementById('rollNumber').value = '';
                    submitBtn.style.display = 'none';
                    document.querySelector('.form-group').style.display = 'none';
                }} else {{
                    messageDiv.innerHTML = `<div class="error-message">❌ ${{result.detail || 'Failed to mark attendance'}}</div>`;
                }}
            }} catch (error) {{
                messageDiv.innerHTML = '<div class="error-message">❌ Network error. Please try again.</div>';
            }} finally {{
                if (submitBtn.style.display !== 'none') {{
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Mark My Attendance';
                }}
            }}
        }});

        // Auto-focus the input field
        document.getElementById('rollNumber').focus();

        // Handle Enter key on input
        document.getElementById('rollNumber').addEventListener('keypress', function(e) {{
            if (e.key === 'Enter') {{
                document.getElementById('attendanceForm').dispatchEvent(new Event('submit'));
            }}
        }});
    </script>
</body>
</html>
"""

TOKEN_EXPIRED_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR Code Expired</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }}
        .container {{ 
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
            text-align: center;
        }}
        .icon {{ font-size: 64px; margin-bottom: 20px; }}
        h1 {{ color: #333; margin-bottom: 15px; font-size: 24px; }}
        p {{ color: #666; line-height: 1.6; margin-bottom: 20px; }}
        .retry-message {{ 
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⚠️</div>
        <h1>QR Code Expired</h1>
        <p>This QR code has expired or been cancelled. Please ask your instructor to generate a new QR code for attendance.</p>
        <div class="retry-message">
            <strong>What to do:</strong><br>
            Contact your instructor to start a new attendance session.
        </div>
    </div>
</body>
</html>
"""
