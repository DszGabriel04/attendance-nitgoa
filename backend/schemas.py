from pydantic import BaseModel
from typing import List


class StudentCreate(BaseModel):
    name: str
    id: str                         #does order matter?

class StudentsBatchCreate(BaseModel):
    id: str                       # class ID
    subject_name: str
    faculty_id: str
    students: List[StudentCreate]