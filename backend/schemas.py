from models import Attendance
from pydantic import BaseModel
from typing import List
from datetime import date

class StudentCreate(BaseModel):
    name: str
    id: str                         #does order matter?


class StudentsBatchCreate(BaseModel):
    id: str                       # class ID
    subject_name: str
    faculty_id: str
    students: List[StudentCreate]


# attendence related classes
class AttendanceItem(BaseModel):
    student_id: str
    present: bool


class AttendanceRequest(BaseModel):
    attendees: List[AttendanceItem]
