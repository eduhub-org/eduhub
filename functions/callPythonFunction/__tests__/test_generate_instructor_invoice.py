"""Unit tests for the instructor invoice: split validation, locking and rendering."""
from datetime import datetime
from unittest.mock import MagicMock

import pytest

from pythonFunctions.generate_instructor_invoice import (
    InvoiceError,
    assert_split_complete,
    build_invoice_context,
    format_eur,
    generate_instructor_invoice,
)

TEMPLATE = "<html><body>{{ full_name }} {{ amount }} / {{ total_amount }}</body></html>"


def _instructor(ci_id, user_id, share=None):
    return {
        "id": ci_id,
        "User": {"id": user_id, "firstName": f"F{ci_id}", "lastName": f"L{ci_id}", "email": "x@y.z"},
        "PaymentShare": None if share is None else {"id": ci_id * 10, "amount": share},
    }


def _course(instructors, total=50000, template=TEMPLATE):
    return {
        "id": 7,
        "title": "ML",
        "InstructorPayment": {"id": 1, "totalAmount": total, "lockedAt": None},
        "CourseInstructors": instructors,
        "Program": {"title": "WiSe 26/27", "InstructorInvoiceTemplate": {"html": template} if template else None},
    }


def _args(user_id="u1"):
    return {"input": {"courseId": 7}, "session_variables": {"x-hasura-user-id": user_id}}


class TestFormatEur:
    def test_german_notation(self):
        assert format_eur(25000) == "250,00 €"
        assert format_eur(123456) == "1.234,56 €"
        assert format_eur(0) == "0,00 €"


class TestAssertSplitComplete:
    def test_missing_share_is_incomplete(self):
        course = _course([_instructor(1, "u1", 50000), _instructor(2, "u2")])
        with pytest.raises(InvoiceError) as e:
            assert_split_complete(course)
        assert e.value.message_key == "PAYMENT_SPLIT_INCOMPLETE"

    def test_sum_below_total_is_incomplete(self):
        course = _course([_instructor(1, "u1", 20000), _instructor(2, "u2", 20000)])
        with pytest.raises(InvoiceError):
            assert_split_complete(course)

    def test_explicit_zero_share_is_allowed(self):
        assert_split_complete(_course([_instructor(1, "u1", 50000), _instructor(2, "u2", 0)]))


def test_context_contains_own_amount_and_all_instructors():
    course = _course([_instructor(1, "u1", 30000), _instructor(2, "u2", 20000)])
    context = build_invoice_context(course, course["CourseInstructors"][1], datetime(2027, 2, 1))
    assert context["amount"] == "200,00 €"
    assert context["total_amount"] == "500,00 €"
    assert context["date"] == "01.02.2027"
    assert [i["amount"] for i in context["instructors"]] == ["300,00 €", "200,00 €"]


class TestGenerateInstructorInvoice:
    def _client(self, course, locked_now=True):
        client = MagicMock()
        client.fetch_instructor_payment_course.return_value = course
        client.lock_instructor_payment.return_value = locked_now
        return client

    def test_rejects_non_instructor(self):
        client = self._client(_course([_instructor(1, "u1", 50000)]))
        result = generate_instructor_invoice(_args("someone-else"), client, MagicMock())
        assert result["messageKey"] == "NOT_COURSE_INSTRUCTOR"
        client.lock_instructor_payment.assert_not_called()

    def test_requires_template(self):
        client = self._client(_course([_instructor(1, "u1", 50000)], template=None))
        result = generate_instructor_invoice(_args(), client, MagicMock())
        assert result["messageKey"] == "NO_INVOICE_TEMPLATE"

    def test_incomplete_split_unlocks_again(self):
        client = self._client(_course([_instructor(1, "u1", 10000), _instructor(2, "u2")]))
        result = generate_instructor_invoice(_args(), client, MagicMock())
        assert result["messageKey"] == "PAYMENT_SPLIT_INCOMPLETE"
        client.unlock_instructor_payment.assert_called_once_with(7)

    def test_incomplete_split_keeps_existing_lock(self):
        client = self._client(
            _course([_instructor(1, "u1", 10000), _instructor(2, "u2")]), locked_now=False
        )
        generate_instructor_invoice(_args(), client, MagicMock())
        client.unlock_instructor_payment.assert_not_called()

    def test_sole_instructor_gets_full_total(self):
        client = self._client(_course([_instructor(1, "u1", 50000)]))
        storage = MagicMock()
        result = generate_instructor_invoice(_args(), client, storage)
        client.upsert_instructor_payment_share.assert_called_once_with(1, 50000)
        assert result == {"success": True, "path": "u1/7/instructor_invoice.pdf", "messageKey": "INVOICE_GENERATED"}
        storage.upload_file.assert_called_once()
        client.set_instructor_invoice_url.assert_called_once_with(10, "u1/7/instructor_invoice.pdf")

    def test_complete_split_uploads_caller_invoice(self):
        client = self._client(_course([_instructor(1, "u1", 30000), _instructor(2, "u2", 20000)]))
        result = generate_instructor_invoice(_args("u2"), client, MagicMock())
        assert result["path"] == "u2/7/instructor_invoice.pdf"
        client.upsert_instructor_payment_share.assert_not_called()
        client.set_instructor_invoice_url.assert_called_once_with(20, "u2/7/instructor_invoice.pdf")


def test_failed_upload_releases_a_fresh_lock():
    client = MagicMock()
    client.fetch_instructor_payment_course.return_value = _course([_instructor(1, "u1", 30000), _instructor(2, "u2", 20000)])
    client.lock_instructor_payment.return_value = True
    storage = MagicMock()
    storage.upload_file.side_effect = RuntimeError("bucket down")
    result = generate_instructor_invoice(_args("u1"), client, storage)
    assert result["success"] is False
    client.unlock_instructor_payment.assert_called_once_with(7)
    client.set_instructor_invoice_url.assert_not_called()


def test_render_escapes_user_controlled_fields():
    import pythonFunctions.generate_instructor_invoice as module
    captured = {}
    original = module.pisa.CreatePDF

    def fake_create_pdf(html, dest):
        captured["html"] = html
        return original(html, dest=dest)

    module.pisa.CreatePDF = fake_create_pdf
    try:
        module.render_pdf("<p>{{ full_name }}</p>", {"full_name": '<img src="http://evil/x.png">'})
    finally:
        module.pisa.CreatePDF = original
    assert "<img" not in captured["html"]
    assert "&lt;img" in captured["html"]
