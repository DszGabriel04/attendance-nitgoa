import os
from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# uvicorn main:app --reload; creates tables
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# Always store DB in backend/ so main.py and seed scripts use the same file
DATABASE_URL = "postgresql+psycopg://neondb_owner:npg_d9sVjNXkqU0A@ep-bitter-field-a1idz898-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

engine = create_engine(DATABASE_URL, pool_pre_ping=True,)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Faculty(Base):
    __tablename__ = "faculty"
    id = Column(String, primary_key=True, index=True)               #"FAC-101"
    first_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)


class Class(Base):
    __tablename__ = "classes"
    id = Column(String, primary_key=True, index=True)               #"CS-402"
    subject_name = Column(String, nullable=False)
    faculty_id = Column(String, ForeignKey("faculty.id"), nullable=False)


class Student(Base):
    __tablename__ = "students"
    id = Column(String, primary_key=True, index=True)               #"22CSE1032"
    name = Column(String, nullable=False)


class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(String, ForeignKey("classes.id"), nullable=False)
    student_id = Column(String, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False)
    present = Column(Boolean, default=False)


Base.metadata.create_all(bind=engine)
