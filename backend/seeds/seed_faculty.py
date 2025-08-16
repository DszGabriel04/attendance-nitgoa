from datetime import date
from backend import models
from sqlalchemy.exc import IntegrityError

models.Base.metadata.create_all(bind=models.engine)

def print_faculty_table():
    db = models.SessionLocal()
    all_faculty = db.query(models.Faculty).all()
    for f in all_faculty:
        print(f.id, f.first_name, f.email, f.password_hash)
    db.close()

def seed_faculty():
    db = models.SessionLocal()
    faculty_list = [
        models.Faculty(
            id="FAC-101",
            first_name="Alice",
            email="alice.smith@university.edu",
            password_hash="hashed_password_1"
        ),
        models.Faculty(
            id="FAC-102",
            first_name="John",
            email="john.doe@university.edu",
            password_hash="hashed_password_2"
        ),
    ]

    try:
        for faculty in faculty_list:
            if not db.query(models.Faculty).filter_by(email=faculty.email).first():
                db.add(faculty)
        db.commit()

    except IntegrityError as e:
        db.rollback()
        print("Integrity error:", e)
    except Exception as e:
        db.rollback()
        print("Unexpected error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_faculty()
    #print_faculty_table()
