import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Brain,
  Target,
  TrendingUp,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  BarChart3,
  GraduationCap,
  Zap,
  Activity,
  Orbit,
  FileText,
  Printer,
  CheckCircle2,
  Map,
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  LogOut,
  ShieldCheck,
  ChevronDown,
  UserCircle2,
  Settings2,
  Pencil,
  Save,
  X,
  Upload,
  AlertCircle,
  MessageCircleQuestion,
  RefreshCw,
  Lightbulb,
  Check,
} from "lucide-react";

import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, Text } from "@react-three/drei";

import "./App.css";



/* =====================================================
   STEP 17D — LOGIN / REGISTER AUTHENTICATION UI
===================================================== */

function Field({ form, updateField, label, field, type = "text", min, max, step, placeholder, wide = false }) {
  return (
    <label className={`auth-field ${wide ? "auth-field-wide" : ""}`}>
      <span>{label}</span>
      <input
        type={type}
        min={min}
        max={max}
        step={step}
        required
        value={form[field]}
        placeholder={placeholder}
        onChange={(event) => updateField(field, event.target.value)}
      />
    </label>
  );
}

function SelectField({ form, updateField, label, field, options, wide = false }) {
  return (
    <label className={`auth-field ${wide ? "auth-field-wide" : ""}`}>
      <span>{label}</span>
      <select value={form[field]} onChange={(event) => updateField(field, event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function AuthScreen({ onAuthenticated }) {

  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [registerStep, setRegisterStep] = useState(1);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    age: "21",
    gender: "Female",
    city: "Bhopal",
    state: "Madhya Pradesh",
    college: "",
    branch: "CSE",
    graduation_year: "2027",
    semester: "7",
    tenth_percentage: "85",
    twelfth_percentage: "85",
    cgpa: "8.0",
    backlogs: "0",
    attendance_percentage: "85",
    python_score: "60",
    sql_score: "60",
    excel_score: "60",
    powerbi_score: "60",
    statistics_score: "55",
    ml_score: "50",
    java_score: "50",
    web_dev_score: "50",
    data_visualization_score: "55",
    coding_score: "55",
    communication_score: "65",
    aptitude_score: "60",
    logical_reasoning_score: "60",
    presentation_score: "60",
    teamwork_score: "70",
    leadership_score: "55",
    internship_count: "0",
    internship_months: "0",
    work_experience_months: "0",
    industry_projects: "0",
    personal_projects: "1",
    certification_count: "0",
    project_quality_score: "50",
    github_commits: "0",
    github_engagement_index: "0",
    coding_questions_solved: "0",
    preferred_role: "Data Analyst",
    preferred_domain: "Data Analytics",
    preferred_location: "Bhopal",
    remote_preference: "Hybrid",
    higher_studies_interest: "No"
  });

  const updateField = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const numericFields = [
    "age", "tenth_percentage", "twelfth_percentage", "cgpa", "backlogs",
    "attendance_percentage", "python_score", "sql_score", "excel_score",
    "powerbi_score", "statistics_score", "ml_score", "java_score",
    "web_dev_score", "data_visualization_score", "coding_score",
    "communication_score", "aptitude_score", "logical_reasoning_score",
    "presentation_score", "teamwork_score", "leadership_score",
    "internship_count", "internship_months", "work_experience_months",
    "industry_projects", "personal_projects", "certification_count",
    "project_quality_score", "github_commits", "github_engagement_index",
    "coding_questions_solved"
  ];

  const buildRegistrationPayload = () => {
    const payload = { ...form };
    numericFields.forEach((field) => {
      payload[field] = Number(payload[field] || 0);
    });
    payload.email = payload.email.trim().toLowerCase();
    payload.city = payload.city.trim();
    payload.state = payload.state.trim();
    payload.college = payload.college.trim();
    return payload;
  };

  const validateStep = () => {
    setError("");

    if (registerStep === 1) {
      if (!form.full_name.trim()) return "Please enter your full name.";
      if (!form.email.trim()) return "Please enter your email address.";
      if (!form.password || form.password.length < 8) return "Password must contain at least 8 characters.";
      if (!form.phone.trim()) return "Please enter your phone number.";
      if (form.phone.replace(/\D/g, "").length < 10) return "Please enter a valid 10-digit phone number.";
    }

    if (registerStep === 2) {
      if (!form.college.trim()) return "Please enter your college/university.";
      if (Number(form.cgpa) < 0 || Number(form.cgpa) > 10) return "CGPA must be between 0 and 10.";
      if (Number(form.tenth_percentage) < 0 || Number(form.tenth_percentage) > 100) return "10th percentage must be between 0 and 100.";
      if (Number(form.twelfth_percentage) < 0 || Number(form.twelfth_percentage) > 100) return "12th percentage must be between 0 and 100.";
    }

    if (registerStep === 3) {
      const scores = [
        "python_score", "sql_score", "excel_score", "powerbi_score",
        "statistics_score", "ml_score", "java_score", "web_dev_score",
        "data_visualization_score", "coding_score", "communication_score",
        "aptitude_score", "logical_reasoning_score", "presentation_score",
        "teamwork_score", "leadership_score"
      ];
      const invalid = scores.find((field) => Number(form[field]) < 0 || Number(form[field]) > 100);
      if (invalid) return "Skill scores must be between 0 and 100.";
    }

    return "";
  };

  const nextRegisterStep = () => {
    const validationMessage = validateStep();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setRegisterStep((value) => Math.min(5, value + 1));
  };

  const previousRegisterStep = () => {
    setError("");
    setRegisterStep((value) => Math.max(1, value - 1));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (mode === "register" && registerStep < 5) {
      nextRegisterStep();
      return;
    }

    if (mode === "register") {
      const validationMessage = validateStep();
      if (validationMessage) {
        setError(validationMessage);
        return;
      }
    }

    setSubmitting(true);

    try {
      if (mode === "login") {
        const response = await axios.post(
          "http://127.0.0.1:8000/auth/login",
          { email: form.email.trim(), password: form.password }
        );

        localStorage.setItem("careerlens_access_token", response.data.access_token);
        localStorage.setItem("careerlens_student_id", String(response.data.student_id));
        onAuthenticated(response.data.student_id);
        return;
      }

      const response = await axios.post(
        "http://127.0.0.1:8000/auth/register",
        buildRegistrationPayload()
      );

      setMessage(
        `Account created successfully. Your Student ID is #${response.data.student_id}.`
      );
      setMode("login");
      setRegisterStep(1);
      setForm((previous) => ({ ...previous, password: "" }));

    } catch (requestError) {
      console.error("CareerLens authentication error:", requestError);
      const detail = requestError?.response?.data?.detail;

      if (typeof detail === "string") {
        setError(detail);
      } else if (detail?.message) {
        setError(detail.message);
      } else if (!requestError?.response) {
        setError("CareerLens backend is not reachable. Start FastAPI on port 8000.");
      } else {
        setError(`Request failed with status ${requestError.response.status}.`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isRegister = mode === "register";
  const progress = ((registerStep - 1) / 4) * 100;



  return (
    <div className="auth-screen">
      <div className="auth-background-orb auth-orb-one" />
      <div className="auth-background-orb auth-orb-two" />

      <motion.div
        className="auth-shell auth-shell-expanded"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65 }}
      >
        <div className="auth-brand">
          <div className="auth-brand-mark"><Brain size={25} /></div>
          <div>
            <strong>Career<span>Lens</span></strong>
            <small>AI Career Intelligence Platform</small>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-heading">
            <div className="auth-kicker">{isRegister ? "BUILD YOUR CAREER IDENTITY" : "WELCOME BACK"}</div>
            <h1>
              {isRegister ? <>Create your <span>career profile.</span></> : <>Decode your <span>career potential.</span></>}
            </h1>
            <p>
              {isRegister
                ? "Give CareerLens enough context to generate meaningful, student-specific AI insights."
                : "Sign in to continue to your personalized CareerLens dashboard."}
            </p>
          </div>

          <div className="auth-mode-switch">
            <button type="button" className={!isRegister ? "active" : ""} onClick={() => { setMode("login"); setError(""); setMessage(""); }}>
              <LogIn size={15} /> Login
            </button>
            <button type="button" className={isRegister ? "active" : ""} onClick={() => { setMode("register"); setError(""); setMessage(""); setRegisterStep(1); }}>
              <UserPlus size={15} /> Register
            </button>
          </div>

          {isRegister && (
            <div className="career-profile-progress">
              <div className="career-profile-progress-top">
                <strong>Profile setup</strong>
                <span>Step {registerStep} of 5</span>
              </div>
              <div className="career-profile-progress-track"><span style={{ width: `${Math.max(20, progress)}%` }} /></div>
              <div className="career-profile-step-labels">
                {['Identity', 'Academics', 'Skills', 'Experience', 'Review'].map((label, index) => (
                  <span className={registerStep >= index + 1 ? 'active' : ''} key={label}>{label}</span>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={submit}>
            <div className="auth-field">
              <span><Mail size={14} /> Email</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="auth-field">
              <span><Lock size={14} /> Password</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder="Minimum 8 characters"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {isRegister && registerStep === 1 && (
              <motion.div className="career-profile-step-grid" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}>
                <Field form={form} updateField={updateField} label="Full Name" field="full_name" placeholder="Your full name" wide />
                <Field form={form} updateField={updateField} label="Phone Number" field="phone" type="tel" placeholder="10-digit mobile number" />
                <Field form={form} updateField={updateField} label="Age" field="age" type="number" min="16" max="70" />
                <SelectField form={form} updateField={updateField} label="Gender" field="gender" options={['Female', 'Male', 'Other', 'Prefer not to say']} />
                <Field form={form} updateField={updateField} label="City" field="city" placeholder="e.g. Bhopal" />
                <Field form={form} updateField={updateField} label="State" field="state" placeholder="e.g. Madhya Pradesh" />
              </motion.div>
            )}

            {isRegister && registerStep === 2 && (
              <motion.div className="career-profile-step-grid" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}>
                <Field form={form} updateField={updateField} label="College / University" field="college" placeholder="Your institution" wide />
                <SelectField form={form} updateField={updateField} label="Branch" field="branch" options={['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'AI/DS', 'Other']} />
                <Field form={form} updateField={updateField} label="Graduation Year" field="graduation_year" type="number" min="2020" max="2035" />
                <Field form={form} updateField={updateField} label="Current Semester" field="semester" type="number" min="1" max="12" />
                <Field form={form} updateField={updateField} label="10th Percentage" field="tenth_percentage" type="number" min="0" max="100" step="0.1" />
                <Field form={form} updateField={updateField} label="12th Percentage" field="twelfth_percentage" type="number" min="0" max="100" step="0.1" />
                <Field form={form} updateField={updateField} label="CGPA" field="cgpa" type="number" min="0" max="10" step="0.01" />
                <Field form={form} updateField={updateField} label="Backlogs" field="backlogs" type="number" min="0" />
                <Field form={form} updateField={updateField} label="Attendance %" field="attendance_percentage" type="number" min="0" max="100" step="0.1" wide />
              </motion.div>
            )}

            {isRegister && registerStep === 3 && (
              <motion.div className="career-profile-step-grid skill-entry-grid" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}>
                {[
                  ['Python','python_score'], ['SQL','sql_score'], ['Excel','excel_score'], ['Power BI','powerbi_score'],
                  ['Statistics','statistics_score'], ['Machine Learning','ml_score'], ['Java','java_score'], ['Web Development','web_dev_score'],
                  ['Data Visualization','data_visualization_score'], ['Programming / Coding','coding_score'],
                  ['Communication','communication_score'], ['Aptitude','aptitude_score'], ['Logical Reasoning','logical_reasoning_score'],
                  ['Presentation','presentation_score'], ['Teamwork','teamwork_score'], ['Leadership','leadership_score']
                ].map(([label, field]) => (
                  <label className="skill-score-field" key={field}>
                    <span><strong>{label}</strong><b>{form[field]}</b></span>
                    <input type="range" min="0" max="100" value={form[field]} onChange={(event) => updateField(field, event.target.value)} />
                  </label>
                ))}
              </motion.div>
            )}

            {isRegister && registerStep === 4 && (
              <motion.div className="career-profile-step-grid" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }}>
                <Field form={form} updateField={updateField} label="Internship Count" field="internship_count" type="number" min="0" />
                <Field form={form} updateField={updateField} label="Internship Months" field="internship_months" type="number" min="0" />
                <Field form={form} updateField={updateField} label="Work Experience (Months)" field="work_experience_months" type="number" min="0" />
                <Field form={form} updateField={updateField} label="Industry Projects" field="industry_projects" type="number" min="0" />
                <Field form={form} updateField={updateField} label="Personal Projects" field="personal_projects" type="number" min="0" />
                <Field form={form} updateField={updateField} label="Certifications" field="certification_count" type="number" min="0" />
                <Field form={form} updateField={updateField} label="Project Quality Score" field="project_quality_score" type="number" min="0" max="100" />
                <Field form={form} updateField={updateField} label="GitHub Commits" field="github_commits" type="number" min="0" />
                <Field form={form} updateField={updateField} label="GitHub Engagement Index" field="github_engagement_index" type="number" min="0" max="100" />
                <Field form={form} updateField={updateField} label="Coding Questions Solved" field="coding_questions_solved" type="number" min="0" />
                <SelectField form={form} updateField={updateField} label="Preferred Role" field="preferred_role" options={['Data Analyst','Data Scientist','Business Analyst','BI Analyst','Software Developer','ML Engineer']} />
                <SelectField form={form} updateField={updateField} label="Preferred Domain" field="preferred_domain" options={['Data Analytics','Data Science','Business Intelligence','Software Development','Machine Learning','Cloud / Data Engineering']} />
                <SelectField form={form} updateField={updateField} label="Preferred Location" field="preferred_location" options={['Bhopal','Indore','Pune','Bengaluru','Hyderabad','Delhi NCR','Mumbai','Any Location']} />
                <SelectField form={form} updateField={updateField} label="Work Preference" field="remote_preference" options={['On-site','Hybrid','Remote','Flexible']} />
                <SelectField form={form} updateField={updateField} label="Higher Studies Interest" field="higher_studies_interest" options={['No','Maybe','Yes']} wide />
              </motion.div>
            )}

            {isRegister && registerStep === 5 && (
              <motion.div className="career-profile-review" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="career-profile-review-hero">
                  <div className="career-profile-review-icon"><CheckCircle2 size={24} /></div>
                  <div><strong>Profile ready for CareerLens</strong><span>Your information will power your personalized AI analysis.</span></div>
                </div>
                <div className="career-profile-review-grid">
                  <div><small>Student</small><strong>{form.full_name || '—'}</strong></div>
                  <div><small>Academic</small><strong>{form.branch} • {form.cgpa} CGPA</strong></div>
                  <div><small>Career Goal</small><strong>{form.preferred_role}</strong></div>
                  <div><small>Projects</small><strong>{form.personal_projects} personal • {form.industry_projects} industry</strong></div>
                  <div><small>Internship</small><strong>{form.internship_count} internship(s)</strong></div>
                  <div><small>Location</small><strong>{form.preferred_location}</strong></div>
                </div>
                <p className="career-profile-note">You can refine these details later. CareerLens will use the complete profile to personalize placement, salary, role, skill-gap and learning recommendations.</p>
              </motion.div>
            )}

            {message && <div className="auth-message success"><CheckCircle2 size={16} />{message}</div>}
            {error && <div className="auth-message error">{error}</div>}

            <div className={`career-profile-actions ${isRegister ? 'register-actions' : ''}`}>
              {isRegister && registerStep > 1 && (
                <button type="button" className="career-secondary-button" onClick={previousRegisterStep} disabled={submitting}>← Back</button>
              )}
              <button type="submit" className="auth-submit career-main-submit" disabled={submitting}>
                {submitting ? "Creating profile..." : isRegister ? (registerStep < 5 ? "Continue" : "Create CareerLens Account") : "Enter CareerLens"}
                {!submitting && <ArrowRight size={17} />}
              </button>
            </div>
          </form>

          <div className="auth-security">
            <ShieldCheck size={15} />
            <span>Your password is securely hashed and never stored as plain text.</span>
          </div>
        </div>

        <div className="auth-footer">CareerLens • AI Career Intelligence & Placement Analytics</div>
      </motion.div>
    </div>
  );
}

/* =====================================================
   MAIN APP
===================================================== */

function App() {

  const [authenticated, setAuthenticated] = useState(
    Boolean(localStorage.getItem("careerlens_access_token"))
  );
  const [dashboardData, setDashboardData] = useState(null);
  const [shapData, setShapData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [studentId, setStudentId] = useState(
    localStorage.getItem("careerlens_student_id") || "10001"
  );
  const [shapLoading, setShapLoading] = useState(false);
  const [careerIntel, setCareerIntel] = useState(null);
  const [careerIntelLoading, setCareerIntelLoading] = useState(false);
  const [marketIntel, setMarketIntel] = useState(null);
  const [marketIntelLoading, setMarketIntelLoading] = useState(false);
  const [learningRoadmap, setLearningRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [salaryData, setSalaryData] = useState(null);
  const [salaryLoading, setSalaryLoading] = useState(false);

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [profileDetailsOpen, setProfileDetailsOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  if (!authenticated) {
    return (
      <AuthScreen
        onAuthenticated={(id) => {
          setStudentId(String(id));
          setAuthenticated(true);
        }}
      />
    );
  }

  const logout = () => {
    localStorage.removeItem("careerlens_access_token");
    localStorage.removeItem("careerlens_student_id");
    setDashboardData(null);
    setShapData(null);
    setCareerIntel(null);
    setMarketIntel(null);
    setLearningRoadmap(null);
    setSalaryData(null);
    setAuthenticated(false);
  };

  /* =====================================================
     LOAD DASHBOARD
  ===================================================== */

  const loadStudentDashboard = async () => {

    console.log("Analyze My Career clicked!");

    setLoading(true);

    try {

      const response = await axios.get(
        `http://127.0.0.1:8000/students/${studentId}/dashboard`
      );

      console.log(
        "CareerLens Dashboard Data:"
      );

      console.log(response.data);

      setDashboardData(response.data);

      // Load the real SHAP explanation separately so a SHAP failure
      // does not prevent the main dashboard from loading.
      setShapLoading(true);

      try {
        const shapResponse = await axios.get(
          `http://127.0.0.1:8000/students/${studentId}/shap-explanation`
        );

        console.log("CareerLens SHAP Data:");
        console.log(shapResponse.data);

        setShapData(shapResponse.data);
      } catch (shapError) {
        console.error("CareerLens SHAP Error:", shapError);
        setShapData(null);
      } finally {
        setShapLoading(false);
      }

      setCareerIntelLoading(true);

      try {
        const careerResponse = await axios.get(
          `http://127.0.0.1:8000/students/${studentId}/career-intelligence`
        );
        setCareerIntel(careerResponse.data);
      } catch (careerError) {
        console.error("Career Intelligence Error:", careerError);
        setCareerIntel(null);
      } finally {
        setCareerIntelLoading(false);
      }

      // Job Market Intelligence
      setMarketIntelLoading(true);

      try {
        const marketResponse = await axios.post(
          "http://127.0.0.1:8000/job-market-analysis",
          response.data?.skills || {}
        );

        console.log("CareerLens Job Market Intelligence:");
        console.log(marketResponse.data);

        setMarketIntel(marketResponse.data);
      } catch (marketError) {
        console.error(
          "Job Market Intelligence Error:",
          marketError
        );
        setMarketIntel(null);
      } finally {
        setMarketIntelLoading(false);
      }

      // Salary Intelligence
      setSalaryLoading(true);

      try {
        const salaryPayload = {
          ...(response.data?.student || {}),
          ...(response.data?.skills || {})
        };

        const salaryResponse = await axios.post(
          "http://127.0.0.1:8000/predict-salary",
          salaryPayload
        );

        console.log("CareerLens Salary Intelligence:");
        console.log(salaryResponse.data);

        setSalaryData(salaryResponse.data);
      } catch (salaryError) {
        console.error("Salary Prediction Error:", salaryError);
        setSalaryData(null);
      } finally {
        setSalaryLoading(false);
      }

      // Personalized Learning Roadmap
      setRoadmapLoading(true);

      try {
        const roadmapResponse = await axios.post(
          "http://127.0.0.1:8000/learning-roadmap",
          response.data?.skills || {}
        );

        console.log("CareerLens Personalized Learning Roadmap:");
        console.log(roadmapResponse.data);

        setLearningRoadmap(roadmapResponse.data);
      } catch (roadmapError) {
        console.error(
          "Learning Roadmap Error:",
          roadmapError
        );
        setLearningRoadmap(null);
      } finally {
        setRoadmapLoading(false);
      }

      setTimeout(() => {

        document
          .getElementById("dashboard")
          ?.scrollIntoView({
            behavior: "smooth",
          });

      }, 150);

    } catch (error) {

      console.error(
        "CareerLens API Error:",
        error
      );

      const status = error?.response?.status;
      const detail = error?.response?.data?.detail;

      let message = "Unable to load the student profile.";

      if (!error?.response) {
        message += "\n\nFastAPI is not reachable at http://127.0.0.1:8000.";
        message += "\nStart it with: uvicorn api.main:app --reload";
      } else if (status === 404) {
        message += `\n\nStudent #${studentId} was not found in the CareerLens database.`;
      } else {
        message += `\n\nAPI status: ${status}`;
        if (detail) {
          message += `\n${typeof detail === "string" ? detail : JSON.stringify(detail)}`;
        }
      }

      alert(message);

    } finally {

      setLoading(false);

    }
  };

  // Remove duplicate skill entries before rendering the dashboard/3D universe.
  const uniqueSkillGaps = dashboardData?.skill_gaps
    ? dashboardData.skill_gaps.filter(
        (skill, index, array) =>
          index === array.findIndex((item) => item.skill === skill.skill)
      )
    : [];

  // Profile header data is derived only from the currently authenticated
  // student's dashboard response. Keep safe fallbacks before the dashboard
  // has loaded so the navbar never crashes.
  const profileName =
    dashboardData?.student?.full_name ||
    dashboardData?.student?.name ||
    dashboardData?.student?.student_name ||
    `Student #${studentId}`;

  const profileEmail =
    dashboardData?.student?.email ||
    dashboardData?.student?.student_email ||
    "CareerLens student";

  const profileInitial =
    String(profileName)
      .replace(/[^A-Za-z]/g, "")
      .charAt(0)
      .toUpperCase() || "S";

  const openProfileDetails = () => {
    setProfileMenuOpen(false);
    setProfileDetailsOpen(true);
  };

  const openEditProfile = () => {
    setProfileMenuOpen(false);
    setEditProfileOpen(true);
  };

  return (

    <div className="app">


      {/* =================================================
          NAVBAR
      ================================================= */}

      <nav className="navbar">

        <div className="logo">

          <div className="logo-icon">
            <Brain size={22} />
          </div>

          <div className="logo-text">
            Career<span>Lens</span>
          </div>

        </div>


        <div className="nav-links">

          <a href="#features">
            Features
          </a>

          <a href="#intelligence">
            Intelligence
          </a>

          <a href="#dashboard">
            Dashboard
          </a>

          <a href="#about">
            About
          </a>


          <button
            className="nav-button"
            onClick={loadStudentDashboard}
          >

            Get Started

            <ArrowRight size={15} />

          </button>

        </div>

      
          <div className="profile-menu-wrap">

            <button
              type="button"
              className="profile-trigger"
              onClick={() => setProfileMenuOpen((value) => !value)}
              aria-expanded={profileMenuOpen}
            >
              <span className="profile-avatar">
                {profileInitial}
              </span>

              <span className="profile-trigger-copy">
                <strong>{profileName}</strong>
                <small>Student</small>
              </span>

              <ChevronDown
                size={15}
                className={profileMenuOpen ? "profile-chevron open" : "profile-chevron"}
              />
            </button>

            {profileMenuOpen && (
              <motion.div
                className="profile-dropdown"
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.16 }}
              >
                <div className="profile-dropdown-head">
                  <span className="profile-avatar large">
                    {profileInitial}
                  </span>
                  <div>
                    <strong>{profileName}</strong>
                    <small>{profileEmail}</small>
                  </div>
                </div>

                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={openProfileDetails}
                >
                  <UserCircle2 size={17} />
                  <span>
                    <strong>View Profile</strong>
                    <small>Academic & career details</small>
                  </span>
                </button>

                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={openEditProfile}
                >
                  <Pencil size={17} />
                  <span>
                    <strong>Edit Profile</strong>
                    <small>Update your career information</small>
                  </span>
                </button>

                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    document.getElementById("dashboard")?.scrollIntoView({
                      behavior: "smooth"
                    });
                  }}
                >
                  <Settings2 size={17} />
                  <span>
                    <strong>My Career Dashboard</strong>
                    <small>View your AI insights</small>
                  </span>
                </button>

                <div className="profile-dropdown-divider" />

                <button
                  type="button"
                  className="profile-dropdown-item danger"
                  onClick={logout}
                >
                  <LogOut size={17} />
                  <span>
                    <strong>Exit Profile</strong>
                    <small>Sign out of CareerLens</small>
                  </span>
                </button>
              </motion.div>
            )}

          </div>
</nav>



      {/* =================================================
          HERO
      ================================================= */}

      <section className="hero">

        <motion.div
          className="hero-content"

          initial={{
            opacity: 0,
            y: 30,
          }}

          animate={{
            opacity: 1,
            y: 0,
          }}

          transition={{
            duration: 0.8,
          }}
        >

          <div className="badge">

            <Sparkles size={15} />

            AI-POWERED CAREER INTELLIGENCE

          </div>


          <h1>

            Your Skills.
            <br />

            Your Future.
            <br />

            <span>Decoded.</span>

          </h1>


          <p>

            CareerLens combines Artificial Intelligence,
            Machine Learning, Explainable AI and Job Market
            Intelligence to transform your student profile
            into a personalized career roadmap.

          </p>


          <div className="student-access-card">

            <div className="student-access-header">
              <div className="student-access-icon">
                <GraduationCap size={18} />
              </div>
              <div>
                <span>PERSONALIZED ANALYSIS</span>
                <strong>Enter your Student ID</strong>
              </div>
            </div>

            <div className="student-access-controls">
              <input
                type="number"
                min="1"
                value={studentId}
                onChange={(event) => setStudentId(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !loading) {
                    loadStudentDashboard();
                  }
                }}
                placeholder="e.g. 10001"
                aria-label="Student ID"
              />

              <button
                type="button"
                className="student-access-button"
                onClick={loadStudentDashboard}
                disabled={loading || !studentId}
              >
                {loading ? "Analyzing..." : "Analyze"}
                <ArrowRight size={16} />
              </button>
            </div>

            {dashboardData?.student?.student_id && (
              <div className="student-access-success">
                <CheckCircle2 size={15} />
                Profile loaded: #{dashboardData.student.student_id}
              </div>
            )}

          </div>

          <div className="hero-buttons">

            <button
              className="primary-button"
              onClick={loadStudentDashboard}
              disabled={loading}
            >

              {loading
                ? "Analyzing..."
                : "Analyze My Career"}

              <ArrowRight size={18} />

            </button>


            <a
              href="#intelligence"
              className="secondary-button"
            >

              Explore Intelligence

            </a>

          </div>


          <div className="hero-stats">

            <div>

              <strong>AI</strong>

              <span>
                Placement Prediction
              </span>

            </div>


            <div>

              <strong>360°</strong>

              <span>
                Career Analysis
              </span>

            </div>


            <div>

              <strong>NLP</strong>

              <span>
                Job Intelligence
              </span>

            </div>

          </div>

        </motion.div>



        {/* =================================================
            HERO AI VISUAL
        ================================================= */}

        <motion.div
          className="ai-visual"

          initial={{
            opacity: 0,
            scale: 0.8,
          }}

          animate={{
            opacity: 1,
            scale: 1,
          }}

          transition={{
            duration: 1,
          }}
        >

          <div className="orbit orbit-one"></div>

          <div className="orbit orbit-two"></div>


          <motion.div
            className="ai-core"

            animate={{
              y: [0, -15, 0],
            }}

            transition={{
              duration: 4,
              repeat: Infinity,
            }}
          >

            <Brain size={70} />

            <span>
              AI
            </span>

          </motion.div>


          <div className="floating-card placement-card">

            <Target size={20} />

            <div>

              <small>
                Placement Probability
              </small>

              <strong>

                {dashboardData?.prediction
                  ?.placement_probability
                  ? `${dashboardData.prediction.placement_probability}%`
                  : "94.05%"}

              </strong>

            </div>

          </div>


          <div className="floating-card career-card">

            <TrendingUp size={20} />

            <div>

              <small>
                Career Match
              </small>

              <strong>

                {dashboardData?.career_recommendation
                  ?.match_score
                  ? `${dashboardData.career_recommendation.match_score}%`
                  : "81.3%"}

              </strong>

            </div>

          </div>

        </motion.div>

      </section>



      {/* =================================================
          DASHBOARD
      ================================================= */}

      {dashboardData && (

        <section
          id="dashboard"
          className="career-dashboard"
        >

          <div className="section-heading">

            <div className="section-label">
              AI CAREER ANALYSIS
            </div>


            <h2>

              Your Career
              <span> Intelligence.</span>

            </h2>


            <p>

              Personalized insights generated from
              your academic, technical and career profile.

            </p>

          </div>



          {/* =================================================
              STUDENT PROFILE
          ================================================= */}

          <div className="student-profile">

            <div className="profile-icon">

              <GraduationCap
                size={28}
              />

            </div>


            <div>

              <span>
                Student Profile
              </span>

              <h3>

                Student #
                {dashboardData.student?.student_id}

              </h3>

              <p>

                {dashboardData.student?.branch}
                {" • "}
                {dashboardData.student?.city}

              </p>

            </div>


            <div className="profile-stat">

              <span>
                CGPA
              </span>

              <strong>

                {dashboardData.student?.cgpa}

              </strong>

            </div>


            <div className="profile-stat">

              <span>
                Attendance
              </span>

              <strong>

                {dashboardData.student
                  ?.attendance_percentage}%

              </strong>

            </div>

            <div className="profile-report-action">
              <button
                type="button"
                className="report-button"
                onClick={() =>
                  document
                    .getElementById("career-report")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                <FileText size={17} />
                Career Report
                <ArrowRight size={15} />
              </button>
            </div>

          </div>



          {/* =================================================
              PLACEMENT INTELLIGENCE
          ================================================= */}

          <div className="placement-intelligence">

            <div className="placement-ring-card">

              <div className="section-label">
                PLACEMENT INTELLIGENCE
              </div>


              <h3>
                AI Placement Prediction
              </h3>


              <div className="ring-container">

                <AnimatedProbability
                  value={
                    dashboardData.prediction
                      ?.placement_probability ?? 0
                  }
                />

              </div>


              <div className="prediction-status">

                <Activity size={17} />

                <span>
                  Strong placement signal detected
                </span>

              </div>

            </div>



            <div className="prediction-info">

              <div className="prediction-info-header">

                <div className="dashboard-icon">
                  <Target />
                </div>


                <div>

                  <span>
                    MODEL OUTPUT
                  </span>

                  <h3>
                    Placement Prediction
                  </h3>

                </div>

              </div>


              <p>

                CareerLens Machine Learning model has
                analyzed the student's academic,
                technical and experience profile.

              </p>


              <div className="prediction-metrics">

                <div>

                  <span>
                    Probability
                  </span>

                  <strong>

                    {dashboardData.prediction
                      ?.placement_probability ?? 0}%

                  </strong>

                </div>


                <div>

                  <span>
                    Predicted Package
                  </span>

                  <strong>

                    {dashboardData.prediction
                      ?.predicted_package ?? 0} LPA

                  </strong>

                </div>

              </div>

            </div>

          </div>


          {/* =================================================
              EXPLAINABLE AI / SHAP
          ================================================= */}

          <section className="shap-intelligence">

            <div className="section-heading">

              <div className="section-label">
                EXPLAINABLE AI
              </div>

              <h2>
                Why did AI make
                <span> this prediction?</span>
              </h2>

              <p>
                CareerLens uses SHAP to show which factors
                contributed most to the placement prediction.
              </p>

            </div>

            {shapLoading ? (

              <div
                style={{
                  minHeight: "220px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid rgba(139,92,246,0.22)",
                  borderRadius: "24px",
                  background: "rgba(255,255,255,0.035)",
                  color: "#c4b5fd",
                  fontSize: "15px",
                  backdropFilter: "blur(16px)"
                }}
              >
                <motion.div
                  animate={{ opacity: [0.45, 1, 0.45] }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity
                  }}
                >
                  <Sparkles
                    size={18}
                    style={{
                      verticalAlign: "middle",
                      marginRight: "8px"
                    }}
                  />
                  Generating AI explanation...
                </motion.div>
              </div>

            ) : shapData ? (

              <ShapExplanation data={shapData} />

            ) : (

              <div
                style={{
                  padding: "28px",
                  border: "1px solid rgba(239,68,68,0.18)",
                  borderRadius: "24px",
                  background: "rgba(239,68,68,0.04)",
                  color: "#fca5a5"
                }}
              >
                SHAP explanation is currently unavailable.
                Please make sure the FastAPI SHAP endpoint is running.
              </div>

            )}

          </section>



          {/* =================================================
              CAREER INTELLIGENCE 2.0
          ================================================= */}

          <section className="career-intelligence-2">
            <div className="section-heading">
              <div className="section-label">
                CAREER INTELLIGENCE ENGINE 2.0
              </div>
              <h2>
                Your career path,
                <span> mapped by AI.</span>
              </h2>
              <p>
                CareerLens combines role matching, readiness analysis,
                skill gaps and a personalized learning roadmap.
              </p>
            </div>

            {careerIntelLoading ? (
              <CareerIntelligenceSkeleton />
            ) : careerIntel ? (
              <CareerIntelligencePanel
                data={{
                  ...careerIntel,
                  profileIndexes: {
                    academic: dashboardData?.student?.academic_index,
                    technical: dashboardData?.student?.technical_skill_index ?? dashboardData?.student?.skill_index,
                    experience: dashboardData?.student?.experience_index,
                    communication: dashboardData?.student?.communication_index,
                    employability: dashboardData?.student?.employability_index,
                  },
                }}
                dashboardData={dashboardData}
                studentId={studentId}
              />
            ) : (
              <div className="career-intelligence-error">
                Career Intelligence is currently unavailable.
                Please make sure the Career Intelligence API is running.
              </div>
            )}
          </section>

          {/* =================================================
              JOB MARKET INTELLIGENCE
          ================================================= */}

          <section className="market-intelligence">

            <div className="section-heading">

              <div className="section-label">
                JOB MARKET INTELLIGENCE
              </div>

              <h2>
                Skills the market
                <span> demands.</span>
              </h2>

              <p>
                CareerLens compares your current skills with
                market-demand signals to highlight where improvement
                can have the greatest career value.
              </p>

            </div>

            {marketIntelLoading ? (
              <MarketIntelligenceSkeleton />
            ) : marketIntel ? (
              <MarketIntelligencePanel data={marketIntel} />
            ) : (
              <div className="market-intelligence-error">
                Job Market Intelligence is currently unavailable.
                Please make sure the market analysis API is running.
              </div>
            )}

          </section>

          {/* =================================================
              SALARY INTELLIGENCE
          ================================================= */}

          <section className="salary-intelligence-section">

            <div className="section-heading">
              <div className="section-label">
                SALARY INTELLIGENCE
              </div>

              <h2>
                Understand your
                <span> package potential.</span>
              </h2>

              <p>
                CareerLens estimates a potential package from the
                student's academic, technical and experience profile.
              </p>
            </div>

            {salaryLoading ? (
              <SalaryIntelligenceSkeleton />
            ) : salaryData ? (
              <SalaryIntelligencePanel
                data={salaryData}
                placementProbability={dashboardData?.prediction?.placement_probability}
              />
            ) : (
              <div className="salary-intelligence-error">
                Salary prediction is currently unavailable.
                Please make sure the salary model and FastAPI endpoint are running.
              </div>
            )}

          </section>


          {/* =================================================
              PERSONALIZED LEARNING ROADMAP
          ================================================= */}

          <section className="learning-roadmap-section">

            <div className="section-heading">

              <div className="section-label">
                PERSONALIZED LEARNING ROADMAP
              </div>

              <h2>
                Turn skill gaps into
                <span> your next steps.</span>
              </h2>

              <p>
                CareerLens prioritizes the skills that need improvement
                and maps each one to a focused learning direction.
              </p>

            </div>

            {roadmapLoading ? (
              <LearningRoadmapSkeleton />
            ) : learningRoadmap ? (
              <LearningRoadmapPanel data={learningRoadmap} />
            ) : (
              <div className="roadmap-error">
                Personalized learning roadmap is currently unavailable.
              </div>
            )}

          </section>

          {/* =================================================
              AI CAREER REPORT
          ================================================= */}

          <section
            id="career-report"
            className="career-report-section"
          >

            <div className="section-heading">
              <div className="section-label">
                AI CAREER REPORT
              </div>

              <h2>
                Your complete
                <span> career snapshot.</span>
              </h2>

              <p>
                A presentation-ready summary of your CareerLens
                analysis, generated from the currently loaded profile.
              </p>
            </div>

            <div className="career-report-card">

              <div className="report-header">
                <div className="report-brand">
                  <div className="report-brand-icon">
                    <Brain size={22} />
                  </div>
                  <div>
                    <strong>Career<span>Lens</span></strong>
                    <small>AI Career Intelligence Report</small>
                  </div>
                </div>

                <button
                  type="button"
                  className="report-print-button"
                  onClick={() => window.print()}
                >
                  <Printer size={16} />
                  Print / Save PDF
                </button>
              </div>

              <div className="report-student-line">
                <div>
                  <span>STUDENT</span>
                  <strong>
                    #{dashboardData?.student?.student_id}
                  </strong>
                </div>

                <div>
                  <span>BRANCH</span>
                  <strong>
                    {dashboardData?.student?.branch || "—"}
                  </strong>
                </div>

                <div>
                  <span>CGPA</span>
                  <strong>
                    {dashboardData?.student?.cgpa ?? "—"}
                  </strong>
                </div>

                <div>
                  <span>LOCATION</span>
                  <strong>
                    {dashboardData?.student?.city || "—"}
                  </strong>
                </div>
              </div>

              <div className="report-metrics">

                <div className="report-metric">
                  <span>PLACEMENT PROBABILITY</span>
                  <strong>
                    {dashboardData?.prediction?.placement_probability ?? "—"}%
                  </strong>
                </div>

                <div className="report-metric">
                  <span>PREDICTED PACKAGE</span>
                  <strong>
                    {salaryData?.predicted_package_lpa
                      ? `${salaryData.predicted_package_lpa} LPA`
                      : dashboardData?.prediction?.predicted_package
                        ? `${dashboardData.prediction.predicted_package} LPA`
                        : "—"}
                  </strong>
                </div>

                <div className="report-metric">
                  <span>CAREER MATCH</span>
                  <strong>
                    {dashboardData?.career_recommendation?.match_score ?? "—"}%
                  </strong>
                </div>

                <div className="report-metric">
                  <span>RECOMMENDED ROLE</span>
                  <strong>
                    {dashboardData?.career_recommendation?.recommended_role || "—"}
                  </strong>
                </div>

              </div>

              <div className="report-grid">

                <div className="report-panel">
                  <div className="report-panel-title">
                    <Target size={17} />
                    Placement Outlook
                  </div>

                  <p>
                    CareerLens combines the student's academic,
                    technical and experience profile to generate
                    a placement probability estimate.
                  </p>

                  <div className="report-status">
                    <CheckCircle2 size={15} />
                    AI analysis completed for this profile
                  </div>
                </div>

                <div className="report-panel">
                  <div className="report-panel-title">
                    <BriefcaseBusiness size={17} />
                    Career Direction
                  </div>

                  <p>
                    Recommended role:
                    <strong>
                      {" "}{dashboardData?.career_recommendation?.recommended_role || "Not available"}
                    </strong>
                  </p>

                  <p>
                    Match score:
                    <strong>
                      {" "}{dashboardData?.career_recommendation?.match_score ?? "—"}%
                    </strong>
                  </p>
                </div>

                <div className="report-panel">
                  <div className="report-panel-title">
                    <GraduationCap size={17} />
                    Learning Direction
                  </div>

                  <p>
                    {learningRoadmap?.total_skills_to_improve ?? 0}
                    {" "}skills are currently prioritized in the
                    personalized learning roadmap.
                  </p>
                </div>

                <div className="report-panel">
                  <div className="report-panel-title">
                    <TrendingUp size={17} />
                    Market Direction
                  </div>

                  <p>
                    The roadmap combines current skill levels with
                    available market-demand signals to prioritize
                    development areas.
                  </p>
                </div>

              </div>

              <div className="report-footer">
                <span>
                  CareerLens • AI Career Intelligence & Placement Analytics
                </span>

                <span>
                  Model-generated insights are estimates, not guaranteed outcomes.
                </span>
              </div>

            </div>

          </section>


          {/* =================================================
              3D SKILL INTELLIGENCE
          ================================================= */}

          <section className="skill-intelligence-3d">

            <div className="section-heading">

              <div className="section-label">
                3D SKILL INTELLIGENCE
              </div>


              <h2>

                Explore your
                <span> skill universe.</span>

              </h2>


              <p>

                Interactive visualization of your technical
                strengths and career skill gaps.

              </p>

            </div>


            <div className="skill-3d-container">

              <Canvas
                camera={{
                  position: [0, 0, 9],
                  fov: 45,
                }}
              >

                <ambientLight intensity={0.5} />

                <pointLight
                  position={[5, 5, 5]}
                  intensity={3}
                />

                <pointLight
                  position={[-5, -5, -5]}
                  intensity={2}
                />


                <SkillUniverse
                  skills={uniqueSkillGaps}
                />


                <OrbitControls
                  enableZoom={false}
                  enablePan={false}
                  autoRotate
                  autoRotateSpeed={0.7}
                />

              </Canvas>


              <div className="skill-3d-overlay">

                <Orbit size={15} />

                Drag to explore

              </div>

            </div>


            <div className="skill-legend">

              <div>
                <span className="legend-dot strong"></span>
                Strong
              </div>

              <div>
                <span className="legend-dot medium"></span>
                Needs Improvement
              </div>

              <div>
                <span className="legend-dot gap"></span>
                Skill Gap
              </div>

            </div>

          </section>



          {/* =================================================
              MAIN METRICS
          ================================================= */}

          <div className="dashboard-grid">


            <motion.div
              className="dashboard-card"

              initial={{
                opacity: 0,
                y: 30,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}
            >

              <div className="dashboard-icon">
                <TrendingUp />
              </div>

              <span>
                Predicted Package
              </span>

              <strong>

                {dashboardData.prediction
                  ?.predicted_package ?? 0} LPA

              </strong>

              <small>
                Estimated placement package
              </small>

            </motion.div>



            <motion.div
              className="dashboard-card"

              initial={{
                opacity: 0,
                y: 30,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              transition={{
                delay: 0.1,
              }}
            >

              <div className="dashboard-icon">
                <BriefcaseBusiness />
              </div>

              <span>
                Recommended Career
              </span>

              <strong className="career-role">

                {dashboardData
                  .career_recommendation
                  ?.recommended_role ||
                  "Not Available"}

              </strong>

              <small>
                Based on your skill profile
              </small>

            </motion.div>



            <motion.div
              className="dashboard-card"

              initial={{
                opacity: 0,
                y: 30,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              transition={{
                delay: 0.2,
              }}
            >

              <div className="dashboard-icon">
                <BarChart3 />
              </div>

              <span>
                Career Match
              </span>

              <strong>

                {dashboardData
                  .career_recommendation
                  ?.match_score ?? 0}%

              </strong>

              <small>
                Role compatibility score
              </small>

            </motion.div>



            <motion.div
              className="dashboard-card"

              initial={{
                opacity: 0,
                y: 30,
              }}

              animate={{
                opacity: 1,
                y: 0,
              }}

              transition={{
                delay: 0.3,
              }}
            >

              <div className="dashboard-icon">
                <Brain />
              </div>

              <span>
                AI Analysis
              </span>

              <strong>
                360°
              </strong>

              <small>
                Multi-dimensional career analysis
              </small>

            </motion.div>

          </div>



          {/* =================================================
              SKILL GAP CARDS
          ================================================= */}

          <div className="skill-section">

            <div className="section-label">
              SKILL GAP INTELLIGENCE
            </div>


            <h3>
              Skills that need your attention
            </h3>


            <p className="skill-description">

              CareerLens analyzes your current skill
              level and identifies areas that can
              improve your career readiness.

            </p>


            <div className="skill-grid">

              {uniqueSkillGaps.map(
                (skill, index) => (

                  <motion.div
                    className="skill-card"
                    key={index}

                    initial={{
                      opacity: 0,
                      x: -20,
                    }}

                    animate={{
                      opacity: 1,
                      x: 0,
                    }}

                    transition={{
                      delay: index * 0.08,
                    }}
                  >

                    <div className="skill-header">

                      <div className="skill-name">

                        <div className="mini-skill-icon">

                          <Zap size={15} />

                        </div>

                        <strong>
                          {skill.skill}
                        </strong>

                      </div>


                      <span>
                        {skill.student_score}%
                      </span>

                    </div>


                    <div className="progress-bar">

                      <motion.div
                        className="progress-fill"

                        initial={{
                          width: 0,
                        }}

                        animate={{
                          width: `${Math.min(
                            skill.student_score || 0,
                            100
                          )}%`,
                        }}

                        transition={{
                          duration: 1,
                          delay: index * 0.08,
                        }}
                      />

                    </div>


                    <div className="skill-footer">

                      <span>

                        Gap:{" "}
                        {skill.skill_gap ??
                          skill.gap ??
                          0}%

                      </span>


                      <span>

                        {skill.status ||
                          "Needs Improvement"}

                      </span>

                    </div>

                  </motion.div>

                )
              )}

            </div>

          </div>



          {/* =================================================
              AI INSIGHT
          ================================================= */}

          <motion.div
            className="ai-insight"

            initial={{
              opacity: 0,
              y: 30,
            }}

            animate={{
              opacity: 1,
              y: 0,
            }}

            transition={{
              delay: 0.4,
            }}
          >

            <div className="insight-icon">
              <Sparkles size={25} />
            </div>


            <div>

              <div className="section-label">
                CAREERLENS AI INSIGHT
              </div>


              <h3>
                Your career profile has been analyzed.
              </h3>


              <p>

                Based on your academic performance,
                technical skills and career profile,
                CareerLens has identified{" "}

                <strong>

                  {dashboardData
                    .career_recommendation
                    ?.recommended_role ||
                    "your recommended career"}

                </strong>{" "}

                as a suitable career direction.

              </p>

            </div>

          </motion.div>

        </section>

      )}



      {/* =================================================
          FEATURES
      ================================================= */}

      <section
        id="features"
        className="features"
      >

        <div className="section-heading">

          <div className="section-label">
            CAREER INTELLIGENCE ENGINE
          </div>


          <h2>

            Everything you need to

            <span>
              understand your career.
            </span>

          </h2>


          <p>

            CareerLens combines multiple intelligent
            systems into one career intelligence platform.

          </p>

        </div>


        <div className="feature-grid">

          <FeatureCard
            icon={<Target />}
            title="Placement Prediction"
            text="Machine learning predicts placement probability using student data."
          />

          <FeatureCard
            icon={<BriefcaseBusiness />}
            title="Career Recommendation"
            text="Discover career roles matching your skills and strengths."
          />

          <FeatureCard
            icon={<BarChart3 />}
            title="Skill Gap Intelligence"
            text="Identify skills that need improvement for your target role."
          />

          <FeatureCard
            icon={<TrendingUp />}
            title="Job Market Intelligence"
            text="NLP analyzes job descriptions and identifies demanded skills."
          />

        </div>

      </section>



      {/* =================================================
          INTELLIGENCE
      ================================================= */}

      <section
        id="intelligence"
        className="intelligence"
      >

        <div className="intelligence-content">

          <div className="section-label">
            HOW CAREERLENS WORKS
          </div>


          <h2>

            From student data
            <br />

            to <span>career direction.</span>

          </h2>


          <p>

            Machine Learning, Explainable AI, NLP
            and database technologies work together
            to create a complete student career profile.

          </p>

        </div>


        <div className="pipeline">

          <PipelineCard
            number="01"
            title="Student Profile"
            text="Academic + Skills + Experience"
          />

          <PipelineCard
            number="02"
            title="AI Prediction"
            text="Placement + Salary Prediction"
          />

          <PipelineCard
            number="03"
            title="Career Match"
            text="Role Recommendation + Skill Gap"
          />

          <PipelineCard
            number="04"
            title="Market Intelligence"
            text="NLP Job Skill Analysis"
          />

          <PipelineCard
            number="05"
            title="Career Roadmap"
            text="Personalized Learning Plan"
          />

        </div>

      </section>



      {/* =================================================
          ABOUT
      ================================================= */}

      <section
        id="about"
        className="about"
      >

        <div>

          <div className="section-label">
            BUILT FOR THE FUTURE
          </div>


          <h2>

            Intelligence that
            <br />

            <span>
              guides action.
            </span>

          </h2>

        </div>


        <p>

          CareerLens is an integrated AI career
          intelligence platform combining Machine
          Learning, Explainable AI, NLP, MySQL and
          interactive visualization to transform
          student data into actionable career insights.

        </p>

      </section>



      {/* =================================================
          FOOTER
      ================================================= */}

      <footer>

        <strong>
          Career<span>Lens</span>
        </strong>

        <span>
          AI Career Intelligence & Placement Analytics Platform
        </span>

        <span>
          © 2026
        </span>

      </footer>

      <ProfileDetailsModal
        open={profileDetailsOpen}
        onClose={() => setProfileDetailsOpen(false)}
        dashboardData={dashboardData}
        studentId={studentId}
        profileName={profileName}
        profileEmail={profileEmail}
        profileInitial={profileInitial}
      />

      <EditProfileModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        dashboardData={dashboardData}
        studentId={studentId}
        onSaved={loadStudentDashboard}
      />

    </div>

  );
}



/* =====================================================
   PROFILE DETAILS MODAL
===================================================== */

function ProfileDetailsModal({
  open,
  onClose,
  dashboardData,
  studentId,
  profileName,
  profileEmail,
  profileInitial,
}) {
  if (!open) return null;

  const student = dashboardData?.student || {};
  const skills = [
    ["Python", "python_score"],
    ["SQL", "sql_score"],
    ["Excel", "excel_score"],
    ["Power BI", "powerbi_score"],
    ["Statistics", "statistics_score"],
    ["Machine Learning", "ml_score"],
    ["Java", "java_score"],
    ["Web Development", "web_dev_score"],
    ["Data Visualization", "data_visualization_score"],
    ["Programming", "coding_score"],
  ];

  const display = (value) =>
    value === undefined || value === null || value === "" ? "Not provided" : value;

  return (
    <div className="profile-details-backdrop" onClick={onClose}>
      <motion.div
        className="profile-details-modal"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="profile-details-head">
          <div className="profile-details-identity">
            <span className="profile-details-avatar">{profileInitial}</span>
            <div>
              <span className="profile-details-kicker">CAREER IDENTITY</span>
              <h2>{profileName}</h2>
              <p>{profileEmail}</p>
            </div>
          </div>
          <button type="button" className="profile-details-close" onClick={onClose}>×</button>
        </div>

        <div className="profile-details-id-row">
          <span>STUDENT ID</span>
          <strong>#{student.student_id || studentId}</strong>
          <span className="profile-live-dot">● Profile synced</span>
        </div>

        <div className="profile-details-scroll">
          <section className="profile-detail-section">
            <div className="profile-detail-section-title"><User size={17} /><span>Personal & Academic</span></div>
            <div className="profile-detail-grid">
              {[
                ["Phone", student.phone],
                ["Age", student.age],
                ["Gender", student.gender],
                ["City", student.city],
                ["State", student.state],
                ["College", student.college],
                ["Branch", student.branch],
                ["Semester", student.semester],
                ["Graduation Year", student.graduation_year],
                ["10th Percentage", student.tenth_percentage == null ? null : `${student.tenth_percentage}%`],
                ["12th Percentage", student.twelfth_percentage == null ? null : `${student.twelfth_percentage}%`],
                ["CGPA", student.cgpa],
                ["Backlogs", student.backlogs],
                ["Attendance", student.attendance_percentage == null ? null : `${student.attendance_percentage}%`],
              ].map(([label, value]) => (
                <div className="profile-detail-item" key={label}>
                  <span>{label}</span><strong>{display(value)}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-detail-section">
            <div className="profile-detail-section-title"><Zap size={17} /><span>AI Profile Indexes</span></div>
            <div className="profile-index-grid">
              {[
                ["Employability", student.employability_index],
                ["Academic", student.academic_index],
                ["Technical Skills", student.technical_skill_index ?? student.skill_index],
                ["Experience", student.experience_index],
                ["Communication", student.communication_index],
              ].map(([label, value]) => {
                const score = Math.max(0, Math.min(100, Number(value) || 0));
                return (
                  <div className="profile-index-card" key={label}>
                    <div className="profile-index-head"><span>{label}</span><strong>{score.toFixed(0)}</strong></div>
                    <div className="profile-index-track"><span style={{ width: `${score}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="profile-detail-section">
            <div className="profile-detail-section-title"><TrendingUp size={17} /><span>Technical Skills</span></div>
            <div className="profile-skill-grid">
              {skills.map(([label, key]) => {
                const score = Math.max(0, Math.min(100, Number(student[key]) || 0));
                return (
                  <div className="profile-skill-item" key={key}>
                    <div><span>{label}</span><strong>{score.toFixed(0)}%</strong></div>
                    <div className="profile-skill-track"><span style={{ width: `${score}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="profile-detail-section">
            <div className="profile-detail-section-title"><Activity size={17} /><span>Experience & Career</span></div>
            <div className="profile-detail-grid">
              {[
                ["Internships", student.internship_count],
                ["Internship Months", student.internship_months],
                ["Work Experience", student.work_experience_months == null ? null : `${student.work_experience_months} months`],
                ["Industry Projects", student.industry_projects],
                ["Personal Projects", student.personal_projects],
                ["Certifications", student.certification_count],
                ["Project Quality", student.project_quality_score == null ? null : `${student.project_quality_score}%`],
                ["GitHub Commits", student.github_commits],
                ["Coding Questions", student.coding_questions_solved],
                ["Preferred Role", student.preferred_role],
                ["Preferred Domain", student.preferred_domain],
                ["Preferred Location", student.preferred_location],
                ["Work Preference", student.remote_preference],
                ["Higher Studies", student.higher_studies_interest],
              ].map(([label, value]) => (
                <div className="profile-detail-item" key={label}>
                  <span>{label}</span><strong>{display(value)}</strong>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="profile-details-footer">
          <span><ShieldCheck size={15} /> Your profile powers personalized CareerLens insights.</span>
          <button type="button" onClick={onClose}>Done</button>
        </div>
      </motion.div>
    </div>
  );
}



/* =====================================================
   EDIT PROFILE MODAL — STEP 1
===================================================== */

function EditProfileModal({ open, onClose, dashboardData, studentId, onSaved }) {
  const student = dashboardData?.student || {};

  const initialForm = {
    full_name: student.full_name || "",
    email: student.email || "",
    phone: student.phone || "",
    age: student.age ?? "",
    gender: student.gender || "Prefer not to say",
    city: student.city || "",
    state: student.state || "",
    college: student.college || "",
    branch: student.branch || "CSE",
    graduation_year: student.graduation_year ?? "",
    semester: student.semester ?? "",
    tenth_percentage: student.tenth_percentage ?? 0,
    twelfth_percentage: student.twelfth_percentage ?? 0,
    cgpa: student.cgpa ?? 0,
    backlogs: student.backlogs ?? 0,
    attendance_percentage: student.attendance_percentage ?? 0,
    python_score: student.python_score ?? 0,
    sql_score: student.sql_score ?? 0,
    excel_score: student.excel_score ?? 0,
    powerbi_score: student.powerbi_score ?? 0,
    statistics_score: student.statistics_score ?? 0,
    ml_score: student.ml_score ?? 0,
    java_score: student.java_score ?? 0,
    web_dev_score: student.web_dev_score ?? 0,
    data_visualization_score: student.data_visualization_score ?? 0,
    coding_score: student.coding_score ?? 0,
    communication_score: student.communication_score ?? 0,
    aptitude_score: student.aptitude_score ?? 0,
    logical_reasoning_score: student.logical_reasoning_score ?? 0,
    presentation_score: student.presentation_score ?? 0,
    teamwork_score: student.teamwork_score ?? 0,
    leadership_score: student.leadership_score ?? 0,
    internship_count: student.internship_count ?? 0,
    internship_months: student.internship_months ?? 0,
    work_experience_months: student.work_experience_months ?? 0,
    industry_projects: student.industry_projects ?? 0,
    personal_projects: student.personal_projects ?? 0,
    certification_count: student.certification_count ?? 0,
    project_quality_score: student.project_quality_score ?? 0,
    github_commits: student.github_commits ?? 0,
    github_engagement_index: student.github_engagement_index ?? 0,
    coding_questions_solved: student.coding_questions_solved ?? 0,
    preferred_role: student.preferred_role || "Data Analyst",
    preferred_domain: student.preferred_domain || "Data Analytics",
    preferred_location: student.preferred_location || "Bhopal",
    remote_preference: student.remote_preference || "Hybrid",
    higher_studies_interest: student.higher_studies_interest || "No",
  };

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadFreshProfile = async () => {
      if (!open) return;

      setError("");

      // Start with the latest dashboard data so the form opens instantly.
      setForm(initialForm);

      try {
        // Fetch the student's latest persisted profile every time the editor opens.
        // This prevents stale React state from showing old values after a save.
        const response = await axios.get(
          `http://127.0.0.1:8000/students/${studentId}/dashboard`
        );

        if (cancelled) return;

        const freshStudent = response.data?.student || {};
        setForm({
          ...initialForm,
          ...freshStudent,
          email: freshStudent.email || initialForm.email || "",
          gender: freshStudent.gender || "Prefer not to say",
          branch: freshStudent.branch || "CSE",
          preferred_role: freshStudent.preferred_role || "Data Analyst",
          preferred_domain: freshStudent.preferred_domain || "Data Analytics",
          preferred_location: freshStudent.preferred_location || "Bhopal",
          remote_preference: freshStudent.remote_preference || "Hybrid",
          higher_studies_interest: freshStudent.higher_studies_interest || "No",
        });
      } catch (requestError) {
        console.error("CareerLens profile refresh error:", requestError);
        // Keep the dashboard values already loaded rather than blocking editing.
      }
    };

    loadFreshProfile();

    return () => {
      cancelled = true;
    };
  }, [open, studentId, dashboardData]);

  if (!open) return null;

  const update = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const numberFields = [
    "age", "graduation_year", "semester", "tenth_percentage", "twelfth_percentage",
    "cgpa", "backlogs", "attendance_percentage", "python_score", "sql_score",
    "excel_score", "powerbi_score", "statistics_score", "ml_score", "java_score",
    "web_dev_score", "data_visualization_score", "coding_score", "communication_score",
    "aptitude_score", "logical_reasoning_score", "presentation_score", "teamwork_score",
    "leadership_score", "internship_count", "internship_months", "work_experience_months",
    "industry_projects", "personal_projects", "certification_count", "project_quality_score",
    "github_commits", "github_engagement_index", "coding_questions_solved"
  ];

  const save = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.full_name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.email.trim() || !form.email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (Number(form.cgpa) < 0 || Number(form.cgpa) > 10) {
      setError("CGPA must be between 0 and 10.");
      return;
    }

    const percentageFields = ["tenth_percentage", "twelfth_percentage", "attendance_percentage"];
    if (percentageFields.some((field) => Number(form[field]) < 0 || Number(form[field]) > 100)) {
      setError("Percentage values must be between 0 and 100.");
      return;
    }

    const scoreFields = [
      "python_score", "sql_score", "excel_score", "powerbi_score", "statistics_score", "ml_score",
      "java_score", "web_dev_score", "data_visualization_score", "coding_score", "communication_score",
      "aptitude_score", "logical_reasoning_score", "presentation_score", "teamwork_score", "leadership_score",
      "project_quality_score", "github_engagement_index"
    ];
    if (scoreFields.some((field) => Number(form[field]) < 0 || Number(form[field]) > 100)) {
      setError("Skill and score values must be between 0 and 100.");
      return;
    }

    setSaving(true);

    try {
      const payload = { ...form };
      numberFields.forEach((field) => {
        payload[field] = Number(payload[field] || 0);
      });
      payload.full_name = payload.full_name.trim();
      payload.email = payload.email.trim().toLowerCase();
      payload.phone = payload.phone.trim();
      payload.city = payload.city.trim();
      payload.state = payload.state.trim();
      payload.college = payload.college.trim();

      await axios.put(
        `http://127.0.0.1:8000/students/${studentId}/profile`,
        payload
      );

      onClose();
      await onSaved();
    } catch (requestError) {
      console.error("CareerLens profile update error:", requestError);
      const detail = requestError?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : detail?.message || "Unable to save your profile. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const textField = (label, field, type = "text") => (
    <label className="edit-profile-field">
      <span>{label}</span>
      <input
        type={type}
        value={form[field]}
        onChange={(event) => update(field, event.target.value)}
      />
    </label>
  );

  const selectField = (label, field, options) => (
    <label className="edit-profile-field">
      <span>{label}</span>
      <select value={form[field]} onChange={(event) => update(field, event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );

  const scoreField = (label, field) => (
    <label className="edit-profile-score">
      <div><span>{label}</span><strong>{Number(form[field] || 0)}</strong></div>
      <input
        type="range"
        min="0"
        max="100"
        value={form[field]}
        onChange={(event) => update(field, event.target.value)}
      />
    </label>
  );

  return (
    <div className="edit-profile-backdrop" onClick={onClose}>
      <motion.div
        className="edit-profile-modal"
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="edit-profile-header">
          <div>
            <span className="edit-profile-kicker">CAREER IDENTITY</span>
            <h2>Edit your profile</h2>
            <p>Update your information. CareerLens will use the new profile for your AI insights.</p>
          </div>
          <button type="button" className="edit-profile-close" onClick={onClose}><X size={19} /></button>
        </div>

        <form onSubmit={save}>
          <div className="edit-profile-scroll">
            <section className="edit-profile-section">
              <div className="edit-profile-section-title"><User size={17} /><span>Personal & Academic</span></div>
              <div className="edit-profile-grid">
                {textField("Full Name", "full_name")}
                {textField("Email", "email", "email")}
                {textField("Phone", "phone", "tel")}
                {textField("Age", "age", "number")}
                {selectField("Gender", "gender", ["Female", "Male", "Other", "Prefer not to say"])}
                {textField("City", "city")}
                {textField("State", "state")}
                {textField("College / University", "college")}
                {selectField("Branch", "branch", ["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil", "AI/DS", "Other"])}
                {textField("Graduation Year", "graduation_year", "number")}
                {textField("Semester", "semester", "number")}
                {textField("10th %", "tenth_percentage", "number")}
                {textField("12th %", "twelfth_percentage", "number")}
                {textField("CGPA", "cgpa", "number")}
                {textField("Backlogs", "backlogs", "number")}
                {textField("Attendance %", "attendance_percentage", "number")}
              </div>
            </section>

            <section className="edit-profile-section">
              <div className="edit-profile-section-title"><Zap size={17} /><span>Technical & Soft Skills</span></div>
              <div className="edit-profile-score-grid">
                {[
                  ["Python", "python_score"], ["SQL", "sql_score"], ["Excel", "excel_score"], ["Power BI", "powerbi_score"],
                  ["Statistics", "statistics_score"], ["Machine Learning", "ml_score"], ["Java", "java_score"], ["Web Development", "web_dev_score"],
                  ["Data Visualization", "data_visualization_score"], ["Programming", "coding_score"], ["Communication", "communication_score"],
                  ["Aptitude", "aptitude_score"], ["Problem Solving", "logical_reasoning_score"], ["Presentation", "presentation_score"],
                  ["Teamwork", "teamwork_score"], ["Leadership", "leadership_score"]
                ].map(([label, field]) => scoreField(label, field))}
              </div>
            </section>

            <section className="edit-profile-section">
              <div className="edit-profile-section-title"><Activity size={17} /><span>Experience & Career Preferences</span></div>
              <div className="edit-profile-grid">
                {textField("Internship Count", "internship_count", "number")}
                {textField("Internship Months", "internship_months", "number")}
                {textField("Work Experience (Months)", "work_experience_months", "number")}
                {textField("Industry Projects", "industry_projects", "number")}
                {textField("Personal Projects", "personal_projects", "number")}
                {textField("Certifications", "certification_count", "number")}
                {textField("Project Quality", "project_quality_score", "number")}
                {textField("GitHub Commits", "github_commits", "number")}
                {textField("GitHub Engagement", "github_engagement_index", "number")}
                {textField("Coding Questions Solved", "coding_questions_solved", "number")}
                {selectField("Preferred Role", "preferred_role", ["Data Analyst", "Data Scientist", "Business Analyst", "BI Analyst", "Software Developer", "ML Engineer"])}
                {selectField("Preferred Domain", "preferred_domain", ["Data Analytics", "Data Science", "Business Intelligence", "Software Development", "Machine Learning", "Cloud / Data Engineering"])}
                {selectField("Preferred Location", "preferred_location", ["Bhopal", "Indore", "Pune", "Bengaluru", "Hyderabad", "Delhi NCR", "Mumbai", "Any Location"])}
                {selectField("Work Preference", "remote_preference", ["On-site", "Hybrid", "Remote", "Flexible"])}
                {selectField("Higher Studies", "higher_studies_interest", ["No", "Maybe", "Yes"])}
              </div>
            </section>

            {error && <div className="edit-profile-error">{error}</div>}
          </div>

          <div className="edit-profile-footer">
            <span><ShieldCheck size={15} /> Changes are saved to your CareerLens student profile.</span>
            <div>
              <button type="button" className="edit-profile-cancel" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="edit-profile-save" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
                {!saving && <Save size={16} />}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* =====================================================
   SHAP EXPLAINABLE AI
===================================================== */




function LearningRoadmapSkeleton() {
  return (
    <div className="learning-roadmap-loading">

      <motion.div
        className="roadmap-loading-orb"
        animate={{
          rotate: 360,
          scale: [1, 1.08, 1]
        }}
        transition={{
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          },
          scale: {
            duration: 1.2,
            repeat: Infinity
          }
        }}
      >
        <GraduationCap size={25} />
      </motion.div>

      <div>
        <strong>Building your learning roadmap...</strong>
        <p>Prioritizing your highest-impact skill gaps.</p>
      </div>

    </div>
  );
}


function LearningRoadmapPanel({ data }) {

  const roadmap = Array.isArray(data?.learning_roadmap)
    ? data.learning_roadmap
    : [];

  return (
    <div className="learning-roadmap-panel">

      <div className="roadmap-summary">

        <div className="roadmap-summary-icon">
          <GraduationCap size={24} />
        </div>

        <div>
          <span>CAREERLENS ROADMAP</span>
          <h3>
            {Number(data?.total_skills_to_improve || roadmap.length)}
            {" "}skills to improve
          </h3>
          <p>
            Your roadmap is ordered by the combination of
            skill gap and market demand.
          </p>
        </div>

      </div>


      <div className="roadmap-timeline">

        {roadmap.map((item, index) => {

          const score = Number(item.current_score || 0);
          const gap = Number(item.skill_gap || 0);
          const demand = Number(item.market_demand || 0);
          const priority = Number(item.priority || 0);

          return (
            <motion.div
              className="roadmap-step"
              key={`${item.skill}-${index}`}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * .09 }}
            >

              <div className="roadmap-step-marker">
                <span>0{index + 1}</span>
              </div>

              <div className="roadmap-step-card">

                <div className="roadmap-step-top">

                  <div>
                    <div className="roadmap-skill-label">
                      FOCUS AREA
                    </div>

                    <h4>{item.skill}</h4>

                    <span className="roadmap-learning">
                      {item.recommended_learning}
                    </span>
                  </div>

                  <div className="roadmap-status">
                    {item.status}
                  </div>

                </div>


                <div className="roadmap-metrics">

                  <div>
                    <span>Current</span>
                    <strong>{score.toFixed(0)}%</strong>
                  </div>

                  <div>
                    <span>Gap</span>
                    <strong>{gap.toFixed(0)}%</strong>
                  </div>

                  <div>
                    <span>Market Demand</span>
                    <strong>{demand.toFixed(0)}%</strong>
                  </div>

                  <div>
                    <span>Priority</span>
                    <strong>{priority.toFixed(1)}</strong>
                  </div>

                </div>


                <div className="roadmap-progress">

                  <div className="roadmap-progress-head">
                    <span>Skill readiness</span>
                    <span>{score.toFixed(0)}%</span>
                  </div>

                  <div className="roadmap-track">

                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(score, 100)}%`
                      }}
                      transition={{
                        duration: .9,
                        delay: index * .09
                      }}
                    />

                  </div>

                </div>

              </div>

            </motion.div>
          );
        })}

      </div>

    </div>
  );
}

function MarketIntelligenceSkeleton() {
  return (
    <div className="market-intelligence-panel market-loading">
      <motion.div
        animate={{ scale: [1, 1.12, 1], opacity: [.55, 1, .55] }}
        transition={{ duration: 1.4, repeat: Infinity }}
        className="market-loading-orb"
      >
        <TrendingUp size={24} />
      </motion.div>

      <div>
        <strong>Reading the job market...</strong>
        <p>Comparing your skills with current demand signals.</p>
      </div>
    </div>
  );
}

function MarketIntelligencePanel({ data }) {

  const topSkills = Array.isArray(data?.top_market_skills)
    ? data.top_market_skills
    : [];

  const priorityGaps = Array.isArray(data?.top_skill_gaps)
    ? data.top_skill_gaps
    : [];

  const maxDemand = Math.max(
    ...topSkills.map((item) => Number(item.market_demand || 0)),
    1
  );

  return (
    <div className="market-intelligence-panel">

      <div className="market-overview">

        <div>
          <div className="career-mini-label">
            MARKET SIGNAL
          </div>

          <h3>
            Demand vs. your current skill level
          </h3>

          <p>
            A higher priority indicates a larger combination
            of skill gap and market demand.
          </p>
        </div>

        <div className="market-badge">
          <Activity size={16} />
          LIVE ANALYTICS VIEW
        </div>

      </div>


      <div className="market-content-grid">

        <div className="market-card">

          <div className="market-card-title">
            <div>
              <span>TOP MARKET SKILLS</span>
              <h4>Most demanded skills</h4>
            </div>
            <TrendingUp size={19} />
          </div>

          <div className="market-bars">

            {topSkills.map((item, index) => {

              const demand = Number(item.market_demand || 0);

              return (
                <motion.div
                  className="market-skill-row"
                  key={item.skill}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * .08 }}
                >

                  <div className="market-skill-heading">
                    <span>{item.skill}</span>
                    <strong>{demand.toFixed(1)}%</strong>
                  </div>

                  <div className="market-demand-track">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min(
                          (demand / maxDemand) * 100,
                          100
                        )}%`
                      }}
                      transition={{
                        duration: .9,
                        delay: index * .08
                      }}
                    />
                  </div>

                </motion.div>
              );
            })}

          </div>

        </div>


        <div className="market-card market-priority-card">

          <div className="market-card-title">
            <div>
              <span>YOUR PRIORITIES</span>
              <h4>Where to focus next</h4>
            </div>
            <Zap size={19} />
          </div>

          <div className="market-priority-list">

            {priorityGaps.map((item, index) => (

              <motion.div
                className="market-priority-item"
                key={item.skill}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * .08 }}
              >

                <div className="market-priority-number">
                  0{index + 1}
                </div>

                <div className="market-priority-main">

                  <div>
                    <strong>{item.skill}</strong>
                    <span>{item.status}</span>
                  </div>

                  <b>
                    Priority {Number(item.priority || 0).toFixed(1)}
                  </b>

                </div>

                <div className="market-priority-meta">
                  <span>
                    Your skill: {Number(item.student_score || 0).toFixed(0)}%
                  </span>

                  <span>
                    Market: {Number(item.market_demand || 0).toFixed(0)}%
                  </span>
                </div>

              </motion.div>

            ))}

          </div>

        </div>

      </div>

    </div>
  );
}

function CareerIntelligenceSkeleton() {
  return (
    <div className="career-intelligence-panel">
      <div className="career-intel-loading">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="career-loading-orb"
        >
          <Brain size={25} />
        </motion.div>
        <div>
          <strong>Building your career map...</strong>
          <p>Matching roles, analyzing readiness and preparing your roadmap.</p>
        </div>
      </div>
    </div>
  );
}


function ResumeIntelligence({ studentId, recommendedRole }) {
  const [resumeFile, setResumeFile] = React.useState(null);
  const [resumeLoading, setResumeLoading] = React.useState(false);
  const [resumeError, setResumeError] = React.useState("");
  const [resumeResult, setResumeResult] = React.useState(null);

  const handleResumeAnalysis = async () => {
    if (!resumeFile) {
      setResumeError("Please choose a PDF, DOCX, or TXT resume first.");
      return;
    }

    setResumeLoading(true);
    setResumeError("");
    setResumeResult(null);

    try {
      const formData = new FormData();
      formData.append("file", resumeFile);
      if (recommendedRole) {
        formData.append("target_role", recommendedRole);
      }

      const response = await axios.post(
        `http://127.0.0.1:8000/students/${studentId}/resume-intelligence`,
        formData
      );

      setResumeResult(response.data);
    } catch (error) {
      console.error("Resume Intelligence Error:", error);
      setResumeError(
        error?.response?.data?.detail ||
        "Resume analysis could not be completed. Please try again."
      );
    } finally {
      setResumeLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="resume-intelligence">
      <div className="career-intel-title-row">
        <div>
          <div className="career-mini-label">RESUME INTELLIGENCE</div>
          <h3>Turn your resume into career insights</h3>
          <p className="career-comparison-subtitle">
            Upload your resume and CareerLens will compare its visible skills
            with your selected career direction and highlight what to improve.
          </p>
        </div>
        <div className="resume-intelligence-icon">
          <FileText size={21} />
        </div>
      </div>

      <div className="resume-intelligence-upload">
        <label className="resume-dropzone">
          <input
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(event) => {
              setResumeFile(event.target.files?.[0] || null);
              setResumeError("");
              setResumeResult(null);
            }}
          />
          <div className="resume-upload-icon">
            <Upload size={22} />
          </div>
          <strong>
            {resumeFile ? resumeFile.name : "Choose your resume"}
          </strong>
          <span>
            PDF, DOCX or TXT · maximum 5 MB
          </span>
          {resumeFile && (
            <small>{formatBytes(resumeFile.size)}</small>
          )}
        </label>

        <button
          type="button"
          className="resume-analyze-button"
          onClick={handleResumeAnalysis}
          disabled={resumeLoading || !resumeFile}
        >
          {resumeLoading ? "Analyzing Resume..." : "Analyze Resume"}
          {!resumeLoading && <ArrowUpRight size={17} />}
        </button>
      </div>

      {resumeError && (
        <div className="resume-intelligence-error">
          <AlertCircle size={17} />
          <span>{resumeError}</span>
        </div>
      )}

      {resumeResult && (
        <motion.div
          className="resume-intelligence-results"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="resume-result-hero">
            <div>
              <div className="career-mini-label">RESUME MATCH</div>
              <h4>{resumeResult.target_role || "Career Path"}</h4>
              <p>
                {resumeResult.resume_match_score}% of the weighted role
                requirements were detected in the uploaded resume.
              </p>
            </div>
            <div className="resume-match-orb">
              <strong>{Math.round(Number(resumeResult.resume_match_score || 0))}%</strong>
              <span>match</span>
            </div>
          </div>

          <div className="resume-result-grid">
            <div className="resume-result-box">
              <div className="resume-result-box-title">
                <CheckCircle2 size={16} />
                Skills detected
              </div>
              <div className="resume-skill-chips">
                {(resumeResult.detected_skills || []).length > 0 ? (
                  resumeResult.detected_skills.map((skill) => (
                    <span key={skill}>{skill}</span>
                  ))
                ) : (
                  <small>No mapped skills were detected.</small>
                )}
              </div>
            </div>

            <div className="resume-result-box">
              <div className="resume-result-box-title">
                <Zap size={16} />
                Skills to strengthen
              </div>
              <div className="resume-skill-list">
                {(resumeResult.missing_skills || []).length > 0 ? (
                  resumeResult.missing_skills.slice(0, 6).map((item) => (
                    <div key={item.skill}>
                      <span>{item.skill}</span>
                      <strong>{Math.round(Number(item.priority || 0))}% priority</strong>
                    </div>
                  ))
                ) : (
                  <small>No major role-skill gaps were detected from the resume.</small>
                )}
              </div>
            </div>
          </div>

          {(resumeResult.profile_skills_to_show || []).length > 0 && (
            <div className="resume-alignment-note">
              <strong>CareerLens found skills in your profile that are not clearly visible in the resume:</strong>
              <span>
                {resumeResult.profile_skills_to_show.join(" · ")}
              </span>
            </div>
          )}

          {(resumeResult.recommendations || []).length > 0 && (
            <div className="resume-recommendations">
              <div className="resume-result-box-title">
                <Sparkles size={16} />
                Resume improvement suggestions
              </div>
              {resumeResult.recommendations.map((item, index) => (
                <div className="resume-recommendation-item" key={`${index}-${item}`}>
                  <span>{index + 1}</span>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}


/* =====================================================
   STEP 7 — AI INTERVIEW PREPARATION
===================================================== */
function InterviewPreparation({ studentId, recommendedRole }) {
  const [questions, setQuestions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [evaluating, setEvaluating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);

  const loadInterview = async () => {
    setLoading(true);
    setError("");
    setShowAnswer(false);
    setUserAnswer("");
    setEvaluation(null);
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/students/${studentId}/interview-prep`,
        { params: { role: recommendedRole || "Data Analyst" } }
      );
      setQuestions(Array.isArray(response.data?.questions) ? response.data.questions : []);
      setActiveIndex(0);
      setStarted(true);
    } catch (err) {
      console.error("Interview Preparation Error:", err);
      setError(err?.response?.data?.detail || "Interview preparation could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) {
      setError("Please write your answer before submitting.");
      return;
    }
    setEvaluating(true);
    setError("");
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/students/evaluate-interview-answer",
        {
          student_id: Number(studentId),
          role: recommendedRole || "Data Analyst",
          question: current?.question || "",
          category: current?.category || "",
          answer: userAnswer.trim(),
          model_answer: current?.answer || current?.model_answer || "",
        }
      );
      setEvaluation(response.data);
    } catch (err) {
      console.error("Interview Answer Evaluation Error:", err);
      setError(err?.response?.data?.detail || "Your answer could not be evaluated. Please try again.");
    } finally {
      setEvaluating(false);
    }
  };

  const moveToQuestion = (index) => {
    setActiveIndex(index);
    setShowAnswer(false);
    setUserAnswer("");
    setEvaluation(null);
    setError("");
  };

  const current = questions[activeIndex];

  return (
    <div className="interview-prep-panel">
      <div className="career-intel-title-row">
        <div>
          <div className="career-mini-label">AI INTERVIEW PREPARATION</div>
          <h3>Practice for your target role</h3>
          <p className="career-comparison-subtitle">
            CareerLens creates role-specific questions using your current career direction and profile skill gaps.
          </p>
        </div>
        <div className="interview-prep-icon"><MessageCircleQuestion size={21} /></div>
      </div>

      {!started && !loading && (
        <div className="interview-prep-start">
          <div className="interview-prep-start-copy">
            <span className="interview-role-pill">{recommendedRole || "Data Analyst"}</span>
            <h4>Ready for a focused interview session?</h4>
            <p>Get technical, analytics and behavioral questions matched to your career path.</p>
          </div>
          <button type="button" className="interview-start-button" onClick={loadInterview}>
            Start Interview Prep <ArrowUpRight size={17} />
          </button>
        </div>
      )}

      {loading && (
        <div className="interview-prep-loading">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
            <RefreshCw size={22} />
          </motion.div>
          <span>Building your personalized question set...</span>
        </div>
      )}

      {error && <div className="interview-prep-error"><AlertCircle size={17} /> {error}</div>}

      {current && !loading && (
        <motion.div className="interview-question-card" key={`${activeIndex}-${current.question}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="interview-question-top">
            <div>
              <span className="interview-question-count">QUESTION {activeIndex + 1} / {questions.length}</span>
              <h4>{current.question}</h4>
            </div>
            <div className="interview-question-tags">
              <span>{current.category}</span>
              <span>{current.difficulty}</span>
            </div>
          </div>

          <div className="interview-question-focus">
            <Lightbulb size={17} />
            <span>{current.focus}</span>
          </div>

          <div className="interview-your-answer-section">
            <div className="interview-your-answer-heading">
              <span>YOUR ANSWER</span>
              <small>{userAnswer.trim().length} characters</small>
            </div>
            <textarea
              className="interview-answer-input"
              value={userAnswer}
              onChange={(event) => setUserAnswer(event.target.value)}
              placeholder="Type your interview answer here. Answer as if you are speaking to the interviewer..."
              rows={6}
              disabled={evaluating}
            />
            <div className="interview-answer-actions">
              <button
                type="button"
                className="interview-submit-answer-button"
                onClick={submitAnswer}
                disabled={evaluating || !userAnswer.trim()}
              >
                {evaluating ? "Evaluating your answer..." : "Submit Answer"}
                {!evaluating && <ArrowRight size={17} />}
              </button>
              <span className="interview-answer-note">Submit first, then review your feedback and the model answer.</span>
            </div>
          </div>

          {evaluation && (
            <motion.div className="interview-evaluation-box" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="interview-evaluation-heading">
                <div><CheckCircle2 size={18} /> CareerLens answer feedback</div>
                <strong>{Math.round(Number(evaluation.overall_score || 0))}%</strong>
              </div>
              <div className="interview-evaluation-grid">
                <div><span>Technical accuracy</span><strong>{Math.round(Number(evaluation.technical_accuracy || 0))}%</strong></div>
                <div><span>Completeness</span><strong>{Math.round(Number(evaluation.completeness || 0))}%</strong></div>
                <div><span>Clarity</span><strong>{Math.round(Number(evaluation.clarity || 0))}%</strong></div>
                <div><span>Interview readiness</span><strong>{Math.round(Number(evaluation.interview_readiness || 0))}%</strong></div>
              </div>
              <div className="interview-feedback-list">
                <div><strong>What you did well:</strong> {evaluation.strength}</div>
                <div><strong>What to improve:</strong> {evaluation.improvement}</div>
              </div>
            </motion.div>
          )}

          {!showAnswer ? (
            <button
              type="button"
              className="interview-answer-button"
              onClick={() => setShowAnswer(true)}
              disabled={!evaluation}
              title={!evaluation ? "Submit your answer first" : "Reveal the model answer"}
            >
              Reveal model answer <ArrowRight size={17} />
            </button>
          ) : (
            <motion.div className="interview-answer-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="interview-answer-heading"><Check size={17} /> Model answer</div>
              <p>{current.answer || current.model_answer || "Model answer is not available for this question."}</p>
              <div className="interview-tip"><strong>Interview tip:</strong> {current.tip}</div>
            </motion.div>
          )}

          <div className="interview-navigation">
            <button type="button" onClick={() => moveToQuestion(Math.max(0, activeIndex - 1))} disabled={activeIndex === 0}>Previous</button>
            {activeIndex < questions.length - 1 ? (
              <button type="button" className="interview-next-button" onClick={() => moveToQuestion(activeIndex + 1)}>Next question <ArrowRight size={16} /></button>
            ) : (
              <button type="button" className="interview-next-button" onClick={loadInterview}>New question set <RefreshCw size={16} /></button>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}


function CareerProgressTracker({ studentId }) {
  const [progress, setProgress] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadProgress = React.useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`http://127.0.0.1:8000/students/${studentId}/career-progress`);
      setProgress(response.data || null);
    } catch (err) {
      console.error("Career Progress Error:", err);
      setError(err?.response?.data?.detail || "Career progress could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  React.useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const current = progress?.current || {};
  const previous = progress?.previous || null;
  const delta = (key) => {
    if (!previous) return null;
    return Number(current[key] || 0) - Number(previous[key] || 0);
  };

  const metrics = [
    ["Career readiness", "readiness_score", "%"],
    ["Placement probability", "placement_probability", "%"],
    ["Employability", "employability_index", "%"],
    ["Technical skills", "technical_index", "%"],
    ["Experience", "experience_index", "%"],
  ];

  return (
    <div className="career-progress-card">
      <div className="career-intel-title-row">
        <div>
          <div className="career-mini-label">CAREER PROGRESS</div>
          <h3>See how your profile evolves</h3>
          <p className="career-comparison-subtitle">
            CareerLens saves meaningful profile snapshots so you can track improvement over time.
          </p>
        </div>
        <div className="career-progress-icon"><TrendingUp size={21} /></div>
      </div>

      {loading && (
        <div className="career-progress-loading"><RefreshCw size={18} /> Building your progress timeline...</div>
      )}

      {error && !loading && (
        <div className="career-progress-error"><AlertCircle size={17} /> {error}</div>
      )}

      {!loading && !error && (
        <>
          <div className="career-progress-summary">
            <div className="career-progress-current">
              <span>Current career direction</span>
              <strong>{current.recommended_role || "Not available"}</strong>
              <small>{progress?.snapshot_count || 0} saved snapshot{progress?.snapshot_count === 1 ? "" : "s"}</small>
            </div>
            <div className="career-progress-package">
              <span>Predicted package</span>
              <strong>{Number(current.predicted_package_lpa || 0).toFixed(1)} LPA</strong>
              {delta("predicted_package_lpa") !== null && (
                <small className={delta("predicted_package_lpa") >= 0 ? "progress-positive" : "progress-negative"}>
                  {delta("predicted_package_lpa") >= 0 ? "+" : ""}{delta("predicted_package_lpa").toFixed(1)} LPA since last snapshot
                </small>
              )}
            </div>
          </div>

          <div className="career-progress-metric-grid">
            {metrics.map(([label, key, suffix]) => {
              const value = Math.max(0, Math.min(100, Number(current[key] || 0)));
              const change = delta(key);
              return (
                <div className="career-progress-metric" key={key}>
                  <div className="career-progress-metric-head">
                    <span>{label}</span>
                    <strong>{Math.round(value)}{suffix}</strong>
                  </div>
                  <div className="career-progress-track">
                    <motion.div
                      className="career-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: .8 }}
                    />
                  </div>
                  {change !== null && (
                    <small className={change >= 0 ? "progress-positive" : "progress-negative"}>
                      {change >= 0 ? "↑" : "↓"} {Math.abs(change).toFixed(1)} pts since last snapshot
                    </small>
                  )}
                </div>
              );
            })}
          </div>

          {Array.isArray(progress?.history) && progress.history.length > 0 && (
            <div className="career-progress-history">
              <div className="career-progress-history-head">
                <div>
                  <div className="career-mini-label">PROGRESS TIMELINE</div>
                  <strong>Milestones saved by CareerLens</strong>
                </div>
                <span>Latest {progress.history.length}</span>
              </div>
              <div className="career-progress-timeline">
                {progress.history.map((item, index) => {
                  const date = item.captured_at ? new Date(item.captured_at) : null;
                  return (
                    <div className="career-progress-timeline-item" key={item.snapshot_id || index}>
                      <div className="career-progress-dot" />
                      <div className="career-progress-timeline-content">
                        <div>
                          <strong>{Math.round(Number(item.readiness_score || 0))}% readiness</strong>
                          <span>{item.recommended_role || "Career profile"}</span>
                        </div>
                        <small>{date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "Saved profile"}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CareerIntelligencePanel({ data, dashboardData, studentId }) {
  const roles = Array.isArray(data?.top_roles) ? data.top_roles : [];
  const gaps = Array.isArray(data?.skill_gaps) ? data.skill_gaps : [];
  const roadmap = Array.isArray(data?.roadmap) ? data.roadmap : [];
  const readiness = Math.max(0, Math.min(Number(data?.readiness_score || 0), 100));
  const profileIndexes = data?.profileIndexes || {};
  const readinessBreakdown = [
    ["Academic", profileIndexes.academic],
    ["Technical Skills", profileIndexes.technical],
    ["Experience", profileIndexes.experience],
    ["Communication", profileIndexes.communication],
    ["Employability", profileIndexes.employability],
  ].map(([label, value]) => ({
    label,
    value: Math.max(0, Math.min(100, Number(value) || 0)),
  }));

  // Use the student's real saved skill values as the simulator baseline.
  // The sliders are hypothetical controls; they must never start from zero.
  const baseSkills = {
    ...(dashboardData?.student || {}),
    ...(dashboardData?.skills || {}),
  };
  const simulatorSkills = [
    ["python_score", "Python"],
    ["sql_score", "SQL"],
    ["powerbi_score", "Power BI"],
    ["statistics_score", "Statistics"],
    ["coding_score", "Programming"],
  ];


  const [selectedCompareRole, setSelectedCompareRole] = React.useState(null);
  const comparisonRoles = roles.slice(0, 3);
  const activeCompareRole = comparisonRoles.find((role) => role.role === selectedCompareRole) || comparisonRoles[0] || null;
  const [simulationValues, setSimulationValues] = React.useState(() =>
    Object.fromEntries(simulatorSkills.map(([key]) => [key, Math.round(Number(baseSkills[key]) || 0)]))
  );
  const [simulationResult, setSimulationResult] = React.useState(null);
  const [simulationLoading, setSimulationLoading] = React.useState(false);
  const [simulationError, setSimulationError] = React.useState("");

  React.useEffect(() => {
    setSimulationValues(
      Object.fromEntries(simulatorSkills.map(([key]) => [key, Math.round(Number(baseSkills[key]) || 0)]))
    );
    setSimulationResult(null);
    setSimulationError("");
  }, [studentId, dashboardData?.student?.student_id, dashboardData?.skills]);

  const runSimulation = async () => {
    setSimulationLoading(true);
    setSimulationError("");
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/students/simulate-career",
        { student_id: Number(studentId), overrides: simulationValues }
      );
      setSimulationResult(response.data);
    } catch (error) {
      console.error("Career Simulator Error:", error);
      setSimulationResult(null);
      setSimulationError(error?.response?.data?.detail || "Simulation could not be completed.");
    } finally {
      setSimulationLoading(false);
    }
  };

  return (
    <div className="career-intelligence-panel">

      <div className="career-readiness-card">
        <div className="career-readiness-copy">
          <div className="career-mini-label">AI CAREER READINESS</div>
          <h3>{data?.recommended_role || "Career Path"}</h3>
          <p>{data?.direction_message || "Your personalized career direction is ready."}</p>

          <div className="readiness-progress">
            <div className="readiness-progress-track">
              <motion.div
                className="readiness-progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${readiness}%` }}
                transition={{ duration: 1.2 }}
              />
            </div>
            <div className="readiness-progress-labels">
              <span>Current readiness</span>
              <strong>{readiness.toFixed(1)}%</strong>
            </div>
          </div>
        </div>

        <div className="readiness-orb">
          <div className="readiness-orb-ring">
            <motion.div
              className="readiness-orb-value"
              initial={{ opacity: 0, scale: .7 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {Math.round(readiness)}%
            </motion.div>
            <span>{data?.readiness_label || "Developing"}</span>
          </div>
        </div>
      </div>

      <div className="readiness-breakdown">
        <div className="readiness-breakdown-head">
          <div>
            <div className="career-mini-label">PROFILE BREAKDOWN</div>
            <strong>What is driving your readiness?</strong>
          </div>
          <span>Latest saved profile</span>
        </div>
        <div className="readiness-breakdown-grid">
          {readinessBreakdown.map(({ label, value }) => (
            <div className="readiness-breakdown-item" key={label}>
              <div className="readiness-breakdown-label">
                <span>{label}</span>
                <strong>{Math.round(value)}%</strong>
              </div>
              <div className="readiness-breakdown-track">
                <motion.div
                  className="readiness-breakdown-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.8, delay: 0.15 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="career-simulator-card">
        <div className="career-simulator-header">
          <div>
            <div className="career-mini-label">CAREER SIMULATOR</div>
            <h3>What if you improve your skills?</h3>
            <p>Adjust a few skills and see a model-based estimate of how your profile could change. Your real profile is not modified.</p>
          </div>
          <div className="career-simulator-badge"><Sparkles size={15} /> WHAT-IF ANALYSIS</div>
        </div>

        <div className="career-simulator-grid">
          <div className="career-simulator-controls">
            {simulatorSkills.map(([key, label]) => {
              const current = Math.round(Number(baseSkills[key]) || 0);
              const value = Number(simulationValues[key] ?? current);
              return (
                <div className="career-simulator-control" key={key}>
                  <div className="career-simulator-control-top">
                    <span>{label}</span>
                    <strong>{value}%</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(event) => setSimulationValues((prev) => ({ ...prev, [key]: Number(event.target.value) }))}
                  />
                  <div className="career-simulator-range-labels"><span>Current {current}%</span><span>Target 100%</span></div>
                </div>
              );
            })}
            <button type="button" className="career-simulator-run" onClick={runSimulation} disabled={simulationLoading}>
              {simulationLoading ? "Running simulation..." : "Run Career Simulation"}
              {!simulationLoading && <ArrowUpRight size={17} />}
            </button>
            {simulationError && <div className="career-simulator-error">{simulationError}</div>}
          </div>

          <div className="career-simulator-results">
            {!simulationResult ? (
              <div className="career-simulator-empty">
                <div className="career-simulator-empty-icon"><Sparkles size={24} /></div>
                <strong>See your possible next level</strong>
                <span>Move the sliders and run a simulation to compare your current profile with a hypothetical improved profile.</span>
              </div>
            ) : (
              <>
                <div className="career-simulator-result-label">SIMULATION ESTIMATE</div>
                <div className="career-simulator-result-grid">
                  <div><span>Readiness</span><strong>{Number(simulationResult.simulated_readiness || 0).toFixed(1)}%</strong><small>{Number(simulationResult.readiness_change || 0) >= 0 ? "+" : ""}{Number(simulationResult.readiness_change || 0).toFixed(1)} pts</small></div>
                  <div><span>Placement probability</span><strong>{Number(simulationResult.simulated_placement_probability || 0).toFixed(1)}%</strong><small>{Number(simulationResult.placement_change || 0) >= 0 ? "+" : ""}{Number(simulationResult.placement_change || 0).toFixed(1)} pts</small></div>
                  <div><span>Predicted package</span><strong>{Number(simulationResult.simulated_package_lpa || 0).toFixed(1)} LPA</strong><small>{Number(simulationResult.package_change || 0) >= 0 ? "+" : ""}{Number(simulationResult.package_change || 0).toFixed(1)} LPA</small></div>
                  <div><span>Recommended role</span><strong className="career-simulator-role">{simulationResult.recommended_role || "—"}</strong><small>{Number(simulationResult.match_score || 0).toFixed(1)}% match</small></div>
                </div>
                <div className="career-simulator-note">Simulation only — your saved profile remains unchanged until you edit and save it.</div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="career-intel-section">
        <div className="career-intel-title-row">
          <div>
            <div className="career-mini-label">ROLE MATCHING</div>
            <h3>Career paths detected by AI</h3>
          </div>
          <Sparkles size={21} />
        </div>

        <div className="career-role-grid">
          {roles.map((role, index) => (
            <motion.div
              key={role.role}
              className={`career-role-card ${index === 0 ? "career-role-featured" : ""}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * .1 }}
            >
              <div className="career-role-number">0{index + 1}</div>
              <div className="career-role-icon">
                {index === 0 ? <Target size={19} /> : <BriefcaseBusiness size={19} />}
              </div>
              <h4>{role.role}</h4>

              <div className="career-role-score">
                <strong>{Number(role.match_score || 0).toFixed(1)}%</strong>
                <span>match</span>
              </div>

              <div className="career-role-bar">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Number(role.match_score || 0), 100)}%` }}
                  transition={{ duration: .9, delay: index * .1 }}
                />
              </div>

              {role.strengths?.length > 0 && (
                <div className="career-role-strengths">
                  {role.strengths.slice(0, 2).map((item) => (
                    <span key={item.feature}>
                      <CheckCircle2 size={13} />
                      {item.skill}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {comparisonRoles.length > 0 && (
        <div className="career-role-comparison">
          <div className="career-intel-title-row">
            <div>
              <div className="career-mini-label">CAREER ROLE COMPARISON</div>
              <h3>Compare your strongest career paths</h3>
              <p className="career-comparison-subtitle">See how your current profile matches each role before choosing where to focus your preparation.</p>
            </div>
            <BriefcaseBusiness size={21} />
          </div>

          <div className="career-comparison-tabs">
            {comparisonRoles.map((role, index) => (
              <button
                type="button"
                key={role.role}
                className={`career-comparison-tab ${(activeCompareRole?.role === role.role) ? "active" : ""}`}
                onClick={() => setSelectedCompareRole(role.role)}
              >
                <span className="career-comparison-tab-number">0{index + 1}</span>
                <span>{role.role}</span>
                <strong>{Number(role.match_score || 0).toFixed(1)}%</strong>
              </button>
            ))}
          </div>

          {activeCompareRole && (
            <motion.div
              className="career-comparison-detail"
              key={activeCompareRole.role}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="career-comparison-main">
                <div className="career-comparison-role-icon"><Target size={20} /></div>
                <div>
                  <span className="career-mini-label">CURRENT PROFILE FIT</span>
                  <h4>{activeCompareRole.role}</h4>
                  <p>{activeCompareRole.role === data?.recommended_role ? "This is your current AI-recommended direction." : "This role is another strong path based on your current profile."}</p>
                </div>
              </div>

              <div className="career-comparison-score">
                <strong>{Number(activeCompareRole.match_score || 0).toFixed(1)}%</strong>
                <span>profile match</span>
                <div className="career-comparison-score-track">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Number(activeCompareRole.match_score || 0), 100)}%` }}
                    transition={{ duration: .8 }}
                  />
                </div>
              </div>

              <div className="career-comparison-columns">
                <div className="career-comparison-box">
                  <div className="career-comparison-box-title"><CheckCircle2 size={16} /> Strengths already supporting this role</div>
                  {Array.isArray(activeCompareRole.strengths) && activeCompareRole.strengths.length > 0 ? (
                    activeCompareRole.strengths.slice(0, 4).map((item, index) => (
                      <div className="career-comparison-item" key={`${item.feature || item.skill || "strength"}-${index}`}>
                        <span>{item.skill || item.feature || "Skill"}</span>
                        <strong>{Number(item.score || 0).toFixed(0)}%</strong>
                      </div>
                    ))
                  ) : (
                    <div className="career-comparison-empty">Your current profile is being matched against this role's requirements.</div>
                  )}
                </div>

                <div className="career-comparison-box">
                  <div className="career-comparison-box-title"><Zap size={16} /> What to strengthen</div>
                  {Array.isArray(activeCompareRole.gaps) && activeCompareRole.gaps.length > 0 ? (
                    activeCompareRole.gaps.slice(0, 4).map((item, index) => (
                      <div className="career-comparison-item" key={`${item.feature || item.skill || "gap"}-${index}`}>
                        <span>{item.skill || item.feature || "Skill"}</span>
                        <strong>+{Number(item.gap || 0).toFixed(0)} pts</strong>
                      </div>
                    ))
                  ) : (
                    <div className="career-comparison-empty">Use the Priority Skills section below for your highest-impact improvement areas.</div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      <ResumeIntelligence
        studentId={studentId}
        recommendedRole={data?.recommended_role || dashboardData?.student?.preferred_role || "Data Analyst"}
      />


      <InterviewPreparation
        studentId={studentId}
        recommendedRole={data?.recommended_role || dashboardData?.student?.preferred_role || "Data Analyst"}
      />

      <CareerProgressTracker studentId={studentId} />


      <div className="career-intel-section">
        <div className="career-intel-title-row">
          <div>
            <div className="career-mini-label">PRIORITY SKILLS</div>
            <h3>What to improve next</h3>
          </div>
          <Zap size={21} />
        </div>

        <div className="career-gap-grid">
          {gaps.slice(0, 5).map((item, index) => (
            <motion.div
              className="career-gap-card"
              key={item.skill}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * .08 }}
            >
              <div className="career-gap-top">
                <div>
                  <strong>{item.skill_name}</strong>
                  <span>{item.status}</span>
                </div>
                <b>{Number(item.score || 0).toFixed(0)}%</b>
              </div>

              <div className="career-gap-track">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(Number(item.score || 0), 100)}%` }}
                  transition={{ duration: .8, delay: index * .08 }}
                />
              </div>

              <div className="career-gap-bottom">
                <span>Gap {Number(item.gap || 0).toFixed(0)}%</span>
                <span>Priority {Number(item.priority || 0).toFixed(1)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="career-roadmap">
        <div className="career-intel-title-row">
          <div>
            <div className="career-mini-label">PERSONALIZED ROADMAP</div>
            <h3>Your path from today to career-ready</h3>
          </div>
          <Map size={21} />
        </div>

        <div className="roadmap-line">
          {roadmap.map((step, index) => (
            <motion.div
              className="roadmap-step"
              key={`${step.feature}-${index}`}
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * .12 }}
            >
              <div className="roadmap-node">{index + 1}</div>

              <div className="roadmap-card">
                <div className="roadmap-card-header">
                  <span>PHASE {step.phase}</span>
                  <small>{step.estimated_weeks} weeks</small>
                </div>

                <h4>{step.skill}</h4>
                <p>{step.learning_resource}</p>

                <div className="roadmap-milestone">
                  <CheckCircle2 size={14} />
                  {step.milestone}
                </div>

                <div className="roadmap-score-row">
                  <span>Current {Number(step.current_score || 0).toFixed(0)}%</span>
                  <span>Target {Number(step.target_score || 75).toFixed(0)}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ShapExplanation({ data }) {

  const features = Array.isArray(data?.top_features)
    ? data.top_features
    : [];

  const positiveFactors = Array.isArray(data?.positive_factors)
    ? data.positive_factors
    : [];

  const negativeFactors = Array.isArray(data?.negative_factors)
    ? data.negative_factors
    : [];

  const maxImpact = Math.max(
    ...features.map((item) =>
      Math.abs(Number(item.shap_value) || 0)
    ),
    0.0001
  );

  const formatFeatureName = (name) => {
    if (!name) {
      return "Unknown Feature";
    }

    return String(name)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const renderFactor = (item, index) => {

    const value = Number(item.shap_value) || 0;
    const positive = value >= 0;

    const width = Math.max(
      8,
      Math.min(
        Math.abs(value) / maxImpact * 100,
        100
      )
    );

    return (
      <motion.div
        key={`${item.feature}-${index}`}
        initial={{
          opacity: 0,
          x: positive ? -24 : 24
        }}
        animate={{
          opacity: 1,
          x: 0
        }}
        transition={{
          delay: index * 0.07,
          duration: 0.45
        }}
        style={{
          padding: "16px 0",
          borderBottom:
            index === features.length - 1
              ? "none"
              : "1px solid rgba(255,255,255,0.07)"
        }}
      >

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "9px"
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              minWidth: 0
            }}
          >

            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                flexShrink: 0,
                background: positive
                  ? "#22c55e"
                  : "#ef4444",
                boxShadow: positive
                  ? "0 0 12px rgba(34,197,94,0.75)"
                  : "0 0 12px rgba(239,68,68,0.75)"
              }}
            />

            <strong
              style={{
                color: "#f8fafc",
                fontSize: "14px",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {formatFeatureName(item.feature)}
            </strong>

          </div>

          <span
            style={{
              flexShrink: 0,
              color: positive
                ? "#86efac"
                : "#fca5a5",
              fontSize: "13px",
              fontWeight: 700
            }}
          >
            {positive ? "+" : ""}
            {value.toFixed(4)}
          </span>

        </div>

        <div
          style={{
            height: "7px",
            width: "100%",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden"
          }}
        >

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${width}%` }}
            transition={{
              duration: 0.8,
              delay: index * 0.07
            }}
            style={{
              height: "100%",
              borderRadius: "999px",
              background: positive
                ? "linear-gradient(90deg,#16a34a,#4ade80)"
                : "linear-gradient(90deg,#dc2626,#fb7185)",
              boxShadow: positive
                ? "0 0 14px rgba(34,197,94,0.35)"
                : "0 0 14px rgba(239,68,68,0.35)"
            }}
          />

        </div>

      </motion.div>
    );
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          "minmax(0, 1.55fr) minmax(280px, 0.75fr)",
        gap: "22px",
        padding: "26px",
        borderRadius: "28px",
        border: "1px solid rgba(139,92,246,0.24)",
        background:
          "linear-gradient(145deg, rgba(124,58,237,0.10), rgba(255,255,255,0.025))",
        boxShadow:
          "0 25px 80px rgba(0,0,0,0.24)",
        backdropFilter: "blur(18px)"
      }}
    >

      <div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "8px"
          }}
        >

          <div
            style={{
              width: "38px",
              height: "38px",
              display: "grid",
              placeItems: "center",
              borderRadius: "12px",
              background: "rgba(139,92,246,0.14)",
              color: "#c4b5fd",
              boxShadow:
                "0 0 24px rgba(139,92,246,0.18)"
            }}
          >
            <Brain size={19} />
          </div>

          <div>
            <div
              style={{
                color: "#a78bfa",
                fontSize: "11px",
                letterSpacing: "0.12em",
                fontWeight: 700
              }}
            >
              MODEL EXPLANATION
            </div>

            <h3
              style={{
                margin: "3px 0 0",
                color: "#f8fafc",
                fontSize: "20px"
              }}
            >
              Top prediction factors
            </h3>
          </div>

        </div>

        <p
          style={{
            color: "#94a3b8",
            fontSize: "13px",
            lineHeight: 1.7,
            margin: "14px 0 2px"
          }}
        >
          Positive SHAP values push the model toward the
          placement prediction, while negative values push
          it in the opposite direction.
        </p>

        <div style={{ marginTop: "10px" }}>
          {features.length > 0 ? (
            features.map(renderFactor)
          ) : (
            <div
              style={{
                color: "#94a3b8",
                padding: "24px 0"
              }}
            >
              No SHAP factors were returned.
            </div>
          )}
        </div>

      </div>


      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px"
        }}
      >

        <div
          style={{
            padding: "22px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.035)",
            border: "1px solid rgba(255,255,255,0.08)"
          }}
        >

          <span
            style={{
              color: "#94a3b8",
              fontSize: "11px",
              letterSpacing: "0.12em"
            }}
          >
            BASE MODEL VALUE
          </span>

          <strong
            style={{
              display: "block",
              marginTop: "8px",
              color: "#c4b5fd",
              fontSize: "28px"
            }}
          >
            {Number(data?.base_value ?? 0).toFixed(4)}
          </strong>

        </div>


        <div
          style={{
            padding: "20px",
            borderRadius: "20px",
            background: "rgba(34,197,94,0.055)",
            border: "1px solid rgba(34,197,94,0.16)"
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#86efac",
              fontWeight: 700,
              fontSize: "13px"
            }}
          >
            <TrendingUp size={17} />
            Positive Factors
          </div>

          <strong
            style={{
              display: "block",
              marginTop: "10px",
              color: "#f8fafc",
              fontSize: "26px"
            }}
          >
            {positiveFactors.length}
          </strong>

          <span
            style={{
              color: "#94a3b8",
              fontSize: "12px"
            }}
          >
            factors supporting the prediction
          </span>

        </div>


        <div
          style={{
            padding: "20px",
            borderRadius: "20px",
            background: "rgba(239,68,68,0.055)",
            border: "1px solid rgba(239,68,68,0.16)"
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#fca5a5",
              fontWeight: 700,
              fontSize: "13px"
            }}
          >
            <Activity size={17} />
            Negative Factors
          </div>

          <strong
            style={{
              display: "block",
              marginTop: "10px",
              color: "#f8fafc",
              fontSize: "26px"
            }}
          >
            {negativeFactors.length}
          </strong>

          <span
            style={{
              color: "#94a3b8",
              fontSize: "12px"
            }}
          >
            factors reducing the prediction
          </span>

        </div>


        <div
          style={{
            padding: "20px",
            borderRadius: "20px",
            background:
              "linear-gradient(135deg, rgba(124,58,237,0.14), rgba(59,130,246,0.06))",
            border: "1px solid rgba(139,92,246,0.18)"
          }}
        >

          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start"
            }}
          >
            <Sparkles
              size={19}
              color="#c4b5fd"
              style={{ marginTop: "2px", flexShrink: 0 }}
            />

            <div>
              <strong
                style={{
                  color: "#f8fafc",
                  fontSize: "13px"
                }}
              >
                AI Explanation
              </strong>

              <p
                style={{
                  margin: "7px 0 0",
                  color: "#a5b4fc",
                  fontSize: "12px",
                  lineHeight: 1.65
                }}
              >
                The model's prediction is influenced by
                the combination of the student's strongest
                positive and negative factors shown above.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}



/* =====================================================
   3D SKILL UNIVERSE
===================================================== */

function SkillUniverse({ skills }) {

  const coreParticles = [
    [-1.8, 0.7, 0.2],
    [1.7, 0.5, -0.2],
    [-1.2, -1.4, 0.3],
    [1.1, -1.5, -0.3],
    [0.2, 1.8, 0.1],
    [-0.2, -1.9, -0.1],
    [2.0, -0.2, 0.4],
    [-2.0, 0.1, -0.4],
    [0.8, 1.4, 0.7],
    [-0.9, 1.35, -0.7],
    [1.35, -0.9, 0.5],
    [-1.4, -0.8, -0.5]
  ];

  return (
    <group>

      {/* =========================
          PREMIUM AI CORE
      ========================= */}
      <Float
        speed={1.15}
        rotationIntensity={0.25}
        floatIntensity={0.45}
      >
        {/* Outer atmospheric glow */}
        <mesh>
          <sphereGeometry args={[1.42, 48, 48]} />
          <meshBasicMaterial
            color="#7c3aed"
            transparent
            opacity={0.055}
            depthWrite={false}
          />
        </mesh>

        {/* Soft energy shell */}
        <mesh>
          <sphereGeometry args={[1.24, 64, 64]} />
          <meshStandardMaterial
            color="#8b5cf6"
            emissive="#6d28d9"
            emissiveIntensity={2.5}
            roughness={0.18}
            metalness={0.35}
            transparent
            opacity={0.18}
            depthWrite={false}
          />
        </mesh>

        {/* Main luminous core */}
        <mesh>
          <sphereGeometry args={[0.98, 64, 64]} />
          <meshStandardMaterial
            color="#6d28d9"
            emissive="#7c3aed"
            emissiveIntensity={3.1}
            roughness={0.12}
            metalness={0.42}
          />
        </mesh>

        {/* Inner energy nucleus */}
        <mesh>
          <sphereGeometry args={[0.57, 48, 48]} />
          <meshStandardMaterial
            color="#c4b5fd"
            emissive="#a855f7"
            emissiveIntensity={4.5}
            roughness={0.08}
            metalness={0.18}
            transparent
            opacity={0.72}
          />
        </mesh>

        <pointLight
          color="#a855f7"
          intensity={3.8}
          distance={5.5}
        />

        {/* Core label */}
        <Text
          position={[0, 0.02, 1.02]}
          fontSize={0.24}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.018}
          outlineColor="#17052d"
        >
          AI CORE
        </Text>

        <Text
          position={[0, -0.32, 1.02]}
          fontSize={0.085}
          color="#ddd6fe"
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.08}
        >
          CAREER INTELLIGENCE
        </Text>
      </Float>

      {/* =========================
          MULTI-LAYER ENERGY RINGS
      ========================= */}
      <Float
        speed={0.7}
        rotationIntensity={0.12}
        floatIntensity={0.12}
      >
        <mesh rotation={[Math.PI / 2.15, 0.18, 0.15]}>
          <torusGeometry args={[1.48, 0.018, 16, 128]} />
          <meshBasicMaterial
            color="#a855f7"
            transparent
            opacity={0.62}
          />
        </mesh>

        <mesh rotation={[0.55, Math.PI / 2.7, 0.25]}>
          <torusGeometry args={[1.68, 0.011, 16, 128]} />
          <meshBasicMaterial
            color="#8b5cf6"
            transparent
            opacity={0.38}
          />
        </mesh>

        <mesh rotation={[1.12, 0.18, Math.PI / 3]}>
          <torusGeometry args={[1.87, 0.008, 16, 128]} />
          <meshBasicMaterial
            color="#c084fc"
            transparent
            opacity={0.23}
          />
        </mesh>
      </Float>

      {/* Tiny orbiting energy particles around the AI core */}
      {coreParticles.map(([x, y, z], index) => (
        <Float
          key={`core-particle-${index}`}
          speed={0.7 + index * 0.035}
          rotationIntensity={0.2}
          floatIntensity={0.35}
        >
          <mesh position={[x, y, z]}>
            <sphereGeometry args={[index % 3 === 0 ? 0.055 : 0.035, 16, 16]} />
            <meshBasicMaterial
              color={index % 2 === 0 ? "#c084fc" : "#8b5cf6"}
              transparent
              opacity={0.72}
            />
          </mesh>
        </Float>
      ))}

      {/* =========================
          SKILL NODES
      ========================= */}
      {skills.map((skill, index) => (
        <SkillNode
          key={`${skill.skill}-${index}`}
          skill={skill}
          index={index}
          total={skills.length}
        />
      ))}

    </group>
  );
}


/* =====================================================
   INDIVIDUAL 3D SKILL NODE
===================================================== */

function SkillNode({
  skill,
  index,
  total
}) {

  const angle =
    (index / Math.max(total, 1)) *
    Math.PI *
    2;

  const radius = 3.1;

  const x =
    Math.cos(angle) * radius;

  const y =
    Math.sin(angle) * radius;

  const z =
    Math.sin(angle * 2) * 0.8;


  const score =
    Number(skill.student_score) || 0;


  let nodeColor = "#ef4444";

  if (score >= 75) {

    nodeColor = "#22c55e";

  } else if (score >= 50) {

    nodeColor = "#f59e0b";

  }


  return (

    <SkillNodeAnimated
      x={x}
      y={y}
      z={z}
      skill={skill}
      score={score}
      color={nodeColor}
    />

  );
}



/* =====================================================
   ANIMATED NODE
===================================================== */

function SkillNodeAnimated({
  x,
  y,
  z,
  skill,
  score,
  color
}) {

  return (

    <group position={[x, y, z]}>


      {/* CONNECTION */}

      <ConnectionLine
        target={[
          -x,
          -y,
          -z
        ]}
        color={color}
      />


      <Float
        speed={2}
        rotationIntensity={0.6}
        floatIntensity={0.7}
      >

        <mesh>

          <sphereGeometry
            args={[
              0.45 +
                score / 500,
              32,
              32
            ]}
          />

          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.6}
          />

        </mesh>


        <Text
          position={[0, 0.72, 0]}
          fontSize={0.18}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {skill.skill}
        </Text>


        <Text
          position={[0, -0.7, 0]}
          fontSize={0.16}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {score}%
        </Text>

      </Float>

    </group>

  );
}



/* =====================================================
   CONNECTION LINE
===================================================== */

function ConnectionLine({
  target,
  color
}) {

  const points = [
    [0, 0, 0],
    target,
  ];

  return (

    <line>

      <bufferGeometry>

        <bufferAttribute
          attach="attributes-position"
          count={2}
          array={
            new Float32Array([
              0,
              0,
              0,
              target[0],
              target[1],
              target[2],
            ])
          }
          itemSize={3}
        />

      </bufferGeometry>


      <lineBasicMaterial
        color={color}
        transparent
        opacity={0.2}
      />

    </line>

  );
}



/* =====================================================
   ANIMATED PROBABILITY
===================================================== */

function AnimatedProbability({ value }) {

  const [displayValue, setDisplayValue] =
    useState(0);


  useEffect(() => {

    const target =
      Number(value) || 0;

    let current = 0;

    const duration = 1400;

    const intervalTime = 20;

    const increment =
      target /
      (duration / intervalTime);


    const timer =
      setInterval(() => {

        current += increment;

        if (current >= target) {

          current = target;

          clearInterval(timer);

        }

        setDisplayValue(current);

      }, intervalTime);


    return () => {

      clearInterval(timer);

    };

  }, [value]);


  const percentage =
    Math.min(
      Math.max(displayValue, 0),
      100
    );


  return (

    <div className="probability-wrapper">

      <motion.div
        className="probability-ring"

        initial={{
          background:
            "conic-gradient(#7c3aed 0deg, rgba(255,255,255,0.05) 0deg)"
        }}

        animate={{
          background: `
            conic-gradient(
              #8b5cf6 ${percentage * 3.6}deg,
              rgba(255,255,255,0.06)
              ${percentage * 3.6}deg
            )
          `
        }}

        transition={{
          duration: 1.4,
        }}
      >

        <div className="probability-inner">

          <Target size={25} />

          <strong>
            {displayValue.toFixed(2)}%
          </strong>

          <span>
            Placement
          </span>

        </div>

      </motion.div>


      <div className="ring-glow"></div>

    </div>

  );
}



/* =====================================================
   SALARY INTELLIGENCE
===================================================== */

function SalaryIntelligenceSkeleton() {
  return (
    <div className="salary-intelligence-panel salary-loading">
      <motion.div
        className="salary-loading-orb"
        animate={{ scale: [1, 1.12, 1], opacity: [.5, 1, .5] }}
        transition={{ duration: 1.4, repeat: Infinity }}
      >
        <TrendingUp size={25} />
      </motion.div>

      <div>
        <strong>Calculating package projection...</strong>
        <p>AI is evaluating the current student profile.</p>
      </div>
    </div>
  );
}

function SalaryIntelligencePanel({ data, placementProbability }) {
  const packageLpa = Number(data?.predicted_package_lpa || 0);
  const probability = Number(placementProbability || 0);
  const readiness = Math.min(100, Math.max(0, probability));
  const estimatedMin = Math.max(0, packageLpa * 0.82);
  const estimatedMax = packageLpa * 1.18;

  return (
    <div className="salary-intelligence-panel">
      <div className="salary-main-card">
        <div className="salary-orbit-glow" />
        <div className="salary-mini-label">AI PACKAGE PROJECTION</div>
        <div className="salary-value">
          <span>₹</span>{packageLpa.toFixed(2)}<small> LPA</small>
        </div>
        <p>Estimated package based on the current profile.</p>

        <div className="salary-readiness">
          <div className="salary-readiness-head">
            <span>Placement readiness signal</span>
            <strong>{readiness.toFixed(1)}%</strong>
          </div>
          <div className="salary-readiness-track">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${readiness}%` }}
              transition={{ duration: 1.1 }}
            />
          </div>
        </div>
      </div>

      <div className="salary-analysis-card">
        <div className="salary-analysis-header">
          <div>
            <div className="salary-mini-label">PACKAGE RANGE</div>
            <h3>Projected career value</h3>
          </div>
          <BriefcaseBusiness size={22} />
        </div>

        <div className="salary-range">
          <div>
            <span>Estimated lower range</span>
            <strong>₹{estimatedMin.toFixed(2)} LPA</strong>
          </div>
          <div>
            <span>Model projection</span>
            <strong>₹{packageLpa.toFixed(2)} LPA</strong>
          </div>
          <div>
            <span>Estimated upper range</span>
            <strong>₹{estimatedMax.toFixed(2)} LPA</strong>
          </div>
        </div>

        <div className="salary-disclaimer">
          <Sparkles size={15} />
          This is a model-based estimate, not a guaranteed offer or market quote.
        </div>
      </div>

    </div>
  );
}


/* =====================================================
   FEATURE CARD
===================================================== */

function FeatureCard({
  icon,
  title,
  text
}) {

  return (

    <motion.div
      className="feature-card"

      whileHover={{
        y: -8,
      }}

      transition={{
        duration: 0.25,
      }}
    >

      <div className="feature-icon">
        {icon}
      </div>


      <h3>
        {title}
      </h3>


      <p>
        {text}
      </p>


      <ArrowRight size={17} />

    </motion.div>

  );
}



/* =====================================================
   PIPELINE CARD
===================================================== */

function PipelineCard({
  number,
  title,
  text
}) {

  return (

    <motion.div
      className="pipeline-card"

      whileHover={{
        y: -6,
      }}
    >

      <b>
        {number}
      </b>

      <strong>
        {title}
      </strong>

      <span>
        {text}
      </span>

    </motion.div>

  );
}


export default App;