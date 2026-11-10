import os
import sys
import unittest
from unittest.mock import patch

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.services.email_templates import (
    EMAIL_TRANSLATIONS,
    build_password_reset_email,
    build_verification_email,
    resolve_recipient_names,
)


class TestEmailTemplates(unittest.TestCase):
    def test_resolve_recipient_names(self):
        full, first = resolve_recipient_names("Javier Torrecilla", "javier@club.es")
        self.assertEqual(full, "Javier Torrecilla")
        self.assertEqual(first, "Javier")

        full2, first2 = resolve_recipient_names(None, "carlos.perez@bm.es")
        self.assertEqual(full2, "Carlos")
        self.assertEqual(first2, "Carlos")

        full3, first3 = resolve_recipient_names("", "user123@bm.es")
        self.assertEqual(full3, "user123@bm.es")
        self.assertIsNone(first3)

    def test_verification_and_reset_all_6_languages(self):
        langs = ["es", "en", "de", "fr", "da", "pl"]
        for lang in langs:
            self.assertIn(lang, EMAIL_TRANSLATIONS)

            verif = build_verification_email(
                recipient_email="coach@handstats.pro",
                full_name="María García",
                action_url="https://hand-stats.vercel.app/auth/action?mode=verifyEmail&oobCode=XYZ",
                brand_url="https://hand-stats.vercel.app",
                lang=lang,
            )
            self.assertIn("María", verif["subject"])
            self.assertIn("María García", verif["html"])
            self.assertIn("coach@handstats.pro", verif["html"])
            self.assertIn("https://hand-stats.vercel.app/auth/action?mode=verifyEmail&amp;oobCode=XYZ", verif["html"])
            self.assertIn("https://hand-stats.vercel.app/auth/action?mode=verifyEmail&oobCode=XYZ", verif["text"])

            reset = build_password_reset_email(
                recipient_email="coach@handstats.pro",
                full_name="María García",
                action_url="https://hand-stats.vercel.app/auth/action?mode=resetPassword&oobCode=RST",
                brand_url="https://hand-stats.vercel.app",
                lang=lang,
            )
            self.assertIn("María", reset["subject"])
            self.assertIn("María García", reset["html"])
            self.assertIn("coach@handstats.pro", reset["html"])
            self.assertIn("https://hand-stats.vercel.app/auth/action?mode=resetPassword&amp;oobCode=RST", reset["html"])
            self.assertNotEqual(verif["subject"], reset["subject"])

    def test_html_escaping_prevents_injection(self):
        malicious_name = '<script>alert("xss")</script>'
        doc = build_verification_email(
            recipient_email="safe@club.es",
            full_name=malicious_name,
            action_url="https://hand-stats.vercel.app/auth/action?mode=verifyEmail&oobCode=123",
            lang="es",
        )
        self.assertNotIn("<script>", doc["html"])
        self.assertIn("&lt;script&gt;", doc["html"])


class TestAuthEmailService(unittest.TestCase):
    def test_sanitize_auth_origin_and_rewrite_link(self):
        try:
            from app.services.auth_email_service import (
                rewrite_oob_link_to_app,
                sanitize_auth_origin,
            )
        except ImportError as exc:
            self.skipTest(f"Dependencias backend no instaladas en este intérprete: {exc}")

        self.assertEqual(sanitize_auth_origin("http://localhost:5173"), "http://localhost:5173")
        self.assertEqual(sanitize_auth_origin("https://hand-stats.vercel.app/"), "https://hand-stats.vercel.app")
        self.assertEqual(
            sanitize_auth_origin("https://hand-stats-abc123.vercel.app"),
            "https://hand-stats-abc123.vercel.app",
        )
        # Rechaza dominios externos (open-redirect)
        self.assertEqual(sanitize_auth_origin("https://evil-phishing.com"), "https://hand-stats.vercel.app")
        self.assertEqual(sanitize_auth_origin("javascript:alert(1)"), "https://hand-stats.vercel.app")

        firebase_oob = (
            "https://handstats-ac5fa.firebaseapp.com/__/auth/action"
            "?mode=resetPassword&oobCode=SECRET_CODE_1&apiKey=AIza123&lang=es"
        )
        rewritten = rewrite_oob_link_to_app(firebase_oob, "https://hand-stats.vercel.app", "es")
        self.assertEqual(
            rewritten,
            "https://hand-stats.vercel.app/auth/action?mode=resetPassword&oobCode=SECRET_CODE_1&lang=es",
        )

    def test_service_status_reports_missing_when_unconfigured(self):
        try:
            from app.services import auth_email_service
        except ImportError as exc:
            self.skipTest(f"Dependencias backend no instaladas en este intérprete: {exc}")

        with patch.object(auth_email_service.settings, "resend_api_key", None), \
             patch.object(auth_email_service.settings, "firebase_service_account_json", None), \
             patch.object(auth_email_service.settings, "firebase_client_email", None):
            status = auth_email_service.get_email_service_status()
            self.assertFalse(status["configured"])
            self.assertEqual(status["provider"], "firebase_default")
            self.assertIn("RESEND_API_KEY", status["missing"])
            self.assertIn("FIREBASE_SERVICE_ACCOUNT_JSON", status["missing"])


class TestAuthEmailEndpoints(unittest.IsolatedAsyncioTestCase):
    async def test_fallback_when_unconfigured(self):
        try:
            from app.routes import auth_emails
        except ImportError as exc:
            self.skipTest(f"Dependencias backend no instaladas: {exc}")

        with patch.object(
            auth_emails,
            "get_email_service_status",
            return_value={"configured": False, "provider": "firebase_default", "missing": ["RESEND_API_KEY"]},
        ):
            res_verif = await auth_emails.send_verification_email_endpoint(
                auth_emails.SendVerificationRequest(lang="es"),
                authorization=None,
            )
            self.assertFalse(res_verif["sent"])
            self.assertTrue(res_verif["fallback_required"])

            res_reset = await auth_emails.send_password_reset_email_endpoint(
                auth_emails.SendPasswordResetRequest(email="coach@club.es", lang="es")
            )
            self.assertFalse(res_reset["sent"])
            self.assertTrue(res_reset["fallback_required"])

    async def test_send_verification_and_reset_flows_with_mocks(self):
        try:
            from fastapi import HTTPException
            from app.routes import auth_emails
            from app.services import auth_email_service
        except ImportError as exc:
            self.skipTest(f"Dependencias backend no instaladas: {exc}")

        auth_email_service._RATE_LIMIT_STORE.clear()
        captured_emails = []

        def fake_resend(**kwargs):
            captured_emails.append(kwargs)
            return {"id": "msg_test_123"}

        with patch.object(
            auth_emails,
            "get_email_service_status",
            return_value={"configured": True, "provider": "resend", "missing": []},
        ), patch.object(
            auth_emails,
            "verify_firebase_id_token",
            return_value={"uid": "uid_1", "email": "javier@club.es", "email_verified": False, "name": "Javier Reyes"},
        ), patch.object(
            auth_emails,
            "_find_user_name_in_mongo",
            return_value="Javier Torrecilla",
        ), patch.object(
            auth_emails,
            "generate_firebase_action_link",
            side_effect=[
                "https://handstats-ac5fa.firebaseapp.com/__/auth/action?mode=verifyEmail&oobCode=V_CODE",
                "https://handstats-ac5fa.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=R_CODE",
            ],
        ), patch.object(
            auth_emails,
            "lookup_firebase_user_by_email",
            return_value={"localId": "uid_1", "email": "javier@club.es", "displayName": "Javier Reyes"},
        ), patch.object(
            auth_emails,
            "send_via_resend",
            side_effect=fake_resend,
        ):
            # 1. Verificación requiere Bearer token cuando está configurado
            with self.assertRaises(HTTPException) as ctx401:
                await auth_emails.send_verification_email_endpoint(
                    auth_emails.SendVerificationRequest(lang="es"),
                    authorization=None,
                )
            self.assertEqual(ctx401.exception.status_code, 401)

            # 2. Verificación exitosa envía HTML personalizado con nombre
            res_verif = await auth_emails.send_verification_email_endpoint(
                auth_emails.SendVerificationRequest(lang="es", origin="https://hand-stats.vercel.app"),
                authorization="Bearer fake_firebase_jwt",
            )
            self.assertTrue(res_verif["sent"])
            self.assertEqual(res_verif["message_id"], "msg_test_123")

            # 3. Reset con email inválido falla con 400
            with self.assertRaises(HTTPException) as ctx400:
                await auth_emails.send_password_reset_email_endpoint(
                    auth_emails.SendPasswordResetRequest(email="invalido", lang="es")
                )
            self.assertEqual(ctx400.exception.status_code, 400)

            # 4. Reset exitoso envía HTML personalizado en inglés si se pide lang="en"
            res_reset = await auth_emails.send_password_reset_email_endpoint(
                auth_emails.SendPasswordResetRequest(
                    email="javier@club.es",
                    lang="en",
                    origin="https://hand-stats.vercel.app",
                )
            )
            self.assertTrue(res_reset["sent"])

        self.assertEqual(len(captured_emails), 2)
        verif_mail, reset_mail = captured_emails
        self.assertEqual(verif_mail["email_type"], "email_verification")
        self.assertIn("Javier", verif_mail["subject"])
        self.assertIn("Javier Torrecilla", verif_mail["html_body"])
        self.assertIn("https://hand-stats.vercel.app/auth/action?mode=verifyEmail&amp;oobCode=V_CODE", verif_mail["html_body"])

        self.assertEqual(reset_mail["email_type"], "password_reset")
        self.assertIn("Javier", reset_mail["subject"])
        self.assertIn("Javier Torrecilla", reset_mail["html_body"])
        self.assertIn("https://hand-stats.vercel.app/auth/action?mode=resetPassword&amp;oobCode=R_CODE", reset_mail["html_body"])


if __name__ == "__main__":
    unittest.main()
