from fastapi import FastAPI, Depends, HTTPException, Path, Query
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy import func, case
from sqlalchemy.orm import Session
import io
import secrets
import qrcode
from qrcode.constants import ERROR_CORRECT_M
import base64
import models, schemas
from datetime import date

app = FastAPI()


def get_db():                   # Dependency to get DB session
    db = models.SessionLocal()
    try:        yield db
    finally:    db.close()


@app.post("/faculty/login")
def faculty_login(email: str, password: str, db: Session = Depends(get_db)):
    faculty = db.query(models.Faculty).filter(models.Faculty.email == email).first()
    if not faculty:                        raise HTTPException(status_code=404, detail="Invalid email")
    if password != faculty.password_hash:  raise HTTPException(status_code=401, detail="Invalid password")      # plain password for now
    return {"message": "Login successful"}


@app.post("/classes")
def create_class(class_data: schemas.StudentsBatchCreate, db: Session = Depends(get_db)):

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

    # Subquery to count attendance for today per class
    attendance_subquery = (db.query(models.Attendance.class_id, func.count(models.Attendance.id).label("count_today")).filter(models.Attendance.date == today).group_by(models.Attendance.class_id).subquery())

    # Query classes and left join attendance counts
    classes = (db.query(models.Class.id, models.Class.subject_name, case((attendance_subquery.c.count_today > 0, "Yes"), else_="No").label("attendance_taken"))
        .outerjoin(attendance_subquery, models.Class.id == attendance_subquery.c.class_id).all() )
    
    return [ {"id": cls[0], "subject_name": cls[1], "attendance_taken": cls[2]} for cls in classes]     # returns [] if no class found


def make_qr_png_bytes(data: str, box_size: int = 10, border: int = 4, error_correction=ERROR_CORRECT_M) -> bytes:
    qr = qrcode.QRCode(version=None, error_correction=error_correction, box_size=box_size, border=border)
    qr.add_data(data)
    qr.make(fit=True)
    qr_img = qr.make_image(fill_color="black", back_color="white")      # Pillow image
    buffer = io.BytesIO()
    qr_img.save(buffer, format="PNG") # type: ignore
    return buffer.getvalue()        # returns a png image in bytes  


@app.get("/qr/random")
def random_qr(
    length: int = Query(16, ge=1, le=256),
    box_size: int = Query(10, ge=1, le=40),
    border: int = Query(4, ge=0, le=20),
    as_base64: bool = Query(False),
    ):
    payload = secrets.token_hex(length)
    png_bytes = make_qr_png_bytes(data=payload, box_size=box_size, border=border)

    # if base64, return json with payload and base64 data url, else return png image with payload in header
    # so if not base64, access it as <img src="/qr/random" alt="QR">
    if as_base64:
        b64 = base64.b64encode(png_bytes).decode("ascii")
        return JSONResponse({"payload": payload, "data": f"data:image/png;base64,{b64}"})

    return StreamingResponse(io.BytesIO(png_bytes), media_type="image/png", headers={"X-QR-Payload": payload})
