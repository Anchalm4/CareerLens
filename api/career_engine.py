"""
CareerLens - Career Intelligence Engine 2.0

Generates:
1. Career role match scores
2. Top 3 career paths
3. Role-specific skill gaps
4. Career readiness score
5. Personalized learning roadmap
6. Explainable reasons for each role match

This module is intentionally independent from FastAPI so it can be
tested separately and reused by the API/frontend.
"""

from typing import Dict, Any, List


# ============================================================
# ROLE REQUIREMENTS
# ============================================================

ROLE_REQUIREMENTS = {

    "Data Analyst": {
        "python_score": 0.15,
        "sql_score": 0.25,
        "excel_score": 0.20,
        "powerbi_score": 0.20,
        "statistics_score": 0.10,
        "data_visualization_score": 0.10,
    },

    "Data Scientist": {
        "python_score": 0.25,
        "sql_score": 0.10,
        "statistics_score": 0.20,
        "ml_score": 0.25,
        "coding_score": 0.10,
        "data_visualization_score": 0.10,
    },

    "Business Analyst": {
        "sql_score": 0.15,
        "excel_score": 0.25,
        "powerbi_score": 0.15,
        "statistics_score": 0.10,
        "communication_score": 0.20,
        "presentation_score": 0.15,
    },

    "BI Analyst": {
        "sql_score": 0.25,
        "excel_score": 0.20,
        "powerbi_score": 0.25,
        "data_visualization_score": 0.15,
        "statistics_score": 0.10,
        "communication_score": 0.05,
    },

    "Software Developer": {
        "python_score": 0.15,
        "java_score": 0.25,
        "coding_score": 0.30,
        "web_dev_score": 0.15,
        "logical_reasoning_score": 0.15,
    },

    "ML Engineer": {
        "python_score": 0.25,
        "ml_score": 0.30,
        "coding_score": 0.20,
        "statistics_score": 0.10,
        "sql_score": 0.10,
        "logical_reasoning_score": 0.05,
    },
}


# ============================================================
# DISPLAY NAMES
# ============================================================

SKILL_NAMES = {

    "python_score": "Python",
    "sql_score": "SQL",
    "excel_score": "Excel",
    "powerbi_score": "Power BI",
    "statistics_score": "Statistics",
    "ml_score": "Machine Learning",
    "java_score": "Java",
    "web_dev_score": "Web Development",
    "data_visualization_score": "Data Visualization",
    "coding_score": "Programming",
    "communication_score": "Communication",
    "aptitude_score": "Aptitude",
    "logical_reasoning_score": "Problem Solving",
    "presentation_score": "Presentation",
    "teamwork_score": "Teamwork",
    "leadership_score": "Leadership",
}


# ============================================================
# LEARNING RESOURCES
# ============================================================

LEARNING_RESOURCES = {

    "python_score": {
        "name": "Python",
        "resource": "Python for Data Analytics",
        "milestone": "Build 2 Python data-analysis projects",
    },

    "sql_score": {
        "name": "SQL",
        "resource": "Advanced SQL",
        "milestone": "Solve 50 SQL problems and build analytical queries",
    },

    "excel_score": {
        "name": "Excel",
        "resource": "Advanced Excel",
        "milestone": "Build an interactive Excel analytics dashboard",
    },

    "powerbi_score": {
        "name": "Power BI",
        "resource": "Power BI & DAX",
        "milestone": "Build 2 interactive Power BI dashboards",
    },

    "statistics_score": {
        "name": "Statistics",
        "resource": "Statistics for Data Analytics",
        "milestone": "Practice descriptive and inferential statistics",
    },

    "ml_score": {
        "name": "Machine Learning",
        "resource": "Machine Learning",
        "milestone": "Build and explain 2 ML projects",
    },

    "java_score": {
        "name": "Java",
        "resource": "Core Java & OOP",
        "milestone": "Build one Java application",
    },

    "web_dev_score": {
        "name": "Web Development",
        "resource": "HTML, CSS, JavaScript & React",
        "milestone": "Build one production-style web project",
    },

    "data_visualization_score": {
        "name": "Data Visualization",
        "resource": "Data Visualization",
        "milestone": "Create 3 polished analytical dashboards",
    },

    "coding_score": {
        "name": "Programming",
        "resource": "Data Structures & Algorithms",
        "milestone": "Solve 100 structured coding problems",
    },

    "communication_score": {
        "name": "Communication",
        "resource": "Business Communication",
        "milestone": "Practice 10 mock interview sessions",
    },

    "presentation_score": {
        "name": "Presentation",
        "resource": "Presentation & Storytelling",
        "milestone": "Present 3 technical projects",
    },

    "logical_reasoning_score": {
        "name": "Problem Solving",
        "resource": "Logical Reasoning & Problem Solving",
        "milestone": "Practice 50 reasoning problems",
    },
}


# ============================================================
# HELPERS
# ============================================================

def safe_score(student_data: Dict[str, Any], skill: str) -> float:
    """Return a clean 0-100 score."""
    try:
        value = float(student_data.get(skill, 0) or 0)
    except (TypeError, ValueError):
        value = 0.0

    return max(0.0, min(100.0, value))


def skill_status(score: float) -> str:
    if score >= 75:
        return "Strong"
    if score >= 50:
        return "Needs Improvement"
    return "Skill Gap"


def readiness_label(score: float) -> str:
    if score >= 80:
        return "Career Ready"
    if score >= 65:
        return "Nearly Ready"
    if score >= 50:
        return "Developing"
    return "Early Stage"


def estimate_weeks(gap: float, importance: float) -> int:
    """
    Estimate learning time from the size of the gap and
    the role importance of the skill.
    """
    if gap <= 0:
        return 0

    weeks = round((gap / 12) + (importance * 2))

    return max(1, min(12, weeks))


# ============================================================
# ROLE MATCHING
# ============================================================

def calculate_role_match(
    student_data: Dict[str, Any],
    requirements: Dict[str, float],
) -> float:

    total = 0.0

    for skill, weight in requirements.items():

        score = safe_score(
            student_data,
            skill,
        )

        total += (
            score / 100.0
        ) * weight

    return round(total * 100, 2)


# ============================================================
# ROLE EXPLANATION
# ============================================================

def build_role_explanation(
    student_data: Dict[str, Any],
    requirements: Dict[str, float],
) -> Dict[str, List[Dict[str, Any]]]:

    strengths = []
    gaps = []

    for skill, weight in requirements.items():

        score = safe_score(
            student_data,
            skill,
        )

        item = {
            "skill": SKILL_NAMES.get(
                skill,
                skill.replace("_score", "").replace("_", " ").title(),
            ),
            "feature": skill,
            "score": round(score, 2),
            "importance": round(weight, 2),
        }

        if score >= 75:
            strengths.append(item)

        elif score < 60:
            gap = max(0, 100 - score)

            gaps.append({
                **item,
                "gap": round(gap, 2),
                "priority": round(
                    gap * weight,
                    2,
                ),
            })

    strengths.sort(
        key=lambda x: x["importance"],
        reverse=True,
    )

    gaps.sort(
        key=lambda x: x["priority"],
        reverse=True,
    )

    return {
        "strengths": strengths[:3],
        "gaps": gaps[:3],
    }


# ============================================================
# SKILL GAP ENGINE
# ============================================================

def build_skill_gaps(
    student_data: Dict[str, Any],
    requirements: Dict[str, float],
) -> List[Dict[str, Any]]:

    results = []

    for skill, weight in requirements.items():

        score = safe_score(
            student_data,
            skill,
        )

        gap = max(0.0, 100.0 - score)

        priority = gap * weight

        results.append({

            "skill": skill,

            "skill_name": SKILL_NAMES.get(
                skill,
                skill.replace("_score", "").replace("_", " ").title(),
            ),

            "score": round(score, 2),

            "gap": round(gap, 2),

            "status": skill_status(score),

            "importance": round(weight, 2),

            "priority": round(priority, 2),
        })

    results.sort(
        key=lambda item: item["priority"],
        reverse=True,
    )

    return results


# ============================================================
# CAREER READINESS
# ============================================================

def calculate_readiness(
    student_data: Dict[str, Any],
    requirements: Dict[str, float],
) -> float:

    return calculate_role_match(
        student_data,
        requirements,
    )


# ============================================================
# PERSONALIZED ROADMAP
# ============================================================

def build_roadmap(
    skill_gaps: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:

    roadmap = []

    phase = 1

    for gap in skill_gaps:

        if gap["score"] >= 75:
            continue

        resource = LEARNING_RESOURCES.get(
            gap["skill"],
            {
                "name": gap["skill_name"],
                "resource": f"Improve {gap['skill_name']}",
                "milestone": f"Practice {gap['skill_name']} through projects",
            },
        )

        weeks = estimate_weeks(
            gap["gap"],
            gap["importance"],
        )

        roadmap.append({

            "phase": phase,

            "skill": gap["skill_name"],

            "feature": gap["skill"],

            "current_score": gap["score"],

            "target_score": 75,

            "gap": gap["gap"],

            "priority": gap["priority"],

            "estimated_weeks": weeks,

            "learning_resource":
                resource["resource"],

            "milestone":
                resource["milestone"],
        })

        phase += 1

        # Keep roadmap focused.
        if phase > 5:
            break

    return roadmap


# ============================================================
# MAIN CAREER INTELLIGENCE ENGINE
# ============================================================

def generate_career_intelligence(
    student_data: Dict[str, Any],
) -> Dict[str, Any]:

    role_results = []

    for role, requirements in ROLE_REQUIREMENTS.items():

        match_score = calculate_role_match(
            student_data,
            requirements,
        )

        explanation = build_role_explanation(
            student_data,
            requirements,
        )

        role_results.append({

            "role": role,

            "match_score": match_score,

            "strengths":
                explanation["strengths"],

            "gaps":
                explanation["gaps"],
        })


    # Highest matching role first.
    role_results.sort(
        key=lambda item: item["match_score"],
        reverse=True,
    )


    recommended_role = role_results[0]

    recommended_requirements = ROLE_REQUIREMENTS[
        recommended_role["role"]
    ]


    skill_gaps = build_skill_gaps(
        student_data,
        recommended_requirements,
    )


    readiness_score = calculate_readiness(
        student_data,
        recommended_requirements,
    )


    roadmap = build_roadmap(
        skill_gaps,
    )


    # --------------------------------------------------------
    # Career direction message
    # --------------------------------------------------------

    if readiness_score >= 80:

        direction_message = (
            f"Your profile is strongly aligned with "
            f"{recommended_role['role']}. Focus on interview "
            f"readiness, portfolio quality and real-world projects."
        )

    elif readiness_score >= 65:

        direction_message = (
            f"You have a solid foundation for "
            f"{recommended_role['role']}. Close the remaining "
            f"skill gaps and strengthen your project portfolio."
        )

    else:

        direction_message = (
            f"Your profile is developing toward "
            f"{recommended_role['role']}. Prioritize the roadmap "
            f"skills before intensive interview preparation."
        )


    return {

        "recommended_role":
            recommended_role["role"],

        "match_score":
            recommended_role["match_score"],

        "readiness_score":
            readiness_score,

        "readiness_label":
            readiness_label(readiness_score),

        "direction_message":
            direction_message,

        "top_roles":
            role_results[:3],

        "skill_gaps":
            skill_gaps,

        "roadmap":
            roadmap,

        "engine_version":
            "CareerLens Career Intelligence Engine 2.0",

        "message":
            "Career intelligence generated successfully",
    }
