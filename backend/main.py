from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import models

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
