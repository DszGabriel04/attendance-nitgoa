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
            background: #1a1a1a;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #ECEDEE;
        }}
        .container {{ 
            background: #2d2d2d;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 100%;
        }}
        .header {{ text-align: center; margin-bottom: 25px; }}
        .header h1 {{ 
            color: #ECEDEE; 
            margin-bottom: 8px; 
            font-size: 36px; 
            font-weight: 700;
            letter-spacing: 1px;
        }}
        .header .subtitle {{ 
            font-size: 18px; 
            font-weight: 300; 
            opacity: 0.8;
            color: #B0BEC5;
        }}
        .class-info {{ 
            background: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 25px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }}
        .class-info h2 {{ 
            color: #4FC3F7; 
            margin-bottom: 15px; 
            font-size: 20px; 
            font-weight: 600;
        }}
        .info-row {{ 
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 5px 0;
        }}
        .info-label {{ font-weight: 600; color: #B0BEC5; }}
        .info-value {{ color: #ECEDEE; }}
        .form-group {{ margin-bottom: 20px; }}
        .form-group label {{ 
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #ECEDEE;
            font-size: 16px;
        }}
        .form-group input {{ 
            width: 100%;
            padding: 14px 16px;
            border: 1px solid #555555;
            border-radius: 12px;
            font-size: 16px;
            background: #404040;
            color: #ECEDEE;
            transition: all 0.3s ease;
            min-height: 48px;
        }}
        .form-group input::placeholder {{
            color: #B0BEC5;
        }}
        .form-group input:focus {{ 
            outline: none;
            border-color: #4FC3F7;
            box-shadow: 0 0 0 3px rgba(79, 195, 247, 0.1);
        }}
        .submit-btn {{ 
            width: 100%;
            padding: 14px 20px;
            background: #4FC3F7;
            color: #ffffff;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 600;
            letter-spacing: 0.5px;
            cursor: pointer;
            transition: all 0.2s ease;
            min-height: 48px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }}
        .submit-btn:hover {{ 
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.4);
        }}
        .submit-btn:disabled {{ 
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
            box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }}
        .success-message {{ 
            background: rgba(76, 175, 80, 0.1);
            color: #4CAF50;
            padding: 12px;
            border-radius: 8px;
            margin-top: 16px;
            text-align: center;
            font-weight: 500;
            border: 1px solid rgba(76, 175, 80, 0.3);
        }}
        .error-message {{ 
            background: rgba(244, 67, 54, 0.1);
            color: #F44336;
            padding: 12px;
            border-radius: 8px;
            margin-top: 16px;
            text-align: center;
            font-weight: 500;
            border: 1px solid rgba(244, 67, 54, 0.3);
        }}
        .footer {{
            margin-top: 25px;
            text-align: center;
            font-size: 14px;
            color: #B0BEC5;
            opacity: 0.7;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>NIT Goa</h1>
            <div class="subtitle">Attendance Portal</div>
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
                    messageDiv.innerHTML = '<div class="success-message">Attendance marked successfully! You can close this page now.</div>';
                    document.getElementById('rollNumber').value = '';
                    submitBtn.style.display = 'none';
                    document.querySelector('.form-group').style.display = 'none';
                }} else if (response.status === 409) {{
                    messageDiv.innerHTML = '<div class="error-message">You have already submitted your attendance for this session.</div>';
                    document.getElementById('rollNumber').value = '';
                    submitBtn.style.display = 'none';
                    document.querySelector('.form-group').style.display = 'none';
                }} else if (response.status === 404) {{
                    messageDiv.innerHTML = `<div class="error-message">${{result.detail || 'Roll number not found in this class'}}</div>`;
                    // Allow user to try again with a different roll number
                    document.getElementById('rollNumber').value = '';
                    document.getElementById('rollNumber').focus();
                }} else {{
                    messageDiv.innerHTML = `<div class="error-message">${{result.detail || 'Failed to mark attendance'}}</div>`;
                }}
            }} catch (error) {{
                messageDiv.innerHTML = '<div class="error-message">Network error. Please try again.</div>';
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
            background: #1a1a1a;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            color: #ECEDEE;
        }}
        .container {{ 
            background: #2d2d2d;
            border-radius: 20px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 400px;
            width: 100%;
            text-align: center;
        }}
        .icon {{ 
            font-size: 64px; 
            margin-bottom: 20px; 
            color: #F44336;
        }}
        h1 {{ 
            color: #ECEDEE; 
            margin-bottom: 15px; 
            font-size: 24px; 
            font-weight: 600;
        }}
        p {{ 
            color: #B0BEC5; 
            line-height: 1.6; 
            margin-bottom: 20px; 
            font-size: 16px;
        }}
        .retry-message {{ 
            background: rgba(255, 152, 0, 0.1);
            color: #FF9800;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            border: 1px solid rgba(255, 152, 0, 0.3);
        }}
        .retry-message strong {{
            color: #FF9800;
            font-weight: 600;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">⚠</div>
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
