from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .serializers import UploadSerializer

# --- ta's module: PDF parsing + skill gap analysis ---
from ai_pipeline.parser import parse_resume, parse_jd, analyze_skill_gap

# --- bo's module: RAG-based learning path generation ---
from ai_pipeline.learning_path import generate_learning_path


@api_view(['GET'])
def health_check(request):
    """
    GET /api/health/
    Simple ping endpoint — React frontend calls this on load
    to confirm the Django server is up and running.
    """
    return Response({
        "status": "ok",
        "message": "Adaptive Onboarding Engine API is running."
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
def analyze_and_generate(request):
    """
    POST /api/analyze/
    --------------------------------------------------
    The main endpoint. Accepts resume + JD as PDF uploads,
    runs the full AI pipeline, and returns a personalized
    learning roadmap.

    Request (multipart/form-data):
        resume          : PDF file  — candidate's resume
        job_description : PDF file  — target job description

    Response (JSON):
        candidate_skills : list[str]  — skills found in resume
        required_skills  : list[str]  — skills required by JD
        skill_gaps       : list[str]  — skills missing from resume
        learning_path    : list[dict] — ordered course recommendations
    --------------------------------------------------
    """

    # ── STEP 1: Validate incoming files ──────────────────────────────
    serializer = UploadSerializer(data=request.FILES)
    if not serializer.is_valid():
        return Response(
            {"error": "Invalid input.", "details": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )

    resume_file = serializer.validated_data['resume']
    jd_file = serializer.validated_data['job_description']

    # ── STEP 2: Parse resume (ta's responsibility) ────────────────────
    # ta reads the PDF using pdfplumber and returns structured JSON
    try:
        resume_data = parse_resume(resume_file)
    except Exception as e:
        return Response(
            {"error": "Failed to parse resume.", "details": str(e)},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    # ── STEP 3: Parse job description (ta's responsibility) ───────────
    try:
        jd_data = parse_jd(jd_file)
    except Exception as e:
        return Response(
            {"error": "Failed to parse job description.", "details": str(e)},
            status=status.HTTP_422_UNPROCESSABLE_ENTITY
        )

    # ── STEP 4: Run skill gap analysis (ta's responsibility) ──────────
    try:
        skill_gap_data = analyze_skill_gap(resume_data, jd_data)
    except Exception as e:
        return Response(
            {"error": "Skill gap analysis failed.", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # ── STEP 5: Generate learning path (bo's responsibility) ──────────
    # bo uses RAG + LLM to recommend courses strictly from the catalog
    try:
        learning_path = generate_learning_path(skill_gap_data)
    except Exception as e:
        return Response(
            {"error": "Learning path generation failed.", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # ── STEP 6: Return final response to React frontend ───────────────
    # ── STEP 6: Return final response to React frontend ───────────────
    return Response({
        "candidate_skills": resume_data.get("skills", []),
        "required_skills":  jd_data.get("required_skills", []),
        "skill_gaps":       skill_gap_data.get("gaps", []),
        "learning_path":    learning_path.get("steps", []),
        "reasoning_trace":  learning_path.get("reasoning_trace", ""),
        "summary":          learning_path.get("summary", {}),
    }, status=status.HTTP_200_OK)