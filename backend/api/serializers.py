from rest_framework import serializers


class UploadSerializer(serializers.Serializer):
    """
    Validates the incoming POST /api/analyze/ request.

    Ensures:
    - Both resume and job_description fields are present
    - Both files are PDFs (not images, docs, etc.)
    - Neither file is empty
    """
    resume = serializers.FileField()
    job_description = serializers.FileField()

    def validate_resume(self, value):
        # Check file extension
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError(
                "Resume must be a PDF file. Got: " + value.name
            )
        # Check file is not empty
        if value.size == 0:
            raise serializers.ValidationError("Resume file is empty.")
        return value

    def validate_job_description(self, value):
        # Check file extension
        if not value.name.lower().endswith('.pdf'):
            raise serializers.ValidationError(
                "Job Description must be a PDF file. Got: " + value.name
            )
        # Check file is not empty
        if value.size == 0:
            raise serializers.ValidationError("Job Description file is empty.")
        return value