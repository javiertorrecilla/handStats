import os
import sys
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from bson import ObjectId

BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.services.email_templates import (
    EMAIL_TRANSLATIONS,
    build_password_reset_email,
    build_verification_email,
    resolve_recipient_names,
)


class FakeCollection:
    """Colección Mongo en memoria para pruebas unitarias aisladas."""

    def __init__(self):
        self.docs = []

    def _match(self, doc, query):
        for k, v in (query or {}).items():
            if k == "$or":
                if not any(self._match(doc, branch) for branch in v):
                    return False
                continue
            doc_val = doc.get(k)
            if isinstance(v, dict) and "$regex" in v:
                import re
                flags = re.IGNORECASE if "i" in v.get("$options", "") else 0
                if not isinstance(doc_val, str) or not re.search(v["$regex"], doc_val, flags):
                    return False
            elif doc_val != v:
                return False
        return True

    async def find_one(self, query):
        for d in self.docs:
            if self._match(d, query):
                return dict(d)
        return None

    async def insert_one(self, doc):
        new_doc = dict(doc)
        new_doc["_id"] = new_doc.get("_id") or ObjectId()
        self.docs.append(new_doc)

        class Res:
            def __init__(self, oid):
                self.inserted_id = oid

        return Res(new_doc["_id"])

    async def update_one(self, query, update):
        for d in self.docs:
            if self._match(d, query):
                if "$set" in update:
                    d.update(update["$set"])
                return

    async def update_many(self, query, update):
        for d in self.docs:
            if self._match(d, query):
                if "$set" in update:
                    d.update(update["$set"])

    async def find_one_and_update(self, query, update):
        for d in self.docs:
            if self._match(d, query):
                if "$set" in update:
                    d.update(update["$set"])
                return dict(d)
        return None


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
                recipient_email="coach@handtix.pro",
                full_name="María García",
                action_url="https://hand-stats.vercel.app/auth/action?mode=verifyEmail&token=XYZ",
                brand_url="https://hand-stats.vercel.app",
                lang=lang,
            )
            self.assertIn("María", verif["subject"])
            self.assertIn("María García", verif["html"])
            self.assertIn("coach@handtix.pro", verif["html"])
            self.assertIn("https://hand-stats.vercel.app/auth/action?mode=verifyEmail&amp;token=XYZ", verif["html"])
            self.assertIn("https://hand-stats.vercel.app/auth/action?mode=verifyEmail&token=XYZ", verif["text"])

            reset = build_password_reset_email(
                recipient_email="coach@handtix.pro",
                full_name="María García",
                action_url="https://hand-stats.vercel.app/auth/action?mode=resetPassword&token=RST",
                brand_url="https://hand-stats.vercel.app",
                lang=lang,
            )
            self.assertIn("María", reset["subject"])
            self.assertIn("María García", reset["html"])
            self.assertIn("coach@handtix.pro", reset["html"])
            self.assertIn("https://hand-stats.vercel.app/auth/action?mode=resetPassword&amp;token=RST", reset["html"])
            self.assertNotEqual(verif["subject"], reset["subject"])

    def test_html_escaping_prevents_injection(self):
        malicious_name = '<script>alert("xss")</script>'
        doc = build_verification_email(
            recipient_email="safe@club.es",
            full_name=malicious_name,
            action_url="https://hand-stats.vercel.app/auth/action?mode=verifyEmail&token=123",
            lang="es",
        )
        self.assertNotIn("<script>", doc["html"])
        self.assertIn("&lt;script&gt;", doc["html"])


class TestAuthSecurityAndConfig(unittest.TestCase):
    def test_password_hashing_and_session_tokens(self):
        from app.services.auth_email_service import (
            build_app_action_url,
            create_session_token,
            hash_password,
            sanitize_auth_origin,
            verify_password,
            verify_session_token,
        )

        pw_hash = hash_password("Handtix2026!")
        self.assertTrue(pw_hash.startswith("pbkdf2_sha256$"))
        self.assertTrue(verify_password("Handtix2026!", pw_hash))
        self.assertFalse(verify_password("WrongPass!", pw_hash))

        sess = create_session_token(user_id="66a1", uid="hs_123", email="coach@club.es")
        claims = verify_session_token(sess)
        self.assertEqual(claims["sub"], "66a1")
        self.assertEqual(claims["uid"], "hs_123")
        self.assertEqual(claims["email"], "coach@club.es")

        self.assertEqual(sanitize_auth_origin("http://localhost:5173"), "http://localhost:5173")
        self.assertEqual(sanitize_auth_origin("https://evil-phishing.com"), "https://hand-stats.vercel.app")
        self.assertEqual(
            build_app_action_url(app_origin="http://localhost:5173", mode="verifyEmail", token="TOK1", lang="es"),
            "http://localhost:5173/auth/action?mode=verifyEmail&token=TOK1&lang=es",
        )

    def test_service_status_providers(self):
        from app.services import auth_email_service

        with patch.object(auth_email_service.settings, "resend_api_key", None), \
             patch.object(auth_email_service.settings, "smtp_user", None), \
             patch.object(auth_email_service.settings, "smtp_password", None):
            st = auth_email_service.get_email_service_status()
            self.assertFalse(st["configured"])
            self.assertIsNone(st["provider"])

        with patch.object(auth_email_service.settings, "resend_api_key", None), \
             patch.object(auth_email_service.settings, "smtp_user", "coach@gmail.com"), \
             patch.object(auth_email_service.settings, "smtp_password", "app-pass-16"):
            st = auth_email_service.get_email_service_status()
            self.assertTrue(st["configured"])
            self.assertEqual(st["provider"], "smtp")

        with patch.object(auth_email_service.settings, "resend_api_key", "re_live_123"), \
             patch.object(auth_email_service.settings, "smtp_user", "coach@gmail.com"):
            st = auth_email_service.get_email_service_status()
            self.assertTrue(st["configured"])
            self.assertEqual(st["provider"], "resend")


class TestIndependentAuthFlowEndpoints(unittest.IsolatedAsyncioTestCase):
    async def test_full_independent_register_verify_reset_login(self):
        from urllib.parse import parse_qs, urlparse
        from fastapi import HTTPException
        from app.routes import auth_emails
        from app.services import auth_email_service

        auth_email_service._RATE_LIMIT_STORE.clear()
        fake_users = FakeCollection()
        fake_tokens = FakeCollection()
        sent_emails = []

        def fake_send(**kwargs):
            sent_emails.append(kwargs)
            return {"provider": "smtp", "message_id": f"msg_{len(sent_emails)}"}

        with patch.object(auth_emails, "user_collection", fake_users), \
             patch.object(auth_emails, "auth_tokens_collection", fake_tokens), \
             patch.object(auth_emails, "get_email_service_status", return_value={"configured": True, "provider": "smtp", "missing": []}), \
             patch.object(auth_emails, "send_transactional_email", side_effect=fake_send):

            # 1. Registro independiente sin Firebase
            reg = await auth_emails.register_independent(
                auth_emails.RegisterRequest(
                    name="Javier Torrecilla",
                    email="javier@clubbalonmano.es",
                    password="Password123!",
                    lang="es",
                    origin="http://localhost:5173",
                )
            )
            self.assertTrue(reg["email_sent"])
            self.assertEqual(reg["provider"], "smtp")
            self.assertFalse(reg["user"]["email_verified"])
            self.assertNotIn("password_hash", reg["user"])

            # Correo de verificación personalizado generado
            self.assertEqual(len(sent_emails), 1)
            verif_mail = sent_emails[0]
            self.assertEqual(verif_mail["email_type"], "email_verification")
            self.assertIn("Javier", verif_mail["subject"])
            self.assertIn("Javier Torrecilla", verif_mail["html_body"])
            self.assertNotIn("firebaseapp.com", verif_mail["html_body"])

            # Extraer token del text_body (url directa a localhost:5173/auth/action)
            import re
            match_url = re.search(r"http://localhost:5173/auth/action\?\S+", verif_mail["text_body"])
            self.assertIsNotNone(match_url)
            parsed_q = parse_qs(urlparse(match_url.group(0)).query)
            verify_token = parsed_q["token"][0]
            self.assertEqual(parsed_q["mode"][0], "verifyEmail")

            # 2. Confirmar verificación con el token
            verif_res = await auth_emails.confirm_verification_endpoint(
                auth_emails.ConfirmVerificationRequest(token=verify_token)
            )
            self.assertTrue(verif_res["verified"])

            # Token de un solo uso -> segundo intento debe fallar
            with self.assertRaises(HTTPException) as reuse_err:
                await auth_emails.confirm_verification_endpoint(
                    auth_emails.ConfirmVerificationRequest(token=verify_token)
                )
            self.assertEqual(reuse_err.exception.status_code, 400)

            # GET /auth/me refleja email_verified=True
            me = await auth_emails.get_current_session_user(authorization=f"Bearer {reg['token']}")
            self.assertTrue(me["user"]["email_verified"])

            # 3. Solicitar recuperación de contraseña
            reset_req = await auth_emails.send_password_reset_email_endpoint(
                auth_emails.SendPasswordResetRequest(
                    email="javier@clubbalonmano.es",
                    lang="en",
                    origin="http://localhost:5173",
                )
            )
            self.assertTrue(reset_req["sent"])
            self.assertEqual(len(sent_emails), 2)
            reset_mail = sent_emails[1]
            self.assertEqual(reset_mail["email_type"], "password_reset")
            self.assertIn("Javier", reset_mail["subject"])

            match_reset = re.search(r"http://localhost:5173/auth/action\?\S+", reset_mail["text_body"])
            self.assertIsNotNone(match_reset)
            reset_token = parse_qs(urlparse(match_reset.group(0)).query)["token"][0]

            # 4. Validar token de reset y establecer nueva contraseña
            valid_check = await auth_emails.verify_reset_token_endpoint(token=reset_token)
            self.assertTrue(valid_check["valid"])
            self.assertEqual(valid_check["email"], "javier@clubbalonmano.es")

            confirm_reset = await auth_emails.confirm_password_reset_endpoint(
                auth_emails.ConfirmPasswordResetRequest(token=reset_token, new_password="NuevaPassword99!")
            )
            self.assertTrue(confirm_reset["reset"])

            # 5. Iniciar sesión con la nueva contraseña independiente
            login_ok = await auth_emails.login_independent(
                auth_emails.LoginRequest(email="javier@clubbalonmano.es", password="NuevaPassword99!")
            )
            self.assertTrue(login_ok["token"].startswith("hs_sess."))
            self.assertTrue(login_ok["user"]["email_verified"])

            # Contraseña antigua ya no sirve
            with self.assertRaises(HTTPException) as bad_pw:
                await auth_emails.login_independent(
                    auth_emails.LoginRequest(email="javier@clubbalonmano.es", password="Password123!")
                )
            self.assertEqual(bad_pw.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
