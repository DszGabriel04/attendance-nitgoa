from fastapi import FastAPI, Depends, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, case, select
from sqlalchemy.orm import Session
import models, schemas
from typing import List
from schemas import AttendanceRequest
from datetime import date

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["attendance-nitgoa.vercel.app", "attendance-nitgoa-jkm71scqp-russells-projects-bb2412f0.vercel.app"],  # In production, replace with specific origins
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
    return {"message": "Login successful"}


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
