"""Unit tests for instructor certificates: org-admin scoping, skipping and rendering."""
from datetime import datetime
from unittest.mock import MagicMock

from pythonFunctions.create_instructor_certificates import (
    build_certificate_context,
    create_instructor_certificates,
    may_manage_course,
)

TEMPLATE = "<html><body>{{ full_name }} {{ course_name }}<ul>{{ session_entries }}</ul></body></html>"


def _course(course_id=4, program_type="COURSES", admins=None, template=TEMPLATE, image_url=None):
    return {
        "id": course_id,
        "title": "ML",
        "ects": "5",
        "Program": {
            "title": "WiSe",
            "type": program_type,
            "attendanceCertificateTemplateURL": image_url,
            "InstructorCertificateTemplate": {"html": template} if template else None,
            "Organization": {"OrganizationAdmins": admins or []},
        },
        "CourseInstructors": [
            {"id": 1, "User": {"id": "u1", "firstName": "Ada", "lastName": "L"}},
            {"id": 2, "User": {"id": "u2", "firstName": "Bo", "lastName": "K"}},
        ],
        "Sessions": [{"title": "Intro"}, {"title": "<b>Deep</b>"}],
    }


def _args(course_ids, role="admin", user_id="admin-user"):
    return {"input": {"courseIds": course_ids}, "session_variables": {"x-hasura-role": role, "x-hasura-user-id": user_id}}


class TestMayManageCourse:
    def test_admin_always(self):
        assert may_manage_course(_course(), "admin")

    def test_org_admin_needs_matching_capability(self):
        assert may_manage_course(_course(admins=[{"canManageCourses": True}]), "org_admin")
        assert not may_manage_course(_course(admins=[{"canManageEvents": True}]), "org_admin")
        assert not may_manage_course(_course(admins=[]), "org_admin")

    def test_settings_admin_manages_every_type(self):
        assert may_manage_course(_course(program_type="EVENTS", admins=[{"canManageSettings": True}]), "org_admin")


def test_context_escapes_session_titles():
    context = build_certificate_context(_course(), {"firstName": "Ada", "lastName": "L"}, "", datetime(2027, 2, 1))
    assert context["full_name"] == "Ada L"
    assert context["session_entries"] == "<li>Intro</li><li>&lt;b&gt;Deep&lt;/b&gt;</li>"
    assert context["date"] == "01.02.2027"


def test_generates_one_certificate_per_instructor_and_skips_others():
    client = MagicMock()
    client.fetch_instructor_certificate_courses.return_value = [
        _course(4),
        _course(5, template=None),
    ]
    storage = MagicMock()
    result = create_instructor_certificates(_args([4, 5, 99]), client, storage)
    assert result["success"] is True
    assert result["count"] == 2
    assert sorted(result["skippedCourseIds"]) == [5, 99]
    client.set_instructor_certificate_url.assert_any_call(1, "u1/4/instructor_certificate.pdf")
    client.set_instructor_certificate_url.assert_any_call(2, "u2/4/instructor_certificate.pdf")
    storage.download_image_from_gcs.assert_not_called()


def test_org_admin_without_capability_is_skipped():
    client = MagicMock()
    client.fetch_instructor_certificate_courses.return_value = [_course(4, admins=[])]
    result = create_instructor_certificates(_args([4], role="org_admin"), client, MagicMock())
    assert result["count"] == 0
    assert result["skippedCourseIds"] == [4]
    client.set_instructor_certificate_url.assert_not_called()


def test_missing_background_image_skips_course():
    client = MagicMock()
    client.fetch_instructor_certificate_courses.return_value = [_course(4, image_url="programs/x.png")]
    storage = MagicMock()
    storage.download_image_from_gcs.side_effect = FileNotFoundError("x.png")
    result = create_instructor_certificates(_args([4]), client, storage)
    assert result["skippedCourseIds"] == [4]
    client.set_instructor_certificate_url.assert_not_called()


def test_render_escapes_names_but_keeps_session_list():
    import pythonFunctions.create_instructor_certificates as module
    captured = {}
    original = module.pisa.CreatePDF

    def fake_create_pdf(html, dest):
        captured["html"] = html
        return original(html, dest=dest)

    module.pisa.CreatePDF = fake_create_pdf
    try:
        context = build_certificate_context(_course(), {"firstName": "<b>Ada</b>", "lastName": ""}, "", datetime(2027, 2, 1))
        module.render_pdf(TEMPLATE, context)
    finally:
        module.pisa.CreatePDF = original
    assert "&lt;b&gt;Ada&lt;/b&gt;" in captured["html"]
    assert "<li>Intro</li>" in captured["html"]
