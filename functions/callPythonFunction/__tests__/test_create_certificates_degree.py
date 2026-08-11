"""Unit tests for degree certificate generation.

A degree certificate is an achievement certificate for a course in a Program of
type DEGREES. It lists the degree's completed components instead of learning
goals plus a practical project, and it is only issued once the thresholds
configured on the degree course (Course.requiredEcts / Course.requiredEventCount)
are met. Regression guard for the refactor that dropped this branch and made
every degree certificate fail with MISSING_COURSE_DATA.
"""
import pytest

from pythonFunctions.create_certificates import (
    CertificateCreator,
    CertificateError,
    assert_degree_requirements,
    degree_requirement_shortfall,
    degree_thresholds,
    format_ects,
    is_degree_certificate,
    summarize_degree_participations,
)


def _part(
    title,
    ects,
    program_title="Winter 2024",
    program_type="COURSES",
    cert=True,
    course_id=1,
):
    """One row as returned by EduHubClient.fetch_degree_participations."""
    return {
        "courseId": course_id,
        "title": title,
        "ects": ects,
        "programTitle": program_title,
        "programType": program_type,
        "hasAchievementCertificate": cert,
    }


def _event(title="Coding.Waterkant 2026", course_id=9, program_type="EVENTS",
           program_short_title="EVENTS"):
    row = _part(
        title,
        "NONE",
        program_title="Events",
        program_type=program_type,
        cert=False,
        course_id=course_id,
    )
    row["programShortTitle"] = program_short_title
    return row


def _degree_enrollment(
    user_id="u1",
    required_ects=12.5,
    required_event_count=1,
    learning_goals=None,
    ects="NONE",
    project_authors=None,
    program_type="DEGREES",
):
    return {
        "User": {
            "id": user_id,
            "firstName": "Wiebke",
            "lastName": "Engler",
            "ProjectAuthors": project_authors or [],
        },
        "Course": {
            "id": 158,
            "title": "Machine Learning Degree",
            "ects": ects,
            "learningGoals": learning_goals,
            "requiredEcts": required_ects,
            "requiredEventCount": required_event_count,
            "Program": {"id": 2, "title": "Degrees", "type": program_type},
        },
    }


class TestFormatEcts:
    @pytest.mark.parametrize(
        "value,expected",
        [
            ("12,5", "12.5"),
            ("12.5", "12.5"),
            (12.5, "12.5"),
            ("5", "5.0"),
            (5, "5.0"),
            ("NONE", "0"),
            ("none", "0"),
            (None, "0"),
            ("", "0"),
            ("abc", "0"),
        ],
    )
    def test_formats_free_text_ects(self, value, expected):
        assert format_ects(value) == expected


class TestIsDegreeCertificate:
    def test_achievement_on_degrees_program(self):
        assert is_degree_certificate("achievement", [_degree_enrollment()]) is True

    def test_attendance_is_never_a_degree(self):
        assert is_degree_certificate("attendance", [_degree_enrollment()]) is False

    def test_regular_course_is_not_a_degree(self):
        enrollment = _degree_enrollment(program_type="COURSES")
        assert is_degree_certificate("achievement", [enrollment]) is False

    def test_legacy_short_title_is_not_used_as_discriminator(self):
        """The free-text Program.shortTitle must not resurrect the old rule."""
        enrollment = _degree_enrollment(program_type="COURSES")
        enrollment["Course"]["Program"]["shortTitle"] = "DEGREES"
        assert is_degree_certificate("achievement", [enrollment]) is False

    def test_missing_data_is_not_a_degree(self):
        assert is_degree_certificate("achievement", []) is False
        assert is_degree_certificate("achievement", [{}]) is False


class TestSummarizeDegreeParticipations:
    def test_passed_course_line_format(self):
        summary = summarize_degree_participations([_part("Intro to ML", "5")])
        assert summary["passed"] == ["Intro to ML (Winter 2024) (5.0 ECTS)"]
        assert summary["ects_total"] == 5.0

    def test_german_decimal_comma_in_course_ects(self):
        summary = summarize_degree_participations([_part("Data Science", "12,5")])
        assert summary["passed"] == ["Data Science (Winter 2024) (12.5 ECTS)"]
        assert summary["ects_total"] == 12.5

    def test_event_line_format(self):
        summary = summarize_degree_participations([_event()])
        assert summary["events"] == ["Coding.Waterkant 2026 (Hackathon)"]
        assert summary["event_count"] == 1

    def test_events_are_listed_after_passed_courses(self):
        summary = summarize_degree_participations(
            [_event(), _part("Intro to ML", "5")]
        )
        assert summary["entries"] == [
            "Intro to ML (Winter 2024) (5.0 ECTS)",
            "Coding.Waterkant 2026 (Hackathon)",
        ]

    def test_none_ects_does_not_raise(self):
        """`Course.ects` defaults to the literal 'NONE'; float('NONE') used to crash."""
        summary = summarize_degree_participations(
            [_event(), _part("Hackathon prep", "NONE")]
        )
        assert summary["ects_total"] == 0.0

    def test_only_certified_courses_count_and_are_listed(self):
        summary = summarize_degree_participations(
            [_part("Passed", "5"), _part("Not passed", "5", cert=False)]
        )
        assert summary["ects_total"] == 5.0
        assert summary["passed"] == ["Passed (Winter 2024) (5.0 ECTS)"]

    def test_events_count_without_certificate(self):
        summary = summarize_degree_participations([_event()])
        assert summary["ects_total"] == 0.0
        assert summary["event_count"] == 1

    def test_legacy_program_without_events_type_still_counts(self):
        """DegreeParticipationStats falls back to the free-text Program.shortTitle for
        programs predating Program.type; the gate has to match or it would refuse a
        participant the admin table shows as qualified."""
        legacy = _event(program_type="COURSES", program_short_title="EVENTS")
        summary = summarize_degree_participations([legacy])
        assert summary["event_count"] == 1
        assert summary["events"] == ["Coding.Waterkant 2026 (Hackathon)"]

    def test_regular_course_is_not_an_event(self):
        summary = summarize_degree_participations([_part("Intro to ML", "5")])
        assert summary["event_count"] == 0

    def test_empty_input(self):
        for participations in ([], None):
            summary = summarize_degree_participations(participations)
            assert summary["entries"] == []
            assert summary["ects_total"] == 0.0
            assert summary["event_count"] == 0


class TestDegreeRequirementShortfall:
    def test_exact_match_passes(self):
        assert degree_requirement_shortfall(12.5, 1, 12.5, 1) is None

    def test_summed_float_ects_still_reaches_threshold(self):
        summary = summarize_degree_participations(
            [
                _part("A", "2,5"),
                _part("B", "5"),
                _part("C", "5"),
                _event(),
            ]
        )
        assert (
            degree_requirement_shortfall(
                summary["ects_total"], summary["event_count"], 12.5, 1
            )
            is None
        )

    def test_both_requirements_missed(self):
        assert (
            degree_requirement_shortfall(10.0, 0, 12.5, 1)
            == "10.0 of 12.5 ECTS, 0 of 1 events"
        )

    def test_only_ects_missed(self):
        assert degree_requirement_shortfall(10.0, 3, 12.5, 1) == "10.0 of 12.5 ECTS"

    def test_only_events_missed(self):
        assert degree_requirement_shortfall(20.0, 0, 12.5, 1) == "0 of 1 events"

    def test_null_thresholds_are_not_checked(self):
        assert degree_requirement_shortfall(0.0, 0, None, None) is None

    def test_partially_configured_thresholds(self):
        assert degree_requirement_shortfall(0.0, 0, None, 1) == "0 of 1 events"
        assert degree_requirement_shortfall(0.0, 3, 12.5, None) == "0.0 of 12.5 ECTS"

    def test_thresholds_serialized_as_strings(self):
        """Hasura may return a `numeric` column as a JSON string."""
        required_ects, required_event_count = degree_thresholds(
            {"requiredEcts": "12.5", "requiredEventCount": "1"}
        )
        assert degree_requirement_shortfall(12.5, 1, required_ects, required_event_count) is None


class TestAssertDegreeRequirements:
    _passing = [_part("A", "5"), _part("B", "5"), _part("C", "2,5"), _event()]

    def test_no_raise_when_all_participants_qualify(self):
        enrollments = [_degree_enrollment("u1"), _degree_enrollment("u2")]
        assert_degree_requirements(
            enrollments, {"u1": self._passing, "u2": self._passing}
        )

    def test_raises_naming_every_failing_participant(self):
        enrollments = [_degree_enrollment(f"u{i}") for i in range(1, 6)]
        participations = {"u1": self._passing, "u2": self._passing}
        with pytest.raises(CertificateError) as excinfo:
            assert_degree_requirements(enrollments, participations)
        error = excinfo.value
        assert error.message_key == "DEGREE_REQUIREMENTS_NOT_MET"
        assert "3 selected participant(s)" in error.message
        assert error.message.count("Wiebke Engler") == 3
        assert "0.0 of 12.5 ECTS, 0 of 1 events" in error.message

    def test_log_message_identifies_users_by_id_only(self):
        """Cloud function logs have a different retention and access model, so the
        blocked participants are named only in the admin-facing message."""
        enrollments = [_degree_enrollment("u1")]
        with pytest.raises(CertificateError) as excinfo:
            assert_degree_requirements(enrollments, {})
        error = excinfo.value
        assert "Wiebke Engler" in error.message
        assert "Wiebke" not in error.log_message
        assert "Engler" not in error.log_message
        assert "u1" in error.log_message
        assert "0 of 1 events" in error.log_message

    def test_truncates_long_failure_lists(self):
        enrollments = [_degree_enrollment(f"u{i}") for i in range(1, 8)]
        with pytest.raises(CertificateError) as excinfo:
            assert_degree_requirements(enrollments, {})
        assert "and 2 more" in excinfo.value.message

    def test_null_thresholds_skip_the_gate(self):
        enrollments = [_degree_enrollment("u1", required_ects=None, required_event_count=None)]
        assert_degree_requirements(enrollments, {})


class TestPrepareTextContentDegreeBranch:
    """The reported bug: generating a degree certificate failed with
    "Missing required course or learning goals data" because degrees fell into
    the project-achievement path.
    """

    @staticmethod
    def _creator(degree_participations, is_degree=True):
        creator = CertificateCreator.__new__(CertificateCreator)
        creator.certificate_type = "achievement"
        creator.course_id = 158
        creator.is_degree = is_degree
        creator.degree_participations = degree_participations
        return creator

    @property
    def _participations(self):
        return {
            "u1": [
                _part("Einführung in Data Science", "5", program_title="24W"),
                _part("Machine Learning with TensorFlow", "5", program_title="25S"),
                _part("Scientific Machine Learning", "2,5", program_title="25W"),
                _event(),
            ]
        }

    def test_renders_without_learning_goals_or_project(self):
        creator = self._creator(self._participations)
        context = creator.prepare_text_content(_degree_enrollment(), "IMAGE")

        assert context["successful_participations"] == [
            "Einführung in Data Science (24W) (5.0 ECTS)",
            "Machine Learning with TensorFlow (25S) (5.0 ECTS)",
            "Scientific Machine Learning (25W) (2.5 ECTS)",
            "Coding.Waterkant 2026 (Hackathon)",
        ]
        assert context["full_name"] == "WIEBKE ENGLER"
        assert context["course_name"] == "Machine Learning Degree"
        assert context["semester"] == "Degrees"
        assert context["template"] == "IMAGE"

    def test_ects_variable_renders_the_requirement(self):
        """A degree requires ECTS instead of awarding them, so {{ ECTS }} shows the
        requirement and Course.ects is ignored entirely."""
        creator = self._creator(self._participations)
        context = creator.prepare_text_content(_degree_enrollment(ects="NONE"), "IMAGE")
        assert context["ECTS"] == "12.5"
        assert context["ECTS"] == context["required_ects_display"]

    def test_own_course_ects_is_ignored(self):
        creator = self._creator(self._participations)
        context = creator.prepare_text_content(
            _degree_enrollment(ects="5", required_ects=12.5), "IMAGE"
        )
        assert context["ECTS"] == "12.5"

    def test_missing_requirement_renders_empty_so_it_is_noticed(self):
        """An unconfigured degree leaves a visible gap rather than printing a wrong number."""
        creator = self._creator({})
        context = creator.prepare_text_content(
            _degree_enrollment(ects="12,5", required_ects=None, required_event_count=None), "IMAGE"
        )
        assert context["ECTS"] == ""
        assert context["required_ects_display"] == ""

    def test_exposes_thresholds_and_achieved_values(self):
        creator = self._creator(self._participations)
        context = creator.prepare_text_content(_degree_enrollment(), "IMAGE")

        assert context["required_ects"] == 12.5
        assert context["required_ects_display"] == "12.5"
        assert context["required_event_count"] == 1
        assert context["achieved_ects"] == 12.5
        assert context["achieved_ects_display"] == "12.5"
        assert context["attended_event_count"] == 1

    def test_blocks_when_requirements_are_not_met(self):
        creator = self._creator({})
        with pytest.raises(CertificateError) as excinfo:
            creator.prepare_text_content(_degree_enrollment(), "IMAGE")
        error = excinfo.value
        assert error.message_key == "DEGREE_REQUIREMENTS_NOT_MET"
        assert "Wiebke Engler" in error.message
        assert "0.0 of 12.5 ECTS" in error.message
        assert "0 of 1 events" in error.message
        assert "Wiebke" not in error.log_message
        assert "u1" in error.log_message

    def test_renders_empty_list_when_no_thresholds_are_configured(self):
        creator = self._creator({})
        enrollment = _degree_enrollment(required_ects=None, required_event_count=None)
        context = creator.prepare_text_content(enrollment, "IMAGE")

        assert context["successful_participations"] == []
        assert context["required_ects"] is None
        assert context["required_ects_display"] == ""
        assert context["required_event_count"] is None

    def test_non_degree_achievement_still_requires_learning_goals(self):
        creator = self._creator({}, is_degree=False)
        with pytest.raises(CertificateError) as excinfo:
            creator.prepare_text_content(_degree_enrollment(program_type="COURSES"), "IMAGE")
        assert excinfo.value.message_key == "MISSING_COURSE_DATA"
