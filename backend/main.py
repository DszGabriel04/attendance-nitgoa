
from fastapi import Body, FastAPI, Depends, HTTPException, Path, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse, RedirectResponse
from sqlalchemy import func, case, select

from sqlalchemy.orm import Session
import io
import secrets
import qrcode
from qrcode.constants import ERROR_CORRECT_M
import base64
import models, schemas
from typing import List
from schemas import AttendanceRequest
from datetime import date
from typing import Dict
import threading

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://attendance-nitgoa.vercel.app",
        "https://attendance-nitgoa-jkm71scqp-russells-projects-bb2412f0.vercel.app",
        "http://localhost:8081",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():                   # Dependency to get DB session
    db = models.SessionLocal()
    try:        yield db
    finally:    db.close()


@app.post("/faculty/login")
def faculty_login(email: str, password: str, db: Session = Depends(get_db)):
    faculty = db.query(models.Faculty).filter(models.Faculty.email == email).first()
    if not faculty:                        raise HTTPException(status_code=404, detail="Invalid email")
    if password != faculty.password_hash:  raise HTTPException(status_code=401, detail="Invalid password")      # plain password for now
    return {"message": "Login successful", "faculty_id": faculty.id} # need this


@app.post("/classes")
def create_class(class_data: schemas.StudentsBatchCreate, db: Session = Depends(get_db)):
    # check if faculty exists
    faculty = db.query(models.Faculty).filter(models.Faculty.id == class_data.faculty_id).first()
    if not faculty:
        raise HTTPException(status_code=404, detail=f"Faculty with id '{class_data.faculty_id}' does not exist")

    #create class info if it doesn't exist
    existing_class = db.query(models.Class).filter(models.Class.id == class_data.id).first()
    if existing_class:      raise HTTPException(status_code=400, detail=f"Class '{class_data.id}' already exists. Please delete the existing class before creating a new one.")
    db.add(models.Class(id=class_data.id, subject_name=class_data.subject_name,faculty_id=class_data.faculty_id))

    #add students names with roll in the students database
    for student in class_data.students:
        existing_student = db.query(models.Student).filter(models.Student.id == student.id).first()
        if not existing_student:    db.add(models.Student(id=student.id, name=student.name))

    # add student's attendance entries
    today = date.today()
    for student in class_data.students:
        existing_attendance = db.query(models.Attendance).filter(models.Attendance.class_id == class_data.id, models.Attendance.student_id == student.id, models.Attendance.date == today).first()
        if not existing_attendance:     db.add(models.Attendance(class_id=class_data.id, student_id=student.id, date=today, present=True))

    db.commit()
    return {"message": f"Class '{class_data.id}' created with {len(class_data.students)} students, all marked present for today"}


@app.delete("/classes/{class_id}")
def delete_class(class_id: str = Path(..., description="ID of the class to delete"), db: Session = Depends(get_db)):

    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:   raise HTTPException(status_code=404, detail=f"Class with id '{class_id}' does not exist")

    db.query(models.Attendance).filter(models.Attendance.class_id == class_id).delete()
    db.delete(class_obj)
    db.commit()

    # delete students not belonging to any class from the students db
    all_students = db.query(models.Student).all()
    for student in all_students:
        has_attendance = db.query(models.Attendance).filter(models.Attendance.student_id == student.id).first()
        if not has_attendance:  db.delete(student)

    db.commit()
    return {"message": f"Class '{class_id}' and its attendance have been deleted. Students no longer in any class were also removed."}


@app.get("/classes")
def get_classes(db: Session = Depends(get_db)):
    today = date.today()

    # Attendance counts per class for today
    attendance_counts = ( select( models.Attendance.class_id, func.count(models.Attendance.id).label("count_today")).where(models.Attendance.date == today).group_by(models.Attendance.class_id).subquery())

    stmt = (select(models.Class.id, models.Class.subject_name, case( (attendance_counts.c.count_today > 0, "Yes"), else_="No").label("attendance_taken"))
        .outerjoin(attendance_counts, models.Class.id == attendance_counts.c.class_id))


    classes = db.execute(stmt).mappings().all()

    return ( [{"id": cls["id"], "subject_name": cls["subject_name"], "attendance_taken": cls["attendance_taken"]} for cls in classes])


@app.post("/classes/{class_id}/attendence")
def save_class_attendence(attendance_data: AttendanceRequest, class_id: str = Path(..., description="ID of the class"), db: Session = Depends(get_db)):
    attendance_date = date.today()

    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:
        raise HTTPException(status_code=404, detail=f"Class '{class_id}' not found")

    created = 0
    errors: List[str] = []

    for item in attendance_data.attendees:
        student = db.query(models.Student).filter(models.Student.id == item.student_id).first()
        if not student:
            errors.append(f"Student '{item.student_id}' not found")
            continue

        # UPDATES ARE NOT ENABLED VIA POST; WILL RETURN ERROR
        existing = db.query(models.Attendance).filter(
            models.Attendance.class_id == class_id,
            models.Attendance.student_id == item.student_id,
            models.Attendance.date == attendance_date
        ).first()

        if existing:
            errors.append(f"Attendance already recorded for student '{item.student_id}'")
            continue

        new_rec = models.Attendance(
            class_id=class_id,
            student_id=item.student_id,
            date=attendance_date,
            present=item.present
        )
        db.add(new_rec)
        created += 1

    db.commit()

    return {
        "message": "Attendance saved",
        "class_id": class_id,
        "date": str(attendance_date),
        "created": created,
        "skipped": errors
    }


@app.put("/classes/{class_id}/attendance")
def update_attendance(attendance_data: AttendanceRequest, class_id: str = Path(..., description="ID of the class"), db: Session = Depends(get_db)):
    existing_rows = db.query(models.Attendance).filter(
        models.Attendance.class_id == class_id,
        models.Attendance.date == date.today()
    ).all()

    if not existing_rows:
        raise HTTPException(status_code=404, detail="No attendance records found for this class and date")

    existing_map = {r.student_id: r for r in existing_rows}

    updated = 0
    errors: List[str] = []

    for item in attendance_data.attendees:
        if item.student_id not in existing_map:
            errors.append(f"Student '{item.student_id}' has no existing record for this date")
            continue

        record = existing_map[item.student_id]
        if record.present != item.present:
            record.present = item.present
            updated += 1

    db.commit()

    return {
        "message": f"Updated {updated} record(s)",
        "errors": errors
    }


@app.get("/attendance/history/{class_id}") #     ----->  [] if course code doesnt exist else json of records
def get_attendance_history(class_id: str, db: Session = Depends(get_db)):
    class_obj = db.query(models.Class).filter(models.Class.id == class_id).first()
    if not class_obj:  return []    #raise HTTPException(status_code=404, detail="Class not found")

    # Fetch attendance records with student details
    attendance_records = (db.query( models.Attendance.date, models.Student.id.label("student_id"), models.Student.name.label("student_name"), models.Student.id, models.Attendance.present)
        .join(models.Student, models.Student.id == models.Attendance.student_id).filter(models.Attendance.class_id == class_obj.id) .order_by(models.Attendance.date.asc(), models.Student.id.asc()).all() )

    history = [ {"date": record.date, "student_id": record.student_id, "student_name": record.student_name, "status": "P" if record.present else "A"} for record in attendance_records]
    return {"class_code": class_id, "attendance_history": history}


_tokens: dict[str, bool] = {}
_tokens_lock = threading.Lock()

# save_token, is_token_active and invalidate_token, helper functions to interact with the token dictionary in a safe way
def save_token(token: str) -> None:
    with _tokens_lock:
        _tokens[token] = True

def is_token_active(token: str) -> bool:
    with _tokens_lock:
        return bool(_tokens.get(token, False))

def invalidate_token(token: str) -> bool:
    with _tokens_lock:
        return _tokens.pop(token, None) is not None


# Once done with the frontend put the URL that opens once you scan the QR code here
REDIRECT_URL = "https://google.com"



# builds the qrcode png image and returns it as bytes
def make_qr_png_bytes(data: str, box_size: int = 10, border: int = 4, error_correction=ERROR_CORRECT_M) -> bytes:
    qr = qrcode.QRCode(version=None, error_correction=error_correction, box_size=box_size, border=border)
    qr.add_data(data)
    qr.make(fit=True)

    qr_img = qr.make_image(fill_color="black", back_color="white")      # Pillow image
    buffer = io.BytesIO()
    qr_img.save(buffer, format="PNG") # type: ignore
    buffer.seek(0)
    return buffer.getvalue()        # returns a png image in bytes  


# 1) generated a qr code encodes /qr/validate?token=RANDOM_TOKEN; 
# 2) tokens generated randomly, stored in valid_tokens dict
# 3) on scanning redirects to above url
# 4) functin returns QR png as bytes + token, save token in frontend to invalidate later
# 5) base64 is one of the two modes of returning we chose; it return Json of token + data (qr code image that can be rendered using image tag)
@app.get("/qr/generate")
def generate_qr(
    request : Request,
    length: int = Query(16, ge=1, le=256),
    box_size: int = Query(10, ge=1, le=40),
    border: int = Query(4, ge=0, le=20),
    as_base64: bool = Query(True),
):
    token = secrets.token_hex(length)
    save_token(token)

    # build absolute validation URL based on incoming request
    validation_url = str(request.url_for("validate_qr")) + f"?token={token}"
    # we build the QR code to automatically call the validate endpoint
    png_bytes = make_qr_png_bytes(data=validation_url, box_size=box_size, border=border)

    if as_base64:
        b64 = base64.b64encode(png_bytes).decode("ascii")
        return JSONResponse({"token": token, "data": f"data:image/png;base64,{b64}", "validation_url": validation_url})
    
    return StreamingResponse(io.BytesIO(png_bytes), media_type="image/png", headers={"X-QR-Token": token, "X-Validation-URL": validation_url})



# 1) to VERIFY that token specified as a query parameter is valid (dictionary lookup), if so, redirect to desired URL(REDIRECT_URL) else raise error
@app.get("/qr/validate", name="validate_qr")
def validate_qr(token: str = Query(...)):
    if is_token_active(token):
        return RedirectResponse(url=REDIRECT_URL, status_code=302)
    raise HTTPException(status_code=410, detail="Token invalid or cancelled")

# when the CANCEL button is clicked; it invalidates the current token associated with QR, specifies that token saved earlier in dict, commits to database (needs to be implemented, ideally extend this function)
@app.post("/qr/cancel")
def cancel_qr(payload: dict = Body(...)):
    token = payload.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="token required")
    if invalidate_token(token):
        return {"token": token, "cancelled": True}
    raise HTTPException(status_code=404, detail="Token not found")

