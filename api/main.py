from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

from api.database import engine
from sqlalchemy import text
from api.shap import explain_student
from api.career_engine import generate_career_intelligence

import joblib
import pandas as pd
import io
import re
from pathlib import Path


app = FastAPI(
    title="CareerLens API",
    description="AI Career Intelligence and Placement Analytics Platform",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Password Security
# -----------------------------

import hashlib
import secrets
import base64
from datetime import datetime, timedelta, timezone


def hash_password(password: str) -> str:
    """
    Secure password hashing using Python's built-in scrypt.
    Format:
        scrypt$N$r$p$salt$derived_key
    """
    salt = secrets.token_bytes(16)

    n = 2**14
    r = 8
    p = 1

    derived_key = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=n,
        r=r,
        p=p,
        dklen=64
    )

    return (
        f"scrypt${n}${r}${p}$"
        f"{base64.urlsafe_b64encode(salt).decode()}$"
        f"{base64.urlsafe_b64encode(derived_key).decode()}"
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        scheme, n, r, p, salt_b64, key_b64 = stored_hash.split("$")

        if scheme != "scrypt":
            return False

        salt = base64.urlsafe_b64decode(salt_b64.encode())
        expected_key = base64.urlsafe_b64decode(key_b64.encode())

        actual_key = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(n),
            r=int(r),
            p=int(p),
            dklen=len(expected_key)
        )

        return secrets.compare_digest(actual_key, expected_key)

    except (ValueError, TypeError):
        return False


# -----------------------------
# Load ML Model
# -----------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = BASE_DIR / "models" / "placement_xgb_tuned_pipeline.pkl"

placement_model = joblib.load(MODEL_PATH)


# ===== COMPLETE PROFILE INTELLIGENCE =====
PROFILE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS student_profiles (
 profile_id INT AUTO_INCREMENT PRIMARY KEY,
 student_id INT NOT NULL UNIQUE,
 full_name VARCHAR(150), phone VARCHAR(30), state VARCHAR(100), college VARCHAR(200),
 graduation_year INT, semester INT,
 python_score FLOAT DEFAULT 0, sql_score FLOAT DEFAULT 0, excel_score FLOAT DEFAULT 0, powerbi_score FLOAT DEFAULT 0,
 statistics_score FLOAT DEFAULT 0, ml_score FLOAT DEFAULT 0, java_score FLOAT DEFAULT 0, web_dev_score FLOAT DEFAULT 0,
 data_visualization_score FLOAT DEFAULT 0, coding_score FLOAT DEFAULT 0, communication_score FLOAT DEFAULT 0,
 aptitude_score FLOAT DEFAULT 0, logical_reasoning_score FLOAT DEFAULT 0, presentation_score FLOAT DEFAULT 0,
 teamwork_score FLOAT DEFAULT 0, leadership_score FLOAT DEFAULT 0, internship_count INT DEFAULT 0,
 internship_months INT DEFAULT 0, work_experience_months INT DEFAULT 0, industry_projects INT DEFAULT 0,
 personal_projects INT DEFAULT 0, certification_count INT DEFAULT 0, project_quality_score FLOAT DEFAULT 0,
 github_commits INT DEFAULT 0, github_engagement_index FLOAT DEFAULT 0, coding_questions_solved INT DEFAULT 0,
 preferred_role VARCHAR(100), preferred_domain VARCHAR(100), preferred_location VARCHAR(100),
 remote_preference VARCHAR(50), higher_studies_interest VARCHAR(50), academic_index FLOAT DEFAULT 0,
 skill_index FLOAT DEFAULT 0, experience_index FLOAT DEFAULT 0, communication_index FLOAT DEFAULT 0,
 employability_index FLOAT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
 CONSTRAINT fk_student_profiles_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE
)
"""
TECHNICAL_FIELDS=["python_score","sql_score","excel_score","powerbi_score","statistics_score","ml_score","java_score","web_dev_score","data_visualization_score","coding_score"]
SOFT_FIELDS=["communication_score","aptitude_score","logical_reasoning_score","presentation_score","teamwork_score","leadership_score"]
EXPERIENCE_FIELDS=["internship_count","internship_months","work_experience_months","industry_projects","personal_projects","certification_count","project_quality_score","github_commits","github_engagement_index","coding_questions_solved"]

def ensure_profile_table():
    # CREATE TABLE IF NOT EXISTS does not update an already-existing table.
    # Older CareerLens databases therefore may be missing the newer intelligence
    # columns. Add them safely so registration works with both old and new DBs.
    migration_columns = {
        "technical_skill_index": "FLOAT DEFAULT 0",
        "project_count": "INT DEFAULT 0",
        "statistics_gap": "FLOAT DEFAULT 0",
        "dsa_gap": "FLOAT DEFAULT 0",
    }

    with engine.begin() as connection:
        connection.execute(text(PROFILE_TABLE_SQL))

        existing = {
            row[0]
            for row in connection.execute(
                text("""
                    SELECT COLUMN_NAME
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = 'student_profiles'
                """)
            ).all()
        }

        for column, definition in migration_columns.items():
            if column not in existing:
                connection.execute(
                    text(
                        f"ALTER TABLE student_profiles "
                        f"ADD COLUMN {column} {definition}"
                    )
                )

def _num(data,key,default=0.0):
 try: return float(data.get(key,default) or default)
 except (TypeError,ValueError): return float(default)

def calculate_profile_indexes(data):
 academic=_num(data,"tenth_percentage")*.25+_num(data,"twelfth_percentage")*.25+_num(data,"cgpa")*10*.35+_num(data,"attendance_percentage")*.15
 technical=sum(_num(data,f) for f in TECHNICAL_FIELDS)/len(TECHNICAL_FIELDS)
 communication=sum(_num(data,f) for f in SOFT_FIELDS)/len(SOFT_FIELDS)
 exp=[min(_num(data,"internship_count")*25,100),min(_num(data,"internship_months")/6*100,100),min(_num(data,"work_experience_months")/24*100,100),min((_num(data,"industry_projects")+_num(data,"personal_projects"))/5*100,100),min(_num(data,"certification_count")/8*100,100),_num(data,"project_quality_score"),min(_num(data,"github_commits"),100),_num(data,"github_engagement_index"),min(_num(data,"coding_questions_solved")/200*100,100)]
 experience=sum(exp)/len(exp)
 employability=academic*.30+technical*.35+experience*.20+communication*.15
 return {"academic_index":round(academic,2),"skill_index":round(technical,2),"technical_skill_index":round(technical,2),"experience_index":round(experience,2),"communication_index":round(communication,2),"employability_index":round(employability,2),"project_count":int(_num(data,"industry_projects")+_num(data,"personal_projects")),"statistics_gap":round(max(0,75-_num(data,"statistics_score")),2),"dsa_gap":round(max(0,75-_num(data,"coding_score")),2)}

def get_complete_student_data(student_id, connection=None):
 own=connection is None
 if own: connection=engine.connect()
 try:
  student=connection.execute(text("SELECT * FROM students WHERE student_id=:student_id"),{"student_id":student_id}).mappings().first()
  if not student: return None
  profile=connection.execute(text("SELECT * FROM student_profiles WHERE student_id=:student_id"),{"student_id":student_id}).mappings().first()
  account=connection.execute(text("SELECT email FROM student_accounts WHERE student_id=:student_id LIMIT 1"),{"student_id":student_id}).mappings().first()
  skills=connection.execute(text("SELECT * FROM student_skills WHERE student_id=:student_id ORDER BY skill_id DESC LIMIT 1"),{"student_id":student_id}).mappings().first()
  data=dict(student)
  if profile: data.update(dict(profile))
  if account: data["email"]=account["email"]
  if skills: data.update(dict(skills))
  data.update(calculate_profile_indexes(data))
  return data
 finally:
  if own: connection.close()


# -----------------------------
# Home
# -----------------------------

@app.get("/")
def home():
    return {
        "message": "CareerLens API is running!",
        "status": "success"
    }


# -----------------------------
# Database Health
# -----------------------------

@app.get("/health")
def health_check():

    try:
        with engine.connect():

            return {
                "status": "healthy",
                "database": "connected"
            }

    except Exception as e:

        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }


# -----------------------------
# Placement Prediction
# -----------------------------

@app.post("/predict-placement")
def predict_placement(student_data: dict):

    try:

        # Convert JSON to DataFrame
        student_df = pd.DataFrame([student_data])

        # Columns that were not used for prediction
        excluded_columns = [
            "student_id",
            "placed",
            "placement_role",
            "package_lpa",
            "preferred_role",
            "preferred_domain",
            "preferred_location",
            "remote_preference",
            "higher_studies_interest"
        ]

        student_df = student_df.drop(
            columns=[
                col for col in excluded_columns
                if col in student_df.columns
            ],
            errors="ignore"
        )

        # Check required features
        required_features = list(
            placement_model.feature_names_in_
        )

        missing_features = [
            col for col in required_features
            if col not in student_df.columns
        ]

        if missing_features:

            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Missing required features",
                    "missing_features": missing_features
                }
            )

        # Keep exactly the training feature order
        student_df = student_df[required_features]

        # Prediction
        prediction = placement_model.predict(student_df)[0]

        probability = placement_model.predict_proba(
            student_df
        )[0][1]

        return {
            "placement_prediction": int(prediction),
            "placement_probability": round(
                float(probability) * 100,
                2
            ),
            "message": "Placement prediction generated successfully"
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# -----------------------------
# Salary Prediction Model
# -----------------------------

SALARY_MODEL_PATH = BASE_DIR / "models" / "salary_prediction_pipeline.pkl"

salary_model = joblib.load(SALARY_MODEL_PATH)


# -----------------------------
# Salary Prediction API
# -----------------------------

@app.post("/predict-salary")
def predict_salary(student_data: dict):

    try:
        # Build the prediction input from the payload first.
        # The frontend sends the student profile + latest skills.
        student_df = pd.DataFrame([student_data])

        excluded_columns = [
            "student_id",
            "placed",
            "placement_role",
            "package_lpa",
            "preferred_role",
            "preferred_domain",
            "preferred_location",
            "remote_preference",
            "higher_studies_interest"
        ]

        student_df = student_df.drop(
            columns=excluded_columns,
            errors="ignore"
        )

        required_features = list(salary_model.feature_names_in_)

        missing_features = [
            col for col in required_features
            if col not in student_df.columns
        ]

        # If the salary model was trained with features that are not
        # stored in the current MySQL profile, use the package estimate
        # already persisted in the predictions table. This keeps the
        # dashboard functional without inventing missing feature values.
        if missing_features:
            student_id = student_data.get("student_id")

            if student_id is not None:
                with engine.connect() as connection:
                    query = text("""
                        SELECT predicted_package
                        FROM predictions
                        WHERE student_id = :student_id
                        ORDER BY prediction_id DESC
                        LIMIT 1
                    """)

                    saved_prediction = connection.execute(
                        query,
                        {"student_id": student_id}
                    ).mappings().first()

                if saved_prediction and saved_prediction["predicted_package"] is not None:
                    package = float(saved_prediction["predicted_package"])

                    return {
                        "predicted_package_lpa": round(package, 2),
                        "currency": "INR",
                        "prediction_source": "stored_placement_estimate",
                        "model_status": "salary_model_input_incomplete",
                        "missing_features": missing_features,
                        "message": "Package estimate loaded from the latest saved CareerLens prediction"
                    }

            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Salary model input is incomplete and no saved package estimate is available",
                    "missing_features": missing_features
                }
            )

        # Maintain the exact feature order used during salary-model training.
        student_df = student_df[required_features]

        predicted_salary = salary_model.predict(student_df)[0]

        return {
            "predicted_package_lpa": round(float(predicted_salary), 2),
            "currency": "INR",
            "prediction_source": "salary_model",
            "model_status": "success",
            "message": "Salary prediction generated successfully"
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# -----------------------------
# Career Role Requirements
# -----------------------------

role_requirements = {
    "Data Analyst": {
        "python_score": 0.15,
        "sql_score": 0.25,
        "excel_score": 0.20,
        "powerbi_score": 0.20,
        "statistics_score": 0.10,
        "data_visualization_score": 0.10
    },

    "Data Scientist": {
        "python_score": 0.25,
        "sql_score": 0.10,
        "statistics_score": 0.20,
        "ml_score": 0.25,
        "coding_score": 0.10,
        "data_visualization_score": 0.10
    },

    "Business Analyst": {
        "sql_score": 0.15,
        "excel_score": 0.25,
        "powerbi_score": 0.15,
        "statistics_score": 0.10,
        "communication_score": 0.20,
        "presentation_score": 0.15
    },

    "BI Analyst": {
        "sql_score": 0.25,
        "excel_score": 0.20,
        "powerbi_score": 0.25,
        "data_visualization_score": 0.15,
        "statistics_score": 0.10,
        "communication_score": 0.05
    },

    "Software Developer": {
        "python_score": 0.15,
        "java_score": 0.25,
        "coding_score": 0.30,
        "web_dev_score": 0.15,
        "logical_reasoning_score": 0.15
    },

    "ML Engineer": {
        "python_score": 0.25,
        "ml_score": 0.30,
        "coding_score": 0.20,
        "statistics_score": 0.10,
        "sql_score": 0.10,
        "logical_reasoning_score": 0.05
    }
}


# -----------------------------
# Career Recommendation API
# -----------------------------

@app.post("/career-recommendation")
def career_recommendation(student_data: dict):

    try:

        recommendations = []

        for role, requirements in role_requirements.items():

            match_score = 0

            for skill, weight in requirements.items():

                student_score = float(
                    student_data.get(skill, 0)
                )

                match_score += (
                    student_score / 100
                ) * weight

            recommendations.append({
                "role": role,
                "match_score": round(
                    match_score * 100,
                    2
                )
            })

        recommendations.sort(
            key=lambda x: x["match_score"],
            reverse=True
        )

        top_role = recommendations[0]

        # Calculate skill gaps
        skill_gaps = []

        for skill, weight in role_requirements[
            top_role["role"]
        ].items():

            score = float(
                student_data.get(skill, 0)
            )

            gap = max(0, 100 - score)

            if score >= 75:
                status = "Strong"
            elif score >= 50:
                status = "Needs Improvement"
            else:
                status = "Skill Gap"

            skill_gaps.append({
                "skill": skill,
                "score": round(score, 2),
                "gap": round(gap, 2),
                "status": status,
                "importance": weight
            })

        skill_gaps.sort(
            key=lambda x: x["gap"] * x["importance"],
            reverse=True
        )

        return {
            "recommended_role": top_role["role"],
            "match_score": top_role["match_score"],
            "top_roles": recommendations[:3],
            "skill_gaps": skill_gaps,
            "message": "Career recommendation generated successfully"
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# -----------------------------
# Job Market Skill Demand
# -----------------------------

MARKET_DEMAND_PATH = (
    BASE_DIR / "reports" / "market_skill_demand.csv"
)

market_demand = pd.read_csv(MARKET_DEMAND_PATH)


# -----------------------------
# Skill Mapping
# -----------------------------

skill_columns = {
    "Python": "python_score",
    "SQL": "sql_score",
    "Excel": "excel_score",
    "Power BI": "powerbi_score",
    "Statistics": "statistics_score",
    "Machine Learning": "ml_score",
    "Data Visualization": "data_visualization_score",
    "Java": "java_score",
    "Communication": "communication_score",
    "Presentation": "presentation_score",
    "Programming": "coding_score",
    "Problem Solving": "logical_reasoning_score"
}


# -----------------------------
# Job Market Intelligence API
# -----------------------------

@app.post("/job-market-analysis")
def job_market_analysis(student_data: dict):

    try:

        results = []

        for skill, column in skill_columns.items():

            student_score = float(
                student_data.get(column, 0)
            )

            market_row = market_demand[
                market_demand["Skill"] == skill
            ]

            if not market_row.empty:
                demand = float(
                    market_row.iloc[0]["Demand_Percentage"]
                )
            else:
                demand = 0

            gap = max(0, 100 - student_score)

            priority = gap * (demand / 100)

            if student_score >= 75:
                status = "Strong"
            elif student_score >= 50:
                status = "Needs Improvement"
            else:
                status = "Skill Gap"

            results.append({
                "skill": skill,
                "student_score": round(student_score, 2),
                "market_demand": round(demand, 2),
                "skill_gap": round(gap, 2),
                "priority": round(priority, 2),
                "status": status
            })

        results.sort(
            key=lambda x: x["priority"],
            reverse=True
        )

        return {
            "top_market_skills": sorted(
                results,
                key=lambda x: x["market_demand"],
                reverse=True
            )[:5],
            "top_skill_gaps": results[:5],
            "message": "Job market analysis generated successfully"
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# -----------------------------
# Learning Resource Mapping
# -----------------------------

learning_resources = {
    "Python": "Advanced Python",
    "SQL": "Advanced SQL",
    "Excel": "Advanced Excel",
    "Power BI": "Power BI & DAX",
    "Statistics": "Statistics for Data Analytics",
    "Machine Learning": "Machine Learning",
    "Data Visualization": "Data Visualization",
    "Java": "Advanced Java",
    "Communication": "Business Communication",
    "Presentation": "Presentation & Storytelling",
    "Programming": "Data Structures & Algorithms",
    "Problem Solving": "Logical Reasoning & Problem Solving"
}


# -----------------------------
# Personalized Learning Roadmap
# -----------------------------

@app.post("/learning-roadmap")
def learning_roadmap(student_data: dict):

    try:

        roadmap = []

        for skill, column in skill_columns.items():

            student_score = float(
                student_data.get(column, 0)
            )

            # Market demand
            market_row = market_demand[
                market_demand["Skill"] == skill
            ]

            if not market_row.empty:
                demand = float(
                    market_row.iloc[0]["Demand_Percentage"]
                )
            else:
                demand = 0

            # Calculate gap
            gap = max(0, 100 - student_score)

            # Priority combines weakness + market demand
            priority = gap * (demand / 100)

            # Ignore skills that are already strong
            if student_score < 75:

                if student_score >= 50:
                    status = "Needs Improvement"
                else:
                    status = "Skill Gap"

                roadmap.append({
                    "skill": skill,
                    "current_score": round(
                        student_score, 2
                    ),
                    "market_demand": round(
                        demand, 2
                    ),
                    "skill_gap": round(
                        gap, 2
                    ),
                    "priority": round(
                        priority, 2
                    ),
                    "status": status,
                    "recommended_learning":
                        learning_resources.get(
                            skill,
                            skill
                        )
                })

        # Highest priority first
        roadmap.sort(
            key=lambda x: x["priority"],
            reverse=True
        )

        return {
            "learning_roadmap": roadmap,
            "total_skills_to_improve": len(roadmap),
            "message": "Personalized learning roadmap generated successfully"
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# -----------------------------
# Student Registration
# -----------------------------

@app.post("/auth/register")
def register_student(student_data: dict):
 try:
  ensure_profile_table()
  required=["email","password","age","gender","city","branch","tenth_percentage","twelfth_percentage","cgpa","backlogs","attendance_percentage"]
  missing=[f for f in required if f not in student_data]
  if missing: raise HTTPException(status_code=400,detail={"message":"Missing required fields","missing_fields":missing})
  email=str(student_data["email"]).strip().lower(); password=str(student_data["password"])
  if "@" not in email or "." not in email.split("@")[-1]: raise HTTPException(status_code=400,detail="Please provide a valid email address.")
  if len(password)<8: raise HTTPException(status_code=400,detail="Password must contain at least 8 characters.")
  with engine.begin() as connection:
   existing=connection.execute(text("SELECT account_id FROM student_accounts WHERE email=:email LIMIT 1"),{"email":email}).mappings().first()
   if existing: raise HTTPException(status_code=409,detail="An account with this email already exists.")
   student_id=int(connection.execute(text("SELECT COALESCE(MAX(student_id),10000) FROM students")).scalar_one())+1
   connection.execute(text("""INSERT INTO students (student_id,age,gender,city,branch,tenth_percentage,twelfth_percentage,cgpa,backlogs,attendance_percentage) VALUES (:student_id,:age,:gender,:city,:branch,:tenth_percentage,:twelfth_percentage,:cgpa,:backlogs,:attendance_percentage)"""),{"student_id":student_id,"age":int(_num(student_data,"age")),"gender":student_data["gender"],"city":student_data["city"],"branch":student_data["branch"],"tenth_percentage":_num(student_data,"tenth_percentage"),"twelfth_percentage":_num(student_data,"twelfth_percentage"),"cgpa":_num(student_data,"cgpa"),"backlogs":int(_num(student_data,"backlogs")),"attendance_percentage":_num(student_data,"attendance_percentage")})
   connection.execute(text("INSERT INTO student_accounts (student_id,email,password_hash) VALUES (:student_id,:email,:password_hash)"),{"student_id":student_id,"email":email,"password_hash":hash_password(password)})
   merged=dict(student_data); merged["student_id"]=student_id; indexes=calculate_profile_indexes(merged)
   profile_fields=["full_name","phone","state","college","graduation_year","semester",*TECHNICAL_FIELDS,*SOFT_FIELDS,*EXPERIENCE_FIELDS,"preferred_role","preferred_domain","preferred_location","remote_preference","higher_studies_interest"]
   profile={k:merged.get(k) for k in profile_fields if merged.get(k) is not None}; profile.update(indexes)
   cols=["student_id"]+list(profile.keys()); params={"student_id":student_id,**profile}
   connection.execute(text(f"INSERT INTO student_profiles ({','.join(cols)}) VALUES ({','.join(':'+c for c in cols)})"),params)
   connection.execute(text("""INSERT INTO student_skills (student_id,python_score,sql_score,excel_score,powerbi_score,statistics_score,ml_score,coding_score,communication_score) VALUES (:student_id,:python_score,:sql_score,:excel_score,:powerbi_score,:statistics_score,:ml_score,:coding_score,:communication_score)"""),{"student_id":student_id,**{f:_num(merged,f) for f in ["python_score","sql_score","excel_score","powerbi_score","statistics_score","ml_score","coding_score","communication_score"]}})
  intelligence_status="pending"
  try:
   complete=get_complete_student_data(student_id)
   placement=predict_placement(complete)
   package=0
   try: package=predict_salary(complete).get("predicted_package_lpa",0)
   except Exception as e: print(f"Salary warning for #{student_id}: {e}")
   career=generate_career_intelligence(complete)
   with engine.begin() as connection:
    connection.execute(text("INSERT INTO predictions (student_id,placement_probability,predicted_package) VALUES (:student_id,:placement_probability,:predicted_package)"),{"student_id":student_id,"placement_probability":placement["placement_probability"],"predicted_package":package})
    connection.execute(text("INSERT INTO career_recommendations (student_id,recommended_role,match_score) VALUES (:student_id,:recommended_role,:match_score)"),{"student_id":student_id,"recommended_role":career["recommended_role"],"match_score":career["match_score"]})
   intelligence_status="generated"
  except Exception as e: print(f"Intelligence warning for #{student_id}: {e}")
  return {"status":"success","message":"Complete CareerLens profile created successfully","student_id":student_id,"email":email,"intelligence_status":intelligence_status}
 except HTTPException: raise
 except Exception as e: raise HTTPException(status_code=500,detail=str(e))


# -----------------------------
# Student Login
# -----------------------------

@app.post("/auth/login")
def login_student(login_data: dict):

    try:
        email = str(login_data.get("email", "")).strip().lower()
        password = str(login_data.get("password", ""))

        if not email or not password:
            raise HTTPException(
                status_code=400,
                detail="Email and password are required."
            )

        with engine.begin() as connection:

            account = connection.execute(
                text("""
                    SELECT
                        account_id,
                        student_id,
                        email,
                        password_hash,
                        is_active
                    FROM student_accounts
                    WHERE email = :email
                    LIMIT 1
                """),
                {"email": email}
            ).mappings().first()

            # Use the same response for unknown email and wrong password.
            # This avoids revealing whether an email is registered.
            if not account or not account["is_active"]:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password."
                )

            if not verify_password(
                password,
                account["password_hash"]
            ):
                raise HTTPException(
                    status_code=401,
                    detail="Invalid email or password."
                )

            # Create an opaque session token. Only its SHA-256 hash is stored.
            raw_token = secrets.token_urlsafe(48)
            token_hash = hashlib.sha256(
                raw_token.encode("utf-8")
            ).hexdigest()

            expires_at = datetime.now(timezone.utc) + timedelta(hours=8)

            connection.execute(
                text("""
                    INSERT INTO student_sessions (
                        account_id,
                        token_hash,
                        expires_at
                    )
                    VALUES (
                        :account_id,
                        :token_hash,
                        :expires_at
                    )
                """),
                {
                    "account_id": account["account_id"],
                    "token_hash": token_hash,
                    "expires_at": expires_at
                }
            )

        return {
            "status": "success",
            "message": "Login successful",
            "student_id": account["student_id"],
            "email": account["email"],
            "access_token": raw_token,
            "token_type": "Bearer",
            "expires_in": 28800
        }

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )



# -----------------------------
# Edit / Update Student Profile
# -----------------------------

@app.put("/students/{student_id}/profile")
def update_student_profile(student_id: int, student_data: dict):
    """Update the authenticated student's complete career profile.

    The existing dashboard is preserved. After an update, derived indexes,
    placement prediction, career recommendation and stored skill gaps are
    rebuilt from the new profile so all downstream intelligence stays aligned.
    """
    try:
        ensure_profile_table()

        required_identity = ["full_name", "email", "age", "gender", "city", "branch"]
        missing = [field for field in required_identity if field not in student_data]
        if missing:
            raise HTTPException(
                status_code=400,
                detail={"message": "Missing required profile fields", "missing_fields": missing}
            )

        email = str(student_data.get("email", "")).strip().lower()
        if "@" not in email or "." not in email.split("@")[-1]:
            raise HTTPException(status_code=400, detail="Please provide a valid email address.")

        # Fixed allow-list prevents arbitrary SQL column names from the client.
        profile_fields = [
            "full_name", "phone", "state", "college", "graduation_year", "semester",
            *TECHNICAL_FIELDS, *SOFT_FIELDS, *EXPERIENCE_FIELDS,
            "preferred_role", "preferred_domain", "preferred_location",
            "remote_preference", "higher_studies_interest"
        ]

        student_fields = [
            "age", "gender", "city", "branch", "tenth_percentage",
            "twelfth_percentage", "cgpa", "backlogs", "attendance_percentage"
        ]

        with engine.begin() as connection:
            exists = connection.execute(
                text("SELECT student_id FROM students WHERE student_id=:student_id LIMIT 1"),
                {"student_id": student_id}
            ).scalar_one_or_none()
            if exists is None:
                raise HTTPException(status_code=404, detail="Student not found.")

            email_owner = connection.execute(
                text("SELECT student_id FROM student_accounts WHERE email=:email AND student_id<>:student_id LIMIT 1"),
                {"email": email, "student_id": student_id}
            ).scalar_one_or_none()
            if email_owner is not None:
                raise HTTPException(status_code=409, detail="That email address is already used by another CareerLens account.")

            student_updates = {
                field: (int(_num(student_data, field)) if field in {"age", "backlogs"} else _num(student_data, field))
                for field in student_fields
            }
            student_updates["gender"] = str(student_data.get("gender", "")).strip()
            student_updates["city"] = str(student_data.get("city", "")).strip()
            student_updates["branch"] = str(student_data.get("branch", "")).strip()
            connection.execute(
                text("""UPDATE students SET
                    age=:age, gender=:gender, city=:city, branch=:branch,
                    tenth_percentage=:tenth_percentage, twelfth_percentage=:twelfth_percentage,
                    cgpa=:cgpa, backlogs=:backlogs, attendance_percentage=:attendance_percentage
                    WHERE student_id=:student_id"""),
                {**student_updates, "student_id": student_id}
            )

            profile_values = {field: student_data.get(field) for field in profile_fields}
            for field in profile_fields:
                if field in {"graduation_year", "semester", *[f for f in EXPERIENCE_FIELDS if f in {"internship_count", "internship_months", "work_experience_months", "industry_projects", "personal_projects", "certification_count", "github_commits", "coding_questions_solved"}]}:
                    profile_values[field] = int(_num(student_data, field))
                elif field in TECHNICAL_FIELDS + SOFT_FIELDS + ["project_quality_score", "github_engagement_index"]:
                    profile_values[field] = _num(student_data, field)
                elif profile_values[field] is not None:
                    profile_values[field] = str(profile_values[field]).strip()

            merged = dict(student_data)
            merged["student_id"] = student_id
            indexes = calculate_profile_indexes(merged)
            profile_values.update(indexes)

            profile_exists = connection.execute(
                text("SELECT profile_id FROM student_profiles WHERE student_id=:student_id LIMIT 1"),
                {"student_id": student_id}
            ).scalar_one_or_none()

            if profile_exists is None:
                columns = ["student_id"] + profile_fields + list(indexes.keys())
                params = {"student_id": student_id, **profile_values}
                connection.execute(
                    text(f"INSERT INTO student_profiles ({','.join(columns)}) VALUES ({','.join(':'+c for c in columns)})"),
                    params
                )
            else:
                set_clause = ", ".join(f"{field}=:{field}" for field in profile_fields + list(indexes.keys()))
                connection.execute(
                    text(f"UPDATE student_profiles SET {set_clause} WHERE student_id=:student_id"),
                    {**profile_values, **indexes, "student_id": student_id}
                )

            # Keep the compact skills table synchronized with the profile.
            skill_columns_for_table = [
                "python_score", "sql_score", "excel_score", "powerbi_score",
                "statistics_score", "ml_score", "coding_score", "communication_score"
            ]
            existing_skill = connection.execute(
                text("SELECT skill_id FROM student_skills WHERE student_id=:student_id ORDER BY skill_id DESC LIMIT 1"),
                {"student_id": student_id}
            ).scalar_one_or_none()
            skill_values = {field: _num(student_data, field) for field in skill_columns_for_table}
            if existing_skill is None:
                connection.execute(
                    text("""INSERT INTO student_skills
                        (student_id,python_score,sql_score,excel_score,powerbi_score,statistics_score,ml_score,coding_score,communication_score)
                        VALUES (:student_id,:python_score,:sql_score,:excel_score,:powerbi_score,:statistics_score,:ml_score,:coding_score,:communication_score)"""),
                    {"student_id": student_id, **skill_values}
                )
            else:
                connection.execute(
                    text("""UPDATE student_skills SET
                        python_score=:python_score, sql_score=:sql_score, excel_score=:excel_score,
                        powerbi_score=:powerbi_score, statistics_score=:statistics_score, ml_score=:ml_score,
                        coding_score=:coding_score, communication_score=:communication_score
                        WHERE skill_id=:skill_id"""),
                    {**skill_values, "skill_id": existing_skill}
                )

            connection.execute(
                text("UPDATE student_accounts SET email=:email WHERE student_id=:student_id"),
                {"email": email, "student_id": student_id}
            )

        # Rebuild all stored intelligence from the updated profile.
        data = get_complete_student_data(student_id)
        career = generate_career_intelligence(data)
        placement = predict_placement(data)
        predicted_package = 0
        try:
            predicted_package = predict_salary(data).get("predicted_package_lpa", 0)
        except Exception as salary_error:
            print(f"Salary refresh warning for #{student_id}: {salary_error}")

        with engine.begin() as connection:
            connection.execute(text("DELETE FROM predictions WHERE student_id=:student_id"), {"student_id": student_id})
            connection.execute(text("DELETE FROM career_recommendations WHERE student_id=:student_id"), {"student_id": student_id})
            connection.execute(text("DELETE FROM skill_gaps WHERE student_id=:student_id"), {"student_id": student_id})

            connection.execute(
                text("""INSERT INTO predictions
                    (student_id,placement_probability,predicted_package)
                    VALUES (:student_id,:placement_probability,:predicted_package)"""),
                {
                    "student_id": student_id,
                    "placement_probability": placement.get("placement_probability", 0),
                    "predicted_package": predicted_package,
                }
            )

            connection.execute(
                text("""INSERT INTO career_recommendations
                    (student_id,recommended_role,match_score)
                    VALUES (:student_id,:recommended_role,:match_score)"""),
                {
                    "student_id": student_id,
                    "recommended_role": career.get("recommended_role", "Not available"),
                    "match_score": career.get("match_score", 0),
                }
            )

            for gap in career.get("skill_gaps", []):
                market_row = market_demand[market_demand["Skill"] == gap.get("skill_name", gap.get("skill"))]
                demand = float(market_row.iloc[0]["Demand_Percentage"]) if not market_row.empty else 0
                connection.execute(
                    text("""INSERT INTO skill_gaps
                        (student_id,skill,student_score,market_demand,skill_gap,priority)
                        VALUES (:student_id,:skill,:student_score,:market_demand,:skill_gap,:priority)"""),
                    {
                        "student_id": student_id,
                        "skill": gap.get("skill_name", gap.get("skill")),
                        "student_score": gap.get("score", 0),
                        "market_demand": demand,
                        "skill_gap": gap.get("gap", 0),
                        "priority": gap.get("priority", 0),
                    }
                )

        return {
            "status": "success",
            "message": "Profile updated and CareerLens intelligence refreshed successfully.",
            "student_id": student_id,
            "email": email,
            "placement_probability": placement.get("placement_probability", 0),
            "predicted_package_lpa": predicted_package,
            "recommended_role": career.get("recommended_role"),
            "match_score": career.get("match_score", 0),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# Career Progress Tracking
# -----------------------------

CAREER_PROGRESS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS career_progress_snapshots (
    snapshot_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    readiness_score FLOAT DEFAULT 0,
    placement_probability FLOAT DEFAULT 0,
    predicted_package_lpa FLOAT DEFAULT 0,
    academic_index FLOAT DEFAULT 0,
    technical_index FLOAT DEFAULT 0,
    experience_index FLOAT DEFAULT 0,
    communication_index FLOAT DEFAULT 0,
    employability_index FLOAT DEFAULT 0,
    recommended_role VARCHAR(100),
    python_score FLOAT DEFAULT 0,
    sql_score FLOAT DEFAULT 0,
    powerbi_score FLOAT DEFAULT 0,
    statistics_score FLOAT DEFAULT 0,
    coding_score FLOAT DEFAULT 0,
    captured_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_career_progress_student FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    INDEX idx_career_progress_student_date (student_id, captured_at)
)
"""

def ensure_progress_table():
    with engine.begin() as connection:
        connection.execute(text(CAREER_PROGRESS_TABLE_SQL))

def _progress_value(row, key):
    try:
        return round(float(row.get(key) or 0), 2)
    except (TypeError, ValueError):
        return 0.0

@app.get("/students/{student_id}/career-progress")
def career_progress(student_id: int):
    """Return a persistent timeline of the student's CareerLens progress.

    A snapshot is created only when the current intelligence differs from the
    latest saved snapshot, so simply refreshing the dashboard does not create
    duplicate history rows.
    """
    try:
        ensure_profile_table()
        ensure_progress_table()
        data = get_complete_student_data(student_id)
        if not data:
            raise HTTPException(status_code=404, detail="Student not found")

        career = generate_career_intelligence(data)
        placement = predict_placement(data)
        package = 0.0
        try:
            package = float(predict_salary(data).get("predicted_package_lpa", 0) or 0)
        except Exception as salary_error:
            print(f"Career progress salary warning for #{student_id}: {salary_error}")

        current = {
            "readiness_score": _progress_value(career, "readiness_score"),
            "placement_probability": _progress_value(placement, "placement_probability"),
            "predicted_package_lpa": round(package, 2),
            "academic_index": _progress_value(data, "academic_index"),
            "technical_index": _progress_value(data, "technical_skill_index"),
            "experience_index": _progress_value(data, "experience_index"),
            "communication_index": _progress_value(data, "communication_index"),
            "employability_index": _progress_value(data, "employability_index"),
            "recommended_role": career.get("recommended_role", "Not available"),
            "python_score": _progress_value(data, "python_score"),
            "sql_score": _progress_value(data, "sql_score"),
            "powerbi_score": _progress_value(data, "powerbi_score"),
            "statistics_score": _progress_value(data, "statistics_score"),
            "coding_score": _progress_value(data, "coding_score"),
        }

        with engine.begin() as connection:
            latest = connection.execute(
                text("""SELECT * FROM career_progress_snapshots
                       WHERE student_id=:student_id
                       ORDER BY captured_at DESC, snapshot_id DESC LIMIT 1"""),
                {"student_id": student_id},
            ).mappings().first()

            comparable = [
                "readiness_score", "placement_probability", "predicted_package_lpa",
                "academic_index", "technical_index", "experience_index",
                "communication_index", "employability_index", "recommended_role",
                "python_score", "sql_score", "powerbi_score", "statistics_score", "coding_score",
            ]
            changed = latest is None or any(
                (str(latest.get(k) or "") != str(current.get(k) or ""))
                if k == "recommended_role"
                else abs(float(latest.get(k) or 0) - float(current.get(k) or 0)) > 0.01
                for k in comparable
            )

            if changed:
                connection.execute(
                    text("""INSERT INTO career_progress_snapshots
                    (student_id, readiness_score, placement_probability, predicted_package_lpa,
                     academic_index, technical_index, experience_index, communication_index,
                     employability_index, recommended_role, python_score, sql_score,
                     powerbi_score, statistics_score, coding_score)
                    VALUES (:student_id, :readiness_score, :placement_probability, :predicted_package_lpa,
                            :academic_index, :technical_index, :experience_index, :communication_index,
                            :employability_index, :recommended_role, :python_score, :sql_score,
                            :powerbi_score, :statistics_score, :coding_score)"""),
                    {"student_id": student_id, **current},
                )

            rows = connection.execute(
                text("""SELECT snapshot_id, readiness_score, placement_probability,
                       predicted_package_lpa, academic_index, technical_index,
                       experience_index, communication_index, employability_index,
                       recommended_role, python_score, sql_score, powerbi_score,
                       statistics_score, coding_score, captured_at
                       FROM career_progress_snapshots
                       WHERE student_id=:student_id
                       ORDER BY captured_at ASC, snapshot_id ASC"""),
                {"student_id": student_id},
            ).mappings().all()

        history = []
        for row in rows:
            item = dict(row)
            if item.get("captured_at") is not None:
                item["captured_at"] = item["captured_at"].isoformat()
            for key in item:
                if key not in {"snapshot_id", "recommended_role", "captured_at"}:
                    try:
                        item[key] = round(float(item[key] or 0), 2)
                    except (TypeError, ValueError):
                        pass
            history.append(item)

        previous = history[-2] if len(history) > 1 else None
        latest_item = history[-1] if history else current
        return {
            "student_id": student_id,
            "current": latest_item,
            "previous": previous,
            "history": history[-8:],
            "snapshot_count": len(history),
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# -----------------------------
# Save Student Profile
# -----------------------------

@app.post("/students")
def save_student(student_data: dict):

    try:

        required_fields = [
            "student_id",
            "age",
            "gender",
            "city",
            "branch",
            "tenth_percentage",
            "twelfth_percentage",
            "cgpa",
            "backlogs",
            "attendance_percentage"
        ]

        missing_fields = [
            field
            for field in required_fields
            if field not in student_data
        ]

        if missing_fields:
            raise HTTPException(
                status_code=400,
                detail={
                    "message": "Missing required fields",
                    "missing_fields": missing_fields
                }
            )

        query = text("""
            INSERT INTO students (
                student_id,
                age,
                gender,
                city,
                branch,
                tenth_percentage,
                twelfth_percentage,
                cgpa,
                backlogs,
                attendance_percentage
            )
            VALUES (
                :student_id,
                :age,
                :gender,
                :city,
                :branch,
                :tenth_percentage,
                :twelfth_percentage,
                :cgpa,
                :backlogs,
                :attendance_percentage
            )
        """)

        with engine.begin() as connection:

            connection.execute(
                query,
                {
                    "student_id": student_data["student_id"],
                    "age": student_data["age"],
                    "gender": student_data["gender"],
                    "city": student_data["city"],
                    "branch": student_data["branch"],
                    "tenth_percentage": student_data["tenth_percentage"],
                    "twelfth_percentage": student_data["twelfth_percentage"],
                    "cgpa": student_data["cgpa"],
                    "backlogs": student_data["backlogs"],
                    "attendance_percentage": student_data["attendance_percentage"]
                }
            )

        return {
            "status": "success",
            "message": "Student profile saved successfully",
            "student_id": student_data["student_id"]
        }

    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# -----------------------------
# Save Student Skills
# -----------------------------

@app.post("/students/{student_id}/skills")
def save_student_skills(student_id: int, skill_data: dict):

    try:

        query = text("""
            INSERT INTO student_skills (
                student_id,
                python_score,
                sql_score,
                excel_score,
                powerbi_score,
                statistics_score,
                ml_score,
                coding_score,
                communication_score
            )
            VALUES (
                :student_id,
                :python_score,
                :sql_score,
                :excel_score,
                :powerbi_score,
                :statistics_score,
                :ml_score,
                :coding_score,
                :communication_score
            )
        """)

        with engine.begin() as connection:

            connection.execute(
                query,
                {
                    "student_id": student_id,
                    "python_score": skill_data.get("python_score", 0),
                    "sql_score": skill_data.get("sql_score", 0),
                    "excel_score": skill_data.get("excel_score", 0),
                    "powerbi_score": skill_data.get("powerbi_score", 0),
                    "statistics_score": skill_data.get("statistics_score", 0),
                    "ml_score": skill_data.get("ml_score", 0),
                    "coding_score": skill_data.get("coding_score", 0),
                    "communication_score": skill_data.get("communication_score", 0)
                }
            )

        return {
            "status": "success",
            "message": "Student skills saved successfully",
            "student_id": student_id
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# -----------------------------
# Save ML Prediction
# -----------------------------

@app.post("/students/{student_id}/prediction")
def save_prediction(student_id: int, prediction_data: dict):

    try:

        query = text("""
            INSERT INTO predictions (
                student_id,
                placement_probability,
                predicted_package
            )
            VALUES (
                :student_id,
                :placement_probability,
                :predicted_package
            )
        """)

        with engine.begin() as connection:

            connection.execute(
                query,
                {
                    "student_id": student_id,
                    "placement_probability":
                        prediction_data.get(
                            "placement_probability", 0
                        ),
                    "predicted_package":
                        prediction_data.get(
                            "predicted_package", 0
                        )
                }
            )

        return {
            "status": "success",
            "message": "Prediction saved successfully",
            "student_id": student_id
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# -----------------------------
# Save Career Recommendation
# -----------------------------

@app.post("/students/{student_id}/career-recommendation")
def save_career_recommendation(
    student_id: int,
    recommendation_data: dict
):

    try:

        query = text("""
            INSERT INTO career_recommendations (
                student_id,
                recommended_role,
                match_score
            )
            VALUES (
                :student_id,
                :recommended_role,
                :match_score
            )
        """)

        with engine.begin() as connection:

            connection.execute(
                query,
                {
                    "student_id": student_id,
                    "recommended_role":
                        recommendation_data.get(
                            "recommended_role"
                        ),
                    "match_score":
                        recommendation_data.get(
                            "match_score", 0
                        )
                }
            )

        return {
            "status": "success",
            "message": "Career recommendation saved successfully",
            "student_id": student_id
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# -----------------------------
# Save Skill Gap
# -----------------------------

@app.post("/students/{student_id}/skill-gap")
def save_skill_gap(
    student_id: int,
    skill_data: dict
):

    try:

        query = text("""
            INSERT INTO skill_gaps (
                student_id,
                skill,
                student_score,
                market_demand,
                skill_gap,
                priority
            )
            VALUES (
                :student_id,
                :skill,
                :student_score,
                :market_demand,
                :skill_gap,
                :priority
            )
        """)

        with engine.begin() as connection:

            connection.execute(
                query,
                {
                    "student_id": student_id,
                    "skill": skill_data.get("skill"),
                    "student_score":
                        skill_data.get(
                            "student_score", 0
                        ),
                    "market_demand":
                        skill_data.get(
                            "market_demand", 0
                        ),
                    "skill_gap":
                        skill_data.get(
                            "skill_gap", 0
                        ),
                    "priority":
                        skill_data.get(
                            "priority", 0
                        )
                }
            )

        return {
            "status": "success",
            "message": "Skill gap saved successfully",
            "student_id": student_id
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# -----------------------------
# SHAP Explainable AI
# -----------------------------

@app.get("/students/{student_id}/shap-explanation")
def student_shap_explanation(student_id:int):
 try:
  ensure_profile_table(); data=get_complete_student_data(student_id)
  if not data: raise HTTPException(status_code=404,detail="Student not found")
  return {"student_id":student_id,"message":"SHAP explanation generated successfully",**explain_student(data)}
 except HTTPException: raise
 except Exception as e: raise HTTPException(status_code=500,detail=str(e))


# -----------------------------
# Career Simulator / What-If Analysis
# -----------------------------

# These fields are numeric in the CareerLens dataset/model. Missing values
# from older student profiles are normalized only for a simulation request;
# the saved database profile is never modified by this helper.
_SIMULATION_NUMERIC_FIELDS = {
    "age", "tenth_percentage", "twelfth_percentage", "cgpa", "backlogs",
    "attendance_percentage", "academic_index", "python_score", "sql_score",
    "excel_score", "powerbi_score", "statistics_score", "ml_score",
    "java_score", "web_dev_score", "data_visualization_score", "coding_score",
    "communication_score", "aptitude_score", "logical_reasoning_score",
    "presentation_score", "teamwork_score", "leadership_score",
    "internship_count", "internship_months", "work_experience_months",
    "industry_projects", "personal_projects", "certification_count",
    "project_quality_score", "github_commits", "github_engagement_index",
    "coding_questions_solved", "skill_index", "technical_skill_index",
    "experience_index", "communication_index", "employability_index",
    "project_count", "statistics_gap", "dsa_gap"
}


def _prepare_simulation_profile(profile: dict) -> dict:
    """Make an in-memory, model-safe copy of a student profile."""
    cleaned = dict(profile or {})

    for key in _SIMULATION_NUMERIC_FIELDS:
        value = cleaned.get(key)
        if value is None:
            cleaned[key] = 0.0
            continue
        try:
            if pd.isna(value):
                cleaned[key] = 0.0
        except (TypeError, ValueError):
            pass

    # Missing categorical values should remain strings for the preprocessing
    # pipeline instead of reaching sklearn/XGBoost as Python None.
    for key in ("gender", "city", "branch", "state", "college", "preferred_role",
                "preferred_domain", "preferred_location", "remote_preference",
                "higher_studies_interest"):
        if cleaned.get(key) is None:
            cleaned[key] = ""

    return cleaned


@app.post("/students/simulate-career")
def simulate_career(simulation_data: dict):
    """Run a temporary what-if simulation without changing the saved profile."""
    try:
        ensure_profile_table()
        student_id = int(simulation_data.get("student_id"))
        overrides = simulation_data.get("overrides") or {}
        allowed = {
            "python_score", "sql_score", "powerbi_score",
            "statistics_score", "coding_score"
        }
        clean_overrides = {}
        for key, value in overrides.items():
            if key in allowed:
                clean_overrides[key] = max(0.0, min(100.0, float(value)))

        base = get_complete_student_data(student_id)
        if not base:
            raise HTTPException(status_code=404, detail="Student not found")

        # Preserve the real saved profile, but use a model-safe in-memory copy
        # for the what-if calculations. This fixes legacy profiles containing
        # NULL values without changing anything in MySQL.
        base = _prepare_simulation_profile(base)

        current_placement = predict_placement(base)
        current_package = 0.0
        try:
            current_package = float(predict_salary(base).get("predicted_package_lpa", 0) or 0)
        except Exception:
            pass
        current_career = generate_career_intelligence(base)
        current_readiness = float(current_career.get("readiness_score", 0) or 0)

        simulated = dict(base)
        simulated.update(clean_overrides)
        simulated.update(calculate_profile_indexes(simulated))

        simulated_placement = predict_placement(simulated)
        simulated_package = 0.0
        try:
            simulated_package = float(predict_salary(simulated).get("predicted_package_lpa", 0) or 0)
        except Exception:
            pass
        simulated_career = generate_career_intelligence(simulated)

        simulated_readiness = float(simulated_career.get("readiness_score", 0) or 0)
        simulated_probability = float(simulated_placement.get("placement_probability", 0) or 0)
        current_probability = float(current_placement.get("placement_probability", 0) or 0)

        return {
            "student_id": student_id,
            "simulated_readiness": simulated_readiness,
            "readiness_change": simulated_readiness - current_readiness,
            "simulated_placement_probability": simulated_probability,
            "placement_change": simulated_probability - current_probability,
            "simulated_package_lpa": simulated_package,
            "package_change": simulated_package - current_package,
            "recommended_role": simulated_career.get("recommended_role", "Not available"),
            "match_score": simulated_career.get("match_score", 0),
            "overrides": clean_overrides,
            "simulation_only": True,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))




# -----------------------------
# AI Interview Preparation
# -----------------------------

INTERVIEW_BANK = {
    "Data Analyst": [
        {"category":"SQL", "difficulty":"Medium", "question":"Explain the difference between INNER JOIN and LEFT JOIN and give a practical example.", "focus":"Be ready to explain what happens to unmatched rows.", "answer":"INNER JOIN returns only rows with a match in both tables. LEFT JOIN keeps every row from the left table and adds matching data from the right table; unmatched right-side values become NULL.", "tip":"Use a small student-course example rather than only giving definitions."},
        {"category":"SQL", "difficulty":"Hard", "question":"How would you find the second-highest salary in a table without using LIMIT 1 OFFSET 1?", "focus":"Window functions and alternative SQL approaches.", "answer":"A common approach is DENSE_RANK() over salary in descending order and then filter for rank 2. A correlated subquery or a MAX salary below the maximum can also work.", "tip":"Mention how ties affect RANK, DENSE_RANK and ROW_NUMBER."},
        {"category":"Python", "difficulty":"Medium", "question":"How would you handle missing values in a real analytics dataset?", "focus":"Explain diagnosis before imputation or deletion.", "answer":"First identify the amount and pattern of missingness. Depending on the business meaning, I may remove unusable records, fill numeric values with a suitable statistic, use a model-based approach, or preserve missingness as a meaningful category.", "tip":"Always explain why your choice is appropriate for the dataset."},
        {"category":"Statistics", "difficulty":"Medium", "question":"What is the difference between correlation and causation?", "focus":"Avoid interpreting association as a business cause.", "answer":"Correlation measures how two variables move together, while causation means a change in one variable produces a change in another. Correlation alone does not establish causation because of confounding variables or coincidence.", "tip":"Give a simple business example if asked to elaborate."},
        {"category":"Power BI", "difficulty":"Medium", "question":"What is the purpose of a star schema in Power BI?", "focus":"Data modeling and report performance.", "answer":"A star schema separates a central fact table from descriptive dimension tables. It makes relationships clearer, supports efficient filtering and aggregation, and generally produces a cleaner Power BI model.", "tip":"Mention one-to-many relationships from dimensions to facts."},
        {"category":"Analytics", "difficulty":"Medium", "question":"How would you decide which KPI belongs on an executive dashboard?", "focus":"Connect metrics to business objectives.", "answer":"I would start from the business objective, identify measurable outcomes, select a small set of actionable KPIs, define them clearly, and validate that the data is reliable and updated at the required frequency.", "tip":"Explain why fewer actionable KPIs are better than a crowded dashboard."},
        {"category":"Case Study", "difficulty":"Hard", "question":"A company's sales dropped 15% last month. How would you investigate it?", "focus":"Structure your analysis before touching the data.", "answer":"I would verify the metric first, then segment the change by time, product, region, channel and customer type. I would compare the affected segments with historical patterns, check data-quality issues, identify likely drivers and quantify their contribution before recommending actions.", "tip":"Think in hypotheses and progressively narrow the problem."},
        {"category":"Behavioral", "difficulty":"Easy", "question":"Tell me about a data project you are proud of.", "focus":"Use Situation, Task, Action and Result.", "answer":"I would briefly describe the problem, my responsibility, the tools and analysis I performed, and the measurable result. I would finish by explaining what I learned and what I would improve next time.", "tip":"Keep the answer around 60–90 seconds and focus on your contribution."},
    ],
    "Data Scientist": [
        {"category":"Python", "difficulty":"Medium", "question":"How would you detect and handle outliers before building a model?", "focus":"Combine statistical evidence with domain context.", "answer":"I would inspect distributions and use methods such as IQR or robust statistics to identify potential outliers, then determine whether they are errors, rare valid observations or important business cases before deciding to transform, cap or retain them.", "tip":"Never remove outliers automatically."},
        {"category":"Machine Learning", "difficulty":"Medium", "question":"What is overfitting and how can you reduce it?", "focus":"Generalization and validation.", "answer":"Overfitting occurs when a model learns training-specific patterns that do not generalize. I can reduce it using proper cross-validation, simpler models, regularization, feature selection, early stopping or more representative data.", "tip":"Connect the answer to validation performance, not just training accuracy."},
        {"category":"Statistics", "difficulty":"Hard", "question":"What is the difference between precision and recall?", "focus":"Choose metrics according to the business cost of errors.", "answer":"Precision is the fraction of predicted positives that are actually positive. Recall is the fraction of actual positives that the model identifies. The preferred balance depends on whether false positives or false negatives are more costly.", "tip":"Give a fraud or medical screening example."},
        {"category":"Modeling", "difficulty":"Hard", "question":"Why do we use cross-validation?", "focus":"Reliable model evaluation.", "answer":"Cross-validation evaluates a model across multiple train-validation splits, giving a more stable estimate of generalization and helping compare models without depending on a single split.", "tip":"Mention stratification for imbalanced classification when appropriate."},
    ],
    "Business Analyst": [
        {"category":"Business", "difficulty":"Medium", "question":"How would you gather requirements from stakeholders who disagree with each other?", "focus":"Facilitation, evidence and prioritization.", "answer":"I would document the conflicting requirements, clarify the business objective behind each request, identify constraints and dependencies, and facilitate a discussion around measurable outcomes. I would then document the agreed priority and assumptions.", "tip":"Show that you resolve ambiguity rather than simply choosing a side."},
        {"category":"Excel", "difficulty":"Medium", "question":"Which Excel features are useful for business analysis?", "focus":"Use tools to answer business questions efficiently.", "answer":"PivotTables, XLOOKUP, SUMIFS, conditional formatting, charts, Power Query and data validation are useful for cleaning, joining, summarizing and presenting business data.", "tip":"Mention a real use case for one or two features."},
        {"category":"Communication", "difficulty":"Easy", "question":"How would you explain a complex analysis to a non-technical stakeholder?", "focus":"Translate technical findings into decisions.", "answer":"I would start with the business question, present the key finding in plain language, use one or two simple visuals, explain the evidence briefly and finish with the implication or recommended action.", "tip":"Avoid unnecessary technical terminology."},
    ],
    "BI Analyst": [
        {"category":"Power BI", "difficulty":"Medium", "question":"What is the difference between a calculated column and a measure in Power BI?", "focus":"DAX evaluation context and model design.", "answer":"A calculated column is computed row by row and stored in the model, while a measure is calculated when a visual queries it and responds to filter context. Measures are generally preferred for dynamic aggregations.", "tip":"Explain filter context with a simple sales example."},
        {"category":"SQL", "difficulty":"Medium", "question":"How would you optimize a dashboard backed by a large dataset?", "focus":"Modeling, query and visualization efficiency.", "answer":"I would reduce unnecessary columns and rows, use a clean star schema, optimize source queries, use appropriate aggregations or incremental refresh where applicable, and avoid overly complex visuals and DAX.", "tip":"Start with measurement and identify the actual bottleneck."},
        {"category":"Visualization", "difficulty":"Easy", "question":"How do you choose the right chart for a business question?", "focus":"Match visual encoding to analytical intent.", "answer":"I choose based on the question: trends often use line charts, category comparisons use bars, composition can use stacked charts when appropriate, and relationships may use scatter plots. I prioritize readability over decoration.", "tip":"Explain what decision the chart should help someone make."},
    ],
    "Software Developer": [
        {"category":"Programming", "difficulty":"Medium", "question":"What is the difference between an array and a linked list?", "focus":"Data structure trade-offs.", "answer":"Arrays provide contiguous storage and fast indexed access, while linked lists use nodes connected by pointers and can insert or remove elements efficiently when a node position is known. Arrays usually have better cache locality.", "tip":"Mention time complexity and practical trade-offs."},
        {"category":"OOP", "difficulty":"Medium", "question":"Explain encapsulation, inheritance, polymorphism and abstraction.", "focus":"Use concise definitions with examples.", "answer":"Encapsulation bundles data and behavior with controlled access. Inheritance reuses or extends behavior. Polymorphism allows a common interface to represent different implementations. Abstraction exposes essential behavior while hiding implementation details.", "tip":"A small real-world or code example makes the answer stronger."},
        {"category":"Problem Solving", "difficulty":"Hard", "question":"How do you approach a coding problem you have never seen before?", "focus":"Structured problem solving.", "answer":"I clarify the requirements, identify inputs and constraints, work through a small example, develop a straightforward approach, analyze complexity, then optimize only where necessary and test edge cases.", "tip":"Interviewers often evaluate your reasoning process as much as the final code."},
    ],
    "ML Engineer": [
        {"category":"Machine Learning", "difficulty":"Hard", "question":"How would you deploy a trained machine-learning model safely?", "focus":"Move beyond training into production concerns.", "answer":"I would package the preprocessing and model together, validate inputs, version the model and data, expose a controlled inference service, log predictions and latency, monitor drift and performance, and keep a rollback path.", "tip":"Mention that preprocessing must remain consistent between training and inference."},
        {"category":"ML", "difficulty":"Medium", "question":"Why is feature scaling important for some algorithms but not tree-based models?", "focus":"Understand algorithm behavior.", "answer":"Distance- and gradient-based algorithms can be affected by feature magnitude, so scaling can improve optimization or distance calculations. Tree splits depend on ordering and thresholds, so scaling generally does not change the split decisions of standard decision trees.", "tip":"Give examples such as KNN or logistic regression versus XGBoost."},
        {"category":"Python", "difficulty":"Medium", "question":"How would you make an ML inference pipeline reproducible?", "focus":"Versioning and deterministic preprocessing.", "answer":"I would version the model, preprocessing code and dependencies, persist the exact feature transformation pipeline, control random seeds where appropriate, and record the training data or dataset version used to create the model.", "tip":"Reproducibility is about the entire pipeline, not only the model file."},
    ],
}

@app.get("/students/{student_id}/interview-prep")
def interview_prep(student_id: int, role: str = "Data Analyst"):
    try:
        ensure_profile_table()
        profile = get_complete_student_data(student_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Student not found")

        selected_role = role if role in INTERVIEW_BANK else (profile.get("preferred_role") or "Data Analyst")
        questions = list(INTERVIEW_BANK.get(selected_role, INTERVIEW_BANK["Data Analyst"]))

        # Prioritize a small number of questions related to weaker profile skills.
        skill_map = {
            "SQL": "sql_score", "Python": "python_score", "Power BI": "powerbi_score",
            "Statistics": "statistics_score", "Machine Learning": "ml_score",
            "Excel": "excel_score", "Programming": "coding_score",
            "Communication": "communication_score", "Visualization": "data_visualization_score",
        }
        weak_topics = {topic for topic, feature in skill_map.items() if float(profile.get(feature) or 0) < 65}
        questions.sort(key=lambda q: 0 if any(topic.lower() in q["category"].lower() or topic.lower() in q["focus"].lower() for topic in weak_topics) else 1)

        return {
            "student_id": student_id,
            "role": selected_role,
            "personalized_for": sorted(weak_topics),
            "questions": questions[:8],
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# -----------------------------
# Interview Answer Evaluation
# -----------------------------

@app.post("/students/evaluate-interview-answer")
def evaluate_interview_answer(payload: dict):
    """Evaluate a student's interview answer using transparent, deterministic criteria.
    This does not change the saved student profile.
    """
    try:
        student_id = int(payload.get("student_id"))
        answer = str(payload.get("answer") or "").strip()
        model_answer = str(payload.get("model_answer") or "").strip()
        category = str(payload.get("category") or "").strip()

        if not answer:
            raise HTTPException(status_code=400, detail="Please provide an answer before submitting.")
        if not model_answer:
            raise HTTPException(status_code=400, detail="A model answer is not available for this question.")

        import re
        def tokens(text):
            return set(re.findall(r"[a-zA-Z0-9+#.]+", text.lower()))

        answer_tokens = tokens(answer)
        model_tokens = tokens(model_answer)
        stop = {"the", "and", "or", "to", "of", "a", "an", "is", "are", "in", "for", "with", "that", "this", "it", "on", "as", "be", "can", "from", "by", "i"}
        meaningful_model = model_tokens - stop
        overlap = len(answer_tokens & meaningful_model) / max(1, len(meaningful_model))
        length_score = min(100.0, max(25.0, len(answer.split()) / 80.0 * 100.0))
        completeness = min(100.0, 35.0 + overlap * 90.0)
        technical_accuracy = min(100.0, 40.0 + overlap * 85.0)
        clarity = min(100.0, 45.0 + min(len(answer.split()), 70) * 0.65)
        interview_readiness = (technical_accuracy * 0.4) + (completeness * 0.3) + (clarity * 0.3)
        overall = (technical_accuracy * 0.4) + (completeness * 0.3) + (clarity * 0.15) + (interview_readiness * 0.15)

        if overlap >= 0.45:
            strength = "Your answer covers several of the key concepts expected for this question."
        elif overlap >= 0.22:
            strength = "You have started with relevant ideas; the core direction of your answer is useful."
        else:
            strength = "You attempted the question and provided a starting point that can be developed further."

        if len(answer.split()) < 25:
            improvement = "Add a little more explanation and a concrete example so the interviewer can see your reasoning."
        elif overlap < 0.22:
            improvement = "Connect your answer more directly to the key concepts in the question and use role-relevant terminology."
        else:
            improvement = "Make the answer more structured: give the definition, explain the practical implication, and finish with a short example."

        return {
            "student_id": student_id,
            "category": category,
            "technical_accuracy": round(technical_accuracy, 1),
            "completeness": round(completeness, 1),
            "clarity": round(clarity, 1),
            "interview_readiness": round(interview_readiness, 1),
            "overall_score": round(overall, 1),
            "strength": strength,
            "improvement": improvement,
            "evaluation_type": "transparent_keyword_and_structure_evaluation",
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Interview answer evaluation failed: {exc}")


# -----------------------------
# Resume Intelligence
# -----------------------------

RESUME_MAX_BYTES = 5 * 1024 * 1024

RESUME_SKILL_ALIASES = {
    "python_score": ["python"],
    "sql_score": ["sql", "mysql", "postgresql", "postgres", "sqlite"],
    "excel_score": ["excel", "microsoft excel", "ms excel"],
    "powerbi_score": ["power bi", "powerbi"],
    "statistics_score": ["statistics", "statistical analysis", "statistical"],
    "ml_score": ["machine learning", "ml", "scikit-learn", "sklearn", "xgboost"],
    "java_score": ["java"],
    "web_dev_score": ["html", "css", "javascript", "react", "web development", "web development"],
    "data_visualization_score": ["data visualization", "data visualisation", "tableau", "charts", "dashboard"],
    "coding_score": ["data structures", "dsa", "algorithms", "competitive programming", "programming"],
    "communication_score": ["communication", "stakeholder communication", "client communication"],
    "aptitude_score": ["aptitude", "quantitative aptitude"],
    "logical_reasoning_score": ["logical reasoning", "reasoning"],
    "presentation_score": ["presentation", "presentations"],
    "teamwork_score": ["teamwork", "team work", "collaboration"],
    "leadership_score": ["leadership", "led a team", "team lead"],
}

RESUME_SKILL_LABELS = {
    "python_score": "Python",
    "sql_score": "SQL",
    "excel_score": "Excel",
    "powerbi_score": "Power BI",
    "statistics_score": "Statistics",
    "ml_score": "Machine Learning",
    "java_score": "Java",
    "web_dev_score": "Web Development",
    "data_visualization_score": "Data Visualization",
    "coding_score": "Programming / DSA",
    "communication_score": "Communication",
    "aptitude_score": "Aptitude",
    "logical_reasoning_score": "Logical Reasoning",
    "presentation_score": "Presentation",
    "teamwork_score": "Teamwork",
    "leadership_score": "Leadership",
}

def _resume_normalize(text_value: str) -> str:
    text_value = text_value or ""
    text_value = text_value.replace("\x00", " ")
    text_value = re.sub(r"\s+", " ", text_value)
    return text_value.strip().lower()

def _resume_contains(normalized_text: str, alias: str) -> bool:
    alias = _resume_normalize(alias)
    if not alias:
        return False
    # Word-aware matching for short technical terms such as SQL, ML, Java.
    if len(alias) <= 4 and re.fullmatch(r"[a-z0-9+#.\- ]+", alias):
        return re.search(rf"(?<![a-z0-9]){re.escape(alias)}(?![a-z0-9])", normalized_text) is not None
    return alias in normalized_text

def _extract_resume_text(filename: str, content_type: str, raw_bytes: bytes) -> str:
    lower_name = (filename or "").lower()
    suffix = Path(lower_name).suffix

    if suffix == ".txt" or content_type == "text/plain":
        return raw_bytes.decode("utf-8", errors="ignore")

    if suffix == ".pdf" or content_type == "application/pdf":
        try:
            from pypdf import PdfReader
        except ImportError:
            raise HTTPException(status_code=500, detail="PDF support is unavailable. Install pypdf in the CareerLens environment.")
        try:
            reader = PdfReader(io.BytesIO(raw_bytes))
            pages = [(page.extract_text() or "") for page in reader.pages]
            return "\n".join(pages)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not read the PDF resume: {exc}")

    if suffix == ".docx" or "wordprocessingml.document" in (content_type or ""):
        try:
            from docx import Document
        except ImportError:
            raise HTTPException(status_code=500, detail="DOCX support is unavailable. Install python-docx in the CareerLens environment.")
        try:
            document = Document(io.BytesIO(raw_bytes))
            paragraphs = [p.text for p in document.paragraphs]
            for table in document.tables:
                for row in table.rows:
                    paragraphs.append(" ".join(cell.text for cell in row.cells))
            return "\n".join(paragraphs)
        except Exception as exc:
            raise HTTPException(status_code=400, detail=f"Could not read the DOCX resume: {exc}")

    raise HTTPException(
        status_code=400,
        detail="Unsupported resume format. Please upload a PDF, DOCX, or TXT file."
    )

def _resume_role_requirements(role: str):
    if role in role_requirements:
        return role
    return "Data Analyst"

@app.post("/students/{student_id}/resume-intelligence")
async def resume_intelligence(
    student_id: int,
    file: UploadFile = File(...),
    target_role: str = Form("Data Analyst"),
):
    try:
        ensure_profile_table()
        profile = get_complete_student_data(student_id)
        if not profile:
            raise HTTPException(status_code=404, detail="Student not found")

        raw_bytes = await file.read()
        if not raw_bytes:
            raise HTTPException(status_code=400, detail="The uploaded resume is empty.")
        if len(raw_bytes) > RESUME_MAX_BYTES:
            raise HTTPException(status_code=400, detail="Resume is larger than 5 MB. Please upload a smaller file.")

        text_content = _extract_resume_text(
            file.filename or "",
            file.content_type or "",
            raw_bytes,
        )
        normalized = _resume_normalize(text_content)

        if len(normalized) < 40:
            raise HTTPException(
                status_code=400,
                detail="Very little readable text was found in the resume. Please upload a text-based PDF, DOCX, or TXT resume."
            )

        role = _resume_role_requirements(target_role or profile.get("preferred_role") or "Data Analyst")
        requirements = role_requirements[role]

        detected_features = set()
        detected_skills = []

        for feature, aliases in RESUME_SKILL_ALIASES.items():
            if any(_resume_contains(normalized, alias) for alias in aliases):
                detected_features.add(feature)
                detected_skills.append(RESUME_SKILL_LABELS[feature])

        total_weight = sum(float(weight) for weight in requirements.values()) or 1.0
        matched_weight = sum(
            float(weight)
            for feature, weight in requirements.items()
            if feature in detected_features
        )
        resume_match_score = round((matched_weight / total_weight) * 100, 1)

        missing_skills = []
        for feature, weight in sorted(requirements.items(), key=lambda item: item[1], reverse=True):
            if feature not in detected_features:
                missing_skills.append({
                    "skill": RESUME_SKILL_LABELS.get(feature, feature.replace("_score", "").replace("_", " ").title()),
                    "feature": feature,
                    "priority": round((float(weight) / total_weight) * 100, 1),
                })

        # Identify strong profile skills that are not clearly represented in the resume.
        profile_skills_to_show = []
        for feature in requirements.keys():
            profile_value = float(profile.get(feature) or 0)
            if profile_value >= 70 and feature not in detected_features:
                profile_skills_to_show.append(RESUME_SKILL_LABELS.get(feature, feature))

        recommendations = []
        if missing_skills:
            top_missing = [item["skill"] for item in missing_skills[:3]]
            recommendations.append(
                "Make your strongest missing role skills visible through a project, certification, measurable achievement, or relevant experience."
            )
            recommendations.append(
                f"For {role}, consider strengthening and clearly documenting: {', '.join(top_missing)}."
            )
        if profile_skills_to_show:
            recommendations.append(
                "Some skills are strong in your CareerLens profile but were not clearly detected in the resume. Add evidence for them rather than only listing the skill name."
            )
        if not re.search(r"\b(projects?|experience|internship|work experience)\b", normalized):
            recommendations.append(
                "Add a concise Projects or Experience section with measurable outcomes and the technologies used."
            )
        if not re.search(r"\b(sql|python|excel|power bi|tableau|machine learning|java|javascript)\b", normalized):
            recommendations.append(
                "Use a dedicated Technical Skills section so important tools are easy for recruiters and ATS systems to find."
            )
        if not recommendations:
            recommendations.append(
                "Keep the resume focused on measurable outcomes, role-relevant skills, projects, and concise evidence of impact."
            )

        return {
            "student_id": student_id,
            "filename": file.filename,
            "target_role": role,
            "resume_match_score": resume_match_score,
            "detected_skills": sorted(detected_skills),
            "missing_skills": missing_skills,
            "profile_skills_to_show": profile_skills_to_show,
            "recommendations": recommendations[:5],
            "text_characters": len(text_content),
            "analysis_type": "keyword_and_role_requirement_analysis",
        }

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Resume analysis failed: {exc}")


# -----------------------------
# Career Intelligence 2.0
# -----------------------------

@app.get("/students/{student_id}/career-intelligence")
def career_intelligence(student_id:int):
 try:
  ensure_profile_table(); data=get_complete_student_data(student_id)
  if not data: raise HTTPException(status_code=404,detail="Student not found")
  return {"student_id":student_id,**generate_career_intelligence(data)}
 except HTTPException: raise
 except Exception as e: raise HTTPException(status_code=500,detail=str(e))


# -----------------------------
# Student Dashboard API
# -----------------------------

@app.get("/students/{student_id}/dashboard")
def student_dashboard(student_id:int):
 try:
  ensure_profile_table(); data=get_complete_student_data(student_id)
  if not data: raise HTTPException(status_code=404,detail="Student not found")
  with engine.connect() as connection:
   prediction=connection.execute(text("SELECT * FROM predictions WHERE student_id=:student_id ORDER BY prediction_id DESC LIMIT 1"),{"student_id":student_id}).mappings().first()
   career=connection.execute(text("SELECT * FROM career_recommendations WHERE student_id=:student_id ORDER BY recommendation_id DESC LIMIT 1"),{"student_id":student_id}).mappings().first()
   gaps=connection.execute(text("SELECT * FROM skill_gaps WHERE student_id=:student_id ORDER BY priority DESC"),{"student_id":student_id}).mappings().all()
  if not prediction:
   try:
    placement=predict_placement(data); package=0
    try: package=predict_salary(data).get("predicted_package_lpa",0)
    except Exception: pass
    with engine.begin() as connection:
     connection.execute(text("INSERT INTO predictions (student_id,placement_probability,predicted_package) VALUES (:student_id,:placement_probability,:predicted_package)"),{"student_id":student_id,"placement_probability":placement["placement_probability"],"predicted_package":package})
    prediction={"student_id":student_id,"placement_probability":placement["placement_probability"],"predicted_package":package}
   except Exception as e: print(f"Prediction warning for #{student_id}: {e}")
  if not career:
   try:
    result=generate_career_intelligence(data)
    with engine.begin() as connection:
     connection.execute(text("INSERT INTO career_recommendations (student_id,recommended_role,match_score) VALUES (:student_id,:recommended_role,:match_score)"),{"student_id":student_id,"recommended_role":result["recommended_role"],"match_score":result["match_score"]})
    career={"student_id":student_id,"recommended_role":result["recommended_role"],"match_score":result["match_score"]}
   except Exception as e: print(f"Career warning for #{student_id}: {e}")
  skills={k:v for k,v in data.items() if k.endswith("_score") or k.endswith("_index") or k in ["technical_skill_index","project_count","statistics_gap","dsa_gap","github_commits","github_engagement_index","coding_questions_solved"]}
  return {"student":data,"profile":data,"skills":skills,"prediction":dict(prediction) if prediction else None,"career_recommendation":dict(career) if career else None,"skill_gaps":[dict(g) for g in gaps]}
 except HTTPException: raise
 except Exception as e: raise HTTPException(status_code=500,detail=str(e))
