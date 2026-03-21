from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .serializers import UploadSerializer
from ai_pipeline.parser import parse_resume, parse_jd, analyze_skill_gap
from ai_pipeline.learning_path import generate_learning_path


@api_view(['GET'])
def health_check(request):
    return Response({
        "status": "ok",
        "message": "Adaptive Onboarding Engine API is running."
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def analyze_and_generate(request):
    """
    POST /api/analyze/
    Accepts EITHER:
      - PDF files  : multipart/form-data with resume + job_description files
      - Plain text : JSON with resume_text + jd_text fields
    """

    # ── Detect input mode ─────────────────────────────────────
    resume_file = request.FILES.get('resume')
    jd_file     = request.FILES.get('job_description')
    resume_text = request.data.get('resume_text', '').strip()
    jd_text     = request.data.get('jd_text', '').strip()

    has_files = resume_file and jd_file
    has_text  = resume_text and jd_text

    if not has_files and not has_text:
        return Response(
            {"error": "Provide either PDF files (resume + job_description) or text (resume_text + jd_text)."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # ── STEP 2: Parse resume ───────────────────────────────────
    try:
        if has_files:
            resume_data = parse_resume(resume_file)
        else:
            resume_data = parse_resume_text(resume_text)
    except Exception as e:
        return Response(
            {"error": "Failed to parse resume.", "details": str(e)},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    # ── STEP 3: Parse job description ─────────────────────────
    try:
        if has_files:
            jd_data = parse_jd(jd_file)
        else:
            jd_data = parse_jd_text(jd_text)
    except Exception as e:
        return Response(
            {"error": "Failed to parse job description.", "details": str(e)},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    # ── STEP 4: Skill gap analysis ─────────────────────────────
    try:
        skill_gap_data = analyze_skill_gap(resume_data, jd_data)
    except Exception as e:
        return Response(
            {"error": "Skill gap analysis failed.", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # ── STEP 5: Generate learning path ─────────────────────────
    try:
        learning_path = generate_learning_path(skill_gap_data)
    except Exception as e:
        return Response(
            {"error": "Learning path generation failed.", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # ── STEP 6: Return response ────────────────────────────────
    return Response({
        "candidate_name":   resume_data.get("name", "Candidate"),
        "experience_years": resume_data.get("experience_years", 0),
        "experience_level": resume_data.get("experience_level", "mid"),
        "job_title":        jd_data.get("job_title", "Target Role"),
        "candidate_skills": resume_data.get("skills", []),
        "required_skills":  jd_data.get("required_skills", []),
        "skill_gaps":       skill_gap_data.get("gaps", []),
        "learning_path":    learning_path.get("steps", []),
        "reasoning_trace":  learning_path.get("reasoning_trace", ""),
        "summary":          learning_path.get("summary", {}),
    }, status=status.HTTP_200_OK)


# ── Text parsers (no PDF needed) ───────────────────────────────

def parse_resume_text(text: str) -> dict:
    """Same as parse_resume() but takes plain text instead of PDF."""
    from groq import Groq
    import os, json

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    prompt = f"""
You are a resume parser. Extract information from the resume text below.

Resume Text:
{text}

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
- skills should match O*NET skill names where possible
- Return ONLY the JSON, no explanation, no markdown
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def parse_jd_text(text: str) -> dict:
    """Same as parse_jd() but takes plain text instead of PDF."""
    from groq import Groq
    import os, json

    client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    prompt = f"""
You are a job description parser. Extract information from the job description below.

Job Description Text:
{text}

Return ONLY a JSON object in this exact format, nothing else:
{{
    "job_title": "title of the job",
    "required_skills": ["skill1", "skill2", "skill3"],
    "experience_required": "X-Y years"
}}

Rules:
- required_skills must be a list of all technical and soft skills mentioned
- job_title must be the exact job title from the description
- skills should match O*NET skill names where possible
- Return ONLY the JSON, no explanation, no markdown
"""
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())