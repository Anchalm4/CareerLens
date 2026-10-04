import numpy as np
import pandas as pd

# Reproducibility
np.random.seed(42)

N = 10000

# -----------------------------
# BASIC INFORMATION
# -----------------------------

student_id = np.arange(10001, 10001 + N)

age = np.random.randint(20, 25, N)

gender = np.random.choice(
    ["Male", "Female", "Other"],
    N,
    p=[0.52, 0.46, 0.02]
)

cities = [
    "Bhopal", "Indore", "Delhi", "Mumbai",
    "Pune", "Bangalore", "Hyderabad",
    "Chennai", "Noida", "Jaipur"
]

city = np.random.choice(cities, N)

branches = [
    "CSE",
    "IT",
    "ECE",
    "EEE",
    "Mechanical",
    "Civil"
]

branch = np.random.choice(
    branches,
    N,
    p=[0.35, 0.20, 0.15, 0.10, 0.10, 0.10]
)

# -----------------------------
# ACADEMIC FEATURES
# -----------------------------

tenth_percentage = np.clip(
    np.random.normal(78, 10, N),
    45,
    100
)

twelfth_percentage = np.clip(
    np.random.normal(75, 11, N),
    45,
    100
)

cgpa = np.clip(
    np.random.normal(7.5, 1.0, N),
    4.5,
    10
)

backlogs = np.random.poisson(0.6, N)
backlogs = np.clip(backlogs, 0, 5)

attendance_percentage = np.clip(
    np.random.normal(82, 9, N),
    50,
    100
)

# -----------------------------
# TECHNICAL SKILLS
# -----------------------------

python_score = np.clip(
    np.random.normal(65, 18, N),
    20,
    100
)

sql_score = np.clip(
    np.random.normal(62, 19, N),
    20,
    100
)

excel_score = np.clip(
    np.random.normal(65, 17, N),
    20,
    100
)

powerbi_score = np.clip(
    np.random.normal(55, 20, N),
    10,
    100
)

statistics_score = np.clip(
    np.random.normal(60, 18, N),
    15,
    100
)

ml_score = np.clip(
    np.random.normal(50, 21, N),
    10,
    100
)

java_score = np.clip(
    np.random.normal(55, 22, N),
    10,
    100
)

web_dev_score = np.clip(
    np.random.normal(58, 21, N),
    10,
    100
)

data_visualization_score = np.clip(
    np.random.normal(58, 19, N),
    10,
    100
)

coding_score = np.clip(
    np.random.normal(65, 17, N),
    20,
    100
)

# -----------------------------
# SOFT SKILLS
# -----------------------------

communication_score = np.clip(
    np.random.normal(68, 15, N),
    20,
    100
)

aptitude_score = np.clip(
    np.random.normal(65, 16, N),
    20,
    100
)

logical_reasoning_score = np.clip(
    np.random.normal(64, 17, N),
    20,
    100
)

presentation_score = np.clip(
    np.random.normal(66, 16, N),
    20,
    100
)

teamwork_score = np.clip(
    np.random.normal(70, 14, N),
    25,
    100
)

leadership_score = np.clip(
    np.random.normal(62, 18, N),
    15,
    100
)

# -----------------------------
# EXPERIENCE
# -----------------------------

internship_count = np.random.poisson(0.8, N)
internship_count = np.clip(internship_count, 0, 4)

internship_months = np.where(
    internship_count > 0,
    np.random.randint(1, 13, N),
    0
)

work_experience_months = np.where(
    np.random.random(N) < 0.12,
    np.random.randint(1, 25, N),
    0
)

industry_projects = np.random.poisson(1.2, N)
industry_projects = np.clip(industry_projects, 0, 5)

personal_projects = np.random.poisson(2.5, N)
personal_projects = np.clip(personal_projects, 0, 8)

certification_count = np.random.poisson(2, N)
certification_count = np.clip(certification_count, 0, 10)

# -----------------------------
# PROJECT QUALITY
# -----------------------------

project_quality_score = np.clip(
    (
        coding_score * 0.25
        + python_score * 0.15
        + sql_score * 0.15
        + data_visualization_score * 0.15
        + communication_score * 0.10
        + internship_count * 4
        + personal_projects * 2
    ),
    0,
    100
)

# -----------------------------
# CAREER PREFERENCES
# -----------------------------

roles = [
    "Data Analyst",
    "Data Scientist",
    "Business Analyst",
    "BI Analyst",
    "Software Developer",
    "ML Engineer"
]

preferred_role = np.random.choice(roles, N)

domains = [
    "Data Analytics",
    "Data Science",
    "Business Intelligence",
    "Software Development",
    "Machine Learning"
]

preferred_domain = np.random.choice(domains, N)

preferred_location = np.random.choice(
    cities,
    N
)

remote_preference = np.random.choice(
    ["Yes", "No"],
    N,
    p=[0.55, 0.45]
)

higher_studies_interest = np.random.choice(
    ["Yes", "No"],
    N,
    p=[0.25, 0.75]
)

# -----------------------------
# DERIVED INDICES
# -----------------------------

academic_index = (
    tenth_percentage * 0.20
    + twelfth_percentage * 0.20
    + cgpa * 10 * 0.45
    + attendance_percentage * 0.15
)

skill_index = (
    python_score
    + sql_score
    + excel_score
    + powerbi_score
    + statistics_score
    + ml_score
    + data_visualization_score
    + coding_score
) / 8

experience_index = np.clip(
    internship_count * 15
    + internship_months * 2
    + industry_projects * 10
    + personal_projects * 4
    + certification_count * 2,
    0,
    100
)

communication_index = (
    communication_score * 0.35
    + presentation_score * 0.25
    + teamwork_score * 0.20
    + leadership_score * 0.20
)

employability_index = (
    academic_index * 0.25
    + skill_index * 0.30
    + experience_index * 0.20
    + communication_index * 0.15
    + aptitude_score * 0.10
)

# -----------------------------
# PLACEMENT PROBABILITY
# -----------------------------

logit = (
    -7
    + 0.045 * academic_index
    + 0.035 * skill_index
    + 0.025 * experience_index
    + 0.020 * communication_index
    + 0.018 * aptitude_score
    - 0.30 * backlogs
)

placement_probability = 1 / (
    1 + np.exp(-logit)
)

placed = np.random.binomial(
    1,
    placement_probability
)

# -----------------------------
# PLACEMENT ROLE
# -----------------------------

placement_role = np.where(
    placed == 1,
    np.random.choice(
        roles,
        N
    ),
    "Not Placed"
)

# -----------------------------
# SALARY
# -----------------------------

package_lpa = np.where(
    placed == 1,
    np.clip(
        2.5
        + cgpa * 0.45
        + skill_index * 0.035
        + experience_index * 0.025
        + project_quality_score * 0.02
        + np.random.normal(0, 1.0, N),
        2.5,
        20
    ),
    0
)

# -----------------------------
# CREATE DATAFRAME
# -----------------------------

df = pd.DataFrame({
    "student_id": student_id,
    "age": age,
    "gender": gender,
    "city": city,
    "branch": branch,

    "tenth_percentage": tenth_percentage.round(2),
    "twelfth_percentage": twelfth_percentage.round(2),
    "cgpa": cgpa.round(2),
    "backlogs": backlogs,
    "attendance_percentage": attendance_percentage.round(2),

    "python_score": python_score.round(2),
    "sql_score": sql_score.round(2),
    "excel_score": excel_score.round(2),
    "powerbi_score": powerbi_score.round(2),
    "statistics_score": statistics_score.round(2),
    "ml_score": ml_score.round(2),
    "java_score": java_score.round(2),
    "web_dev_score": web_dev_score.round(2),
    "data_visualization_score": data_visualization_score.round(2),
    "coding_score": coding_score.round(2),

    "communication_score": communication_score.round(2),
    "aptitude_score": aptitude_score.round(2),
    "logical_reasoning_score": logical_reasoning_score.round(2),
    "presentation_score": presentation_score.round(2),
    "teamwork_score": teamwork_score.round(2),
    "leadership_score": leadership_score.round(2),

    "internship_count": internship_count,
    "internship_months": internship_months,
    "work_experience_months": work_experience_months,
    "industry_projects": industry_projects,
    "personal_projects": personal_projects,
    "certification_count": certification_count,
    "project_quality_score": project_quality_score.round(2),

    "preferred_role": preferred_role,
    "preferred_domain": preferred_domain,
    "preferred_location": preferred_location,
    "remote_preference": remote_preference,
    "higher_studies_interest": higher_studies_interest,

    "academic_index": academic_index.round(2),
    "skill_index": skill_index.round(2),
    "experience_index": experience_index.round(2),
    "communication_index": communication_index.round(2),
    "employability_index": employability_index.round(2),

    "placed": placed,
    "placement_role": placement_role,
    "package_lpa": package_lpa.round(2)
})

# -----------------------------
# SAVE DATASET
# -----------------------------

output_path = "data/raw/career_dataset.csv"

df.to_csv(
    output_path,
    index=False
)

print("Dataset created successfully!")
print(f"Shape: {df.shape}")
print(f"Saved to: {output_path}")

print("\nPlacement Distribution:")
print(df["placed"].value_counts())

print("\nFirst 5 rows:")
print(df.head())