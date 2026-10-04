import joblib
import pandas as pd
import shap
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = (
    BASE_DIR
    / "models"
    / "placement_xgb_tuned_pipeline.pkl"
)


# ============================================================
# LOAD MODEL
# ============================================================

placement_pipeline = joblib.load(MODEL_PATH)

preprocessor = placement_pipeline.named_steps["preprocessor"]
model = placement_pipeline.named_steps["model"]


# ============================================================
# EXPLAIN STUDENT
# ============================================================

def explain_student(student_data: dict):

    student = dict(student_data)

    # --------------------------------------------------------
    # Complete model feature set
    # --------------------------------------------------------

    required_features = list(
        placement_pipeline.feature_names_in_
    )

    # --------------------------------------------------------
    # Default values for features not yet stored in MySQL
    #
    # These are baseline assumptions for the current demo
    # database. Later we can store these fields directly.
    # --------------------------------------------------------

    defaults = {

        # Technical skills
        "python_score": 0,
        "sql_score": 0,
        "excel_score": 0,
        "powerbi_score": 0,
        "statistics_score": 0,
        "ml_score": 0,
        "java_score": 0,
        "web_dev_score": 0,
        "data_visualization_score": 0,
        "coding_score": 0,

        # Soft skills
        "communication_score": 0,
        "aptitude_score": 0,
        "logical_reasoning_score": 0,
        "presentation_score": 0,
        "teamwork_score": 0,
        "leadership_score": 0,

        # Experience
        "internship_count": 0,
        "internship_months": 0,
        "work_experience_months": 0,
        "industry_projects": 0,
        "personal_projects": 0,
        "certification_count": 0,
        "project_quality_score": 0,

        # Derived indices
        "academic_index": 0,
        "skill_index": 0,
        "experience_index": 0,
        "communication_index": 0,
        "employability_index": 0
    }


    # --------------------------------------------------------
    # Merge defaults with database values
    # --------------------------------------------------------

    features = {}

    for feature in required_features:

        if feature in student:

            features[feature] = student[feature]

        elif feature in defaults:

            features[feature] = defaults[feature]

        else:

            # Safe numerical baseline
            features[feature] = 0


    # --------------------------------------------------------
    # Convert available database values
    # --------------------------------------------------------

    # CGPA -> academic index
    cgpa = float(student.get("cgpa", 0) or 0)

    tenth = float(
        student.get("tenth_percentage", 0) or 0
    )

    twelfth = float(
        student.get("twelfth_percentage", 0) or 0
    )

    attendance = float(
        student.get(
            "attendance_percentage",
            0
        ) or 0
    )

    backlogs = float(
        student.get("backlogs", 0) or 0
    )


    # --------------------------------------------------------
    # Academic index
    # --------------------------------------------------------

    if "academic_index" in required_features:

        academic_index = (
            (cgpa / 10) * 50
            + (tenth / 100) * 20
            + (twelfth / 100) * 20
            + (attendance / 100) * 10
        )

        academic_index -= backlogs * 3

        features["academic_index"] = max(
            0,
            min(100, academic_index)
        )


    # --------------------------------------------------------
    # Skill index
    # --------------------------------------------------------

    skill_columns = [
        "python_score",
        "sql_score",
        "excel_score",
        "powerbi_score",
        "statistics_score",
        "ml_score",
        "java_score",
        "web_dev_score",
        "data_visualization_score",
        "coding_score"
    ]

    available_skill_values = [
        float(features.get(col, 0) or 0)
        for col in skill_columns
        if col in required_features
    ]

    if (
        "skill_index" in required_features
        and available_skill_values
    ):

        features["skill_index"] = (
            sum(available_skill_values)
            / len(available_skill_values)
        )


    # --------------------------------------------------------
    # Communication index
    # --------------------------------------------------------

    communication_values = [
        float(features.get("communication_score", 0) or 0),
        float(features.get("presentation_score", 0) or 0),
        float(features.get("teamwork_score", 0) or 0),
        float(features.get("leadership_score", 0) or 0)
    ]

    if "communication_index" in required_features:

        features["communication_index"] = (
            sum(communication_values)
            / len(communication_values)
        )


    # --------------------------------------------------------
    # Experience index
    # --------------------------------------------------------

    experience_values = [
        float(features.get("internship_count", 0) or 0) * 10,
        float(features.get("internship_months", 0) or 0) * 2,
        float(features.get("work_experience_months", 0) or 0),
        float(features.get("industry_projects", 0) or 0) * 8,
        float(features.get("personal_projects", 0) or 0) * 5,
        float(features.get("certification_count", 0) or 0) * 5,
        float(features.get("project_quality_score", 0) or 0)
    ]

    if "experience_index" in required_features:

        features["experience_index"] = max(
            0,
            min(
                100,
                sum(experience_values)
                / len(experience_values)
            )
        )


    # --------------------------------------------------------
    # Employability index
    # --------------------------------------------------------

    if "employability_index" in required_features:

        academic = float(
            features.get("academic_index", 0)
        )

        skills = float(
            features.get("skill_index", 0)
        )

        experience = float(
            features.get("experience_index", 0)
        )

        communication = float(
            features.get("communication_index", 0)
        )

        features["employability_index"] = (
            academic * 0.25
            + skills * 0.35
            + experience * 0.20
            + communication * 0.20
        )


    # --------------------------------------------------------
    # Build DataFrame
    # --------------------------------------------------------

    student_df = pd.DataFrame(
        [features],
        columns=required_features
    )


    # --------------------------------------------------------
    # Convert numeric columns safely
    # --------------------------------------------------------

    for column in student_df.columns:

        if column not in preprocessor.transformers_[1][2]:

            student_df[column] = pd.to_numeric(
                student_df[column],
                errors="coerce"
            )


    student_df = student_df.fillna(0)


    # --------------------------------------------------------
    # Transform using SAME preprocessing as training
    # --------------------------------------------------------

    transformed_student = (
        preprocessor.transform(student_df)
    )

    if hasattr(
        transformed_student,
        "toarray"
    ):

        transformed_student = (
            transformed_student.toarray()
        )


    # --------------------------------------------------------
    # SHAP Tree Explainer
    # --------------------------------------------------------

    explainer = shap.TreeExplainer(model)

    shap_values = explainer.shap_values(
        transformed_student
    )


    # --------------------------------------------------------
    # Handle SHAP output
    # --------------------------------------------------------

    if isinstance(shap_values, list):

        values = shap_values[-1][0]

    else:

        values = shap_values[0]


    # --------------------------------------------------------
    # Feature names
    # --------------------------------------------------------

    feature_names = (
        preprocessor
        .get_feature_names_out()
    )


    # --------------------------------------------------------
    # Base value
    # --------------------------------------------------------

    expected_value = (
        explainer.expected_value
    )

    if hasattr(
        expected_value,
        "__len__"
    ) and not isinstance(
        expected_value,
        str
    ):

        base_value = float(
            expected_value[-1]
        )

    else:

        base_value = float(
            expected_value
        )


    # --------------------------------------------------------
    # Build explanations
    # --------------------------------------------------------

    explanations = []

    for feature_name, contribution in zip(
        feature_names,
        values
    ):

        contribution = float(
            contribution
        )

        clean_name = feature_name

        if clean_name.startswith(
            "num__"
        ):

            clean_name = (
                clean_name
                .replace(
                    "num__",
                    ""
                )
            )

        elif clean_name.startswith(
            "cat__"
        ):

            clean_name = (
                clean_name
                .replace(
                    "cat__",
                    ""
                )
            )

        clean_name = (
            clean_name
            .replace("_", " ")
            .title()
        )

        explanations.append({

            "feature": clean_name,

            "raw_feature": feature_name,

            "shap_value": round(
                contribution,
                4
            ),

            "contribution": round(
                contribution,
                4
            ),

            "impact": (
                "positive"
                if contribution >= 0
                else "negative"
            ),

            "absolute_impact": round(
                abs(contribution),
                4
            )
        })


    # --------------------------------------------------------
    # Sort by importance
    # --------------------------------------------------------

    explanations.sort(
        key=lambda item:
        item["absolute_impact"],
        reverse=True
    )


    top_features = explanations[:10]


    positive_factors = [
        item
        for item in top_features
        if item["shap_value"] > 0
    ]


    negative_factors = [
        item
        for item in top_features
        if item["shap_value"] < 0
    ]


    # --------------------------------------------------------
    # Final response
    # --------------------------------------------------------

    return {

        "base_value": round(
            base_value,
            4
        ),

        "top_features":
            top_features,

        "positive_factors":
            positive_factors,

        "negative_factors":
            negative_factors,

        "message":
            "SHAP explanation generated successfully"
    }