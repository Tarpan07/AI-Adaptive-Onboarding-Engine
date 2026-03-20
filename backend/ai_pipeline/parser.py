import pdfplumber
from groq import Groq
import json
import os


def _extract_text_from_pdf(pdf_file) -> str:
    text = ""
    with pdfplumber.open(pdf_file) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()


def _get_client():
    return Groq(api_key=os.getenv("GROQ_API_KEY"))


def parse_resume(pdf_file) -> dict:
    raw_text = _extract_text_from_pdf(pdf_file)
    client = _get_client()

    prompt = f"""
You are a resume parser. Extract information from the resume text below.

Resume Text:
{raw_text}

Return ONLY a JSON object in this exact format, nothing else:
{{
    "name": "candidate full name",
    "skills": ["skill1", "skill2", "skill3"],
    "experience_years": 0,
    "experience_level": "fresher"
}}

Rules:
- skills must be a list of technical and soft skills found in the resume
- experience_years must be a number (0 if fresher)
- experience_level must be exactly one of: "fresher", "mid", "senior"
- skills should match O*NET skill names where possible for example:
  Python → Programming, Problem Solving → Complex Problem Solving
- Return ONLY the JSON, no explanation, no markdown
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    # Clean response in case LLM adds markdown
    raw_output = response.choices[0].message.content.strip()
    if raw_output.startswith("```"):
        raw_output = raw_output.split("```")[1]
        if raw_output.startswith("json"):
            raw_output = raw_output[4:]
    raw_output = raw_output.strip()

    result = json.loads(raw_output)
    return result


def parse_jd(pdf_file) -> dict:
    raw_text = _extract_text_from_pdf(pdf_file)
    client = _get_client()

    prompt = f"""
You are a job description parser. Extract information from the job description below.

Job Description Text:
{raw_text}

Return ONLY a JSON object in this exact format, nothing else:
{{
    "job_title": "title of the job",
    "required_skills": ["skill1", "skill2", "skill3"],
    "experience_required": "X-Y years"
}}

Rules:
- required_skills must be a list of all technical and soft skills mentioned
- job_title must be the exact job title from the description
- experience_required must be the experience range mentioned
- skills should match O*NET skill names where possible for example:
  Python → Programming, Problem Solving → Complex Problem Solving
- Return ONLY the JSON, no explanation, no markdown
"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )

    # Clean response in case LLM adds markdown
    raw_output = response.choices[0].message.content.strip()
    if raw_output.startswith("```"):
        raw_output = raw_output.split("```")[1]
        if raw_output.startswith("json"):
            raw_output = raw_output[4:]
    raw_output = raw_output.strip()

    result = json.loads(raw_output)
    return result


def analyze_skill_gap(resume_data: dict, jd_data: dict) -> dict:
    candidate_skills = set(
        skill.lower() for skill in resume_data.get("skills", [])
    )
    required_skills = set(
        skill.lower() for skill in jd_data.get("required_skills", [])
    )

    matched = candidate_skills & required_skills
    gaps = required_skills - candidate_skills

    if len(required_skills) == 0:
        gap_severity = "low"
    else:
        gap_ratio = len(gaps) / len(required_skills)
        if gap_ratio <= 0.3:
            gap_severity = "low"
        elif gap_ratio <= 0.6:
            gap_severity = "medium"
        else:
            gap_severity = "high"

    return {
        "matched_skills": sorted(list(matched)),
        "gaps": sorted(list(gaps)),
        "gap_severity": gap_severity,
        "job_title": jd_data.get("job_title", "Professional Role")
    }
