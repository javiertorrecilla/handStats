import html
import re
from datetime import datetime, timezone
from typing import Dict, Optional, Tuple


# ==========================================================
# TRADUCCIONES DE PLANTILLAS DE EMAIL (6 IDIOMAS)
# ==========================================================

EMAIL_TRANSLATIONS: Dict[str, Dict[str, Dict[str, str]]] = {
    "es": {
        "common": {
            "tagline": "ANALIZA · MEJORA · GANA",
            "account_badge": "CUENTA INDIVIDUAL",
            "cta_fallback": "Si el botón no funciona, copia y pega este enlace personal en tu navegador:",
            "manual_link": "Manual de Usuario",
            "privacy_link": "Política de Privacidad",
            "terms_link": "Términos y Condiciones",
            "footer_note": "Has recibido este correo transaccional automático porque está vinculado a tu cuenta personal en HandStats Pro.",
            "rights": "HandStats Pro · Analítica Avanzada de Balonmano",
            "label_account": "Titular de la cuenta",
            "label_email": "Correo electrónico",
            "label_requested": "Fecha de solicitud",
            "label_validity": "Seguridad del enlace",
            "label_status": "Estado",
        },
        "verification": {
            "subject_named": "HandStats Pro — {first_name}, confirma tu correo para activar tu cuenta",
            "subject_anon": "HandStats Pro — Confirma tu correo para activar tu cuenta",
            "preheader": "Activa tu cuenta individual de HandStats Pro y accede al análisis táctico de balonmano.",
            "pill": "VERIFICACIÓN DE CORREO",
            "greeting_named": "¡Bienvenido/a a HandStats Pro, {first_name}!",
            "greeting_anon": "¡Bienvenido/a a HandStats Pro!",
            "intro": "Tu cuenta personal ya está registrada. Por seguridad y para proteger tus partidos, equipos y estadísticas, necesitamos que confirmes que esta dirección de correo electrónico te pertenece.",
            "status_value": "Pendiente de verificación",
            "validity_value": "Enlace personal de activación única",
            "cta": "Verificar mi correo electrónico",
            "features_title": "Una vez verificada tu cuenta podrás:",
            "feature_1": "Registrar partidos en directo desde banquillo o vídeo con mapa de lanzamientos.",
            "feature_2": "Consultar modelos cuantitativos de xG, xSaves de portero y rating individual.",
            "feature_3": "Gestionar tus equipos guardados y exportar dossieres tácticos en PDF.",
            "security_title": "¿No has creado esta cuenta?",
            "security_body": "Si no te has registrado en HandStats Pro con {email}, puedes ignorar este mensaje con total tranquilidad. Sin tu confirmación, la cuenta no quedará habilitada.",
        },
        "password_reset": {
            "subject_named": "HandStats Pro — {first_name}, restablece tu contraseña de acceso",
            "subject_anon": "HandStats Pro — Solicitud para restablecer tu contraseña",
            "preheader": "Usa este enlace personal y de un solo uso para crear una nueva contraseña en HandStats Pro.",
            "pill": "RECUPERACIÓN DE ACCESO",
            "greeting_named": "Hola, {first_name}:",
            "greeting_anon": "Hola:",
            "intro": "Hemos recibido una solicitud individual para restablecer la contraseña de acceso asociada a tu cuenta de HandStats Pro. Pulsa el siguiente botón para elegir una nueva clave segura:",
            "status_value": "Restablecimiento de contraseña",
            "validity_value": "Expira en 1 hora · Válido para un único uso",
            "cta": "Restablecer mi contraseña",
            "security_title": "Aviso de seguridad individual",
            "security_body": "Si tú no has solicitado cambiar la contraseña de {email}, ignora y elimina este correo. Tu contraseña actual permanecerá intacta y nadie podrá modificar el acceso sin este enlace privado.",
        },
    },
    "en": {
        "common": {
            "tagline": "ANALYZE · IMPROVE · WIN",
            "account_badge": "INDIVIDUAL ACCOUNT",
            "cta_fallback": "If the button does not work, copy and paste this personal link into your browser:",
            "manual_link": "User Manual",
            "privacy_link": "Privacy Policy",
            "terms_link": "Terms & Conditions",
            "footer_note": "You received this automated transactional email because it is linked to your personal HandStats Pro account.",
            "rights": "HandStats Pro · Advanced Handball Analytics",
            "label_account": "Account holder",
            "label_email": "Email address",
            "label_requested": "Requested at",
            "label_validity": "Link security",
            "label_status": "Status",
        },
        "verification": {
            "subject_named": "HandStats Pro — {first_name}, verify your email to activate your account",
            "subject_anon": "HandStats Pro — Verify your email to activate your account",
            "preheader": "Confirm your email address to unlock your personal HandStats Pro tactical workspace.",
            "pill": "EMAIL VERIFICATION",
            "greeting_named": "Welcome to HandStats Pro, {first_name}!",
            "greeting_anon": "Welcome to HandStats Pro!",
            "intro": "Your personal account has been created. To protect your match data, team rosters, and analytics, please confirm that this email address belongs to you.",
            "status_value": "Pending verification",
            "validity_value": "Personal one-time activation link",
            "cta": "Verify my email address",
            "features_title": "Once verified, your account unlocks:",
            "feature_1": "Live court & video match tagging with shot and goal trajectory maps.",
            "feature_2": "Quantitative xG, goalkeeper xSaves, and per-match player rating metrics.",
            "feature_3": "Saved team management and coaching-ready PDF tactical dossiers.",
            "security_title": "Didn't create this account?",
            "security_body": "If you did not sign up for HandStats Pro using {email}, you can safely ignore this message. Your email address will not be activated without confirmation.",
        },
        "password_reset": {
            "subject_named": "HandStats Pro — {first_name}, reset your account password",
            "subject_anon": "HandStats Pro — Password reset request",
            "preheader": "Use this personal, single-use link to set a new password for your HandStats Pro account.",
            "pill": "ACCESS RECOVERY",
            "greeting_named": "Hello {first_name},",
            "greeting_anon": "Hello,",
            "intro": "We received an individual request to reset the password for your HandStats Pro account. Click the button below to choose a new password:",
            "status_value": "Password reset",
            "validity_value": "Expires in 1 hour · Single-use link",
            "cta": "Reset my password",
            "security_title": "Personal security notice",
            "security_body": "If you did not request a password reset for {email}, you can safely ignore this email. Your current password remains unchanged and protected.",
        },
    },
    "de": {
        "common": {
            "tagline": "ANALYSIEREN · VERBESSERN · GEWINNEN",
            "account_badge": "EINZELKONTO",
            "cta_fallback": "Falls die Schaltfläche nicht funktioniert, kopiere diesen persönlichen Link in deinen Browser:",
            "manual_link": "Benutzerhandbuch",
            "privacy_link": "Datenschutz",
            "terms_link": "Nutzungsbedingungen",
            "footer_note": "Du erhältst diese automatische E-Mail, da sie mit deinem persönlichen HandStats Pro-Konto verknüpft ist.",
            "rights": "HandStats Pro · Professionelle Handball-Analytik",
            "label_account": "Kontoinhaber",
            "label_email": "E-Mail-Adresse",
            "label_requested": "Anfragezeitpunkt",
            "label_validity": "Linksicherheit",
            "label_status": "Status",
        },
        "verification": {
            "subject_named": "HandStats Pro — {first_name}, bestätige deine E-Mail-Adresse",
            "subject_anon": "HandStats Pro — E-Mail-Adresse zur Aktivierung bestätigen",
            "preheader": "Bestätige deine E-Mail-Adresse, um deinen HandStats Pro-Arbeitsbereich zu aktivieren.",
            "pill": "E-MAIL-BESTÄTIGUNG",
            "greeting_named": "Willkommen bei HandStats Pro, {first_name}!",
            "greeting_anon": "Willkommen bei HandStats Pro!",
            "intro": "Dein persönliches Konto wurde erstellt. Um deine Spieldaten und Teams zu schützen, bestätige bitte kurz, dass diese E-Mail-Adresse dir gehört.",
            "status_value": "Bestätigung ausstehend",
            "validity_value": "Persönlicher einmaliger Aktivierungslink",
            "cta": "E-Mail-Adresse bestätigen",
            "features_title": "Nach der Bestätigung stehen dir zur Verfügung:",
            "feature_1": "Live-Spielerfassung am Spielfeldrand oder per Video inkl. Wurfzonen.",
            "feature_2": "Quantitative xG-, Torwart-xSaves- und Spieler-Rating-Modelle.",
            "feature_3": "Kaderverwaltung und taktische PDF-Spielberichte für das Trainerteam.",
            "security_title": "Konto nicht selbst erstellt?",
            "security_body": "Falls du dich nicht mit {email} bei HandStats Pro registriert hast, kannst du diese E-Mail einfach ignorieren.",
        },
        "password_reset": {
            "subject_named": "HandStats Pro — {first_name}, Passwort zurücksetzen",
            "subject_anon": "HandStats Pro — Anfrage zum Zurücksetzen des Passworts",
            "preheader": "Verwende diesen persönlichen Einmal-Link, um ein neues Passwort festzulegen.",
            "pill": "ZUGANGSWIEDERHERSTELLUNG",
            "greeting_named": "Hallo {first_name},",
            "greeting_anon": "Hallo,",
            "intro": "Wir haben eine persönliche Anfrage zum Zurücksetzen deines Passworts für HandStats Pro erhalten. Klicke auf die Schaltfläche unten, um ein neues Passwort zu wählen:",
            "status_value": "Passwort zurücksetzen",
            "validity_value": "1 Stunde gültig · Einmaliger Link",
            "cta": "Passwort zurücksetzen",
            "security_title": "Sicherheitshinweis",
            "security_body": "Falls du keine Zurücksetzung für {email} angefordert hast, ignoriere diese Nachricht. Dein aktuelles Passwort bleibt unverändert sicher.",
        },
    },
    "fr": {
        "common": {
            "tagline": "ANALYSER · PROGRESSER · GAGNER",
            "account_badge": "COMPTE INDIVIDUEL",
            "cta_fallback": "Si le bouton ne fonctionne pas, copiez et collez ce lien personnel dans votre navigateur :",
            "manual_link": "Manuel d'Utilisation",
            "privacy_link": "Confidentialité",
            "terms_link": "Conditions",
            "footer_note": "Vous recevez cet e-mail transactionnel automatique car il est associé à votre compte personnel HandStats Pro.",
            "rights": "HandStats Pro · Analytique Avancée de Handball",
            "label_account": "Titulaire du compte",
            "label_email": "Adresse e-mail",
            "label_requested": "Date de la demande",
            "label_validity": "Sécurité du lien",
            "label_status": "Statut",
        },
        "verification": {
            "subject_named": "HandStats Pro — {first_name}, confirmez votre adresse e-mail",
            "subject_anon": "HandStats Pro — Confirmez votre adresse e-mail",
            "preheader": "Validez votre adresse e-mail pour activer votre espace tactique HandStats Pro.",
            "pill": "VÉRIFICATION D'E-MAIL",
            "greeting_named": "Bienvenue sur HandStats Pro, {first_name} !",
            "greeting_anon": "Bienvenue sur HandStats Pro !",
            "intro": "Votre compte personnel vient d'être créé. Pour sécuriser vos matchs et vos statistiques, merci de confirmer que cette adresse e-mail vous appartient.",
            "status_value": "En attente de confirmation",
            "validity_value": "Lien d'activation personnel à usage unique",
            "cta": "Vérifier mon adresse e-mail",
            "features_title": "Une fois votre compte vérifié, vous pourrez :",
            "feature_1": "Enregistrer les matchs en direct avec zones de tir et trajectoires.",
            "feature_2": "Analyser les modèles xG, xSaves gardiens et notes de performance.",
            "feature_3": "Gérer vos équipes et exporter des rapports tactiques officiels en PDF.",
            "security_title": "Vous n'êtes pas à l'origine de cette inscription ?",
            "security_body": "Si vous n'avez pas créé de compte avec {email}, ignorez simplement cet e-mail. Le compte ne sera pas activé sans confirmation.",
        },
        "password_reset": {
            "subject_named": "HandStats Pro — {first_name}, réinitialisez votre mot de passe",
            "subject_anon": "HandStats Pro — Réinitialisation de votre mot de passe",
            "preheader": "Utilisez ce lien personnel à usage unique pour définir un nouveau mot de passe.",
            "pill": "RÉCUPÉRATION D'ACCÈS",
            "greeting_named": "Bonjour {first_name},",
            "greeting_anon": "Bonjour,",
            "intro": "Nous avons reçu une demande individuelle de réinitialisation du mot de passe de votre compte HandStats Pro. Cliquez ci-dessous pour en définir un nouveau :",
            "status_value": "Réinitialisation du mot de passe",
            "validity_value": "Expire dans 1 heure · Lien à usage unique",
            "cta": "Réinitialiser mon mot de passe",
            "security_title": "Avis de sécurité individuel",
            "security_body": "Si vous n'avez pas demandé à réinitialiser le mot de passe de {email}, ignorez ce message. Votre mot de passe actuel reste inchangé.",
        },
    },
    "da": {
        "common": {
            "tagline": "ANALYSER · FORBEDR · VIND",
            "account_badge": "INDIVIDUEL KONTO",
            "cta_fallback": "Hvis knappen ikke virker, skal du kopiere og indsætte dette personlige link i din browser:",
            "manual_link": "Brugermanual",
            "privacy_link": "Privatlivspolitik",
            "terms_link": "Vilkår og Betingelser",
            "footer_note": "Du modtager denne automatiske e-mail, fordi den er knyttet til din personlige HandStats Pro-konto.",
            "rights": "HandStats Pro · Avanceret Håndboldanalyse",
            "label_account": "Kontoindehaver",
            "label_email": "E-mailadresse",
            "label_requested": "Anmodet den",
            "label_validity": "Linksikkerhed",
            "label_status": "Status",
        },
        "verification": {
            "subject_named": "HandStats Pro — {first_name}, bekræft din e-mail for at aktivere din konto",
            "subject_anon": "HandStats Pro — Bekræft din e-mailadresse",
            "preheader": "Bekræft din e-mail for at få adgang til din personlige HandStats Pro-konto.",
            "pill": "E-MAILBEKRÆFTELSE",
            "greeting_named": "Velkommen til HandStats Pro, {first_name}!",
            "greeting_anon": "Velkommen til HandStats Pro!",
            "intro": "Din personlige konto er nu oprettet. Bekræft venligst, at denne e-mailadresse tilhører dig, for at beskytte dine kampe og holddata.",
            "status_value": "Afventer bekræftelse",
            "validity_value": "Personligt engangslink til aktivering",
            "cta": "Bekræft min e-mailadresse",
            "features_title": "Når din konto er bekræftet, får du adgang til:",
            "feature_1": "Live kampregistrering fra bænken eller video med skudkort.",
            "feature_2": "Kvantitative xG-, målmands-xSaves- og spiller-rating-modeller.",
            "feature_3": "Gemte hold og professionelle taktikrapporter i PDF.",
            "security_title": "Har du ikke oprettet denne konto?",
            "security_body": "Hvis du ikke har tilmeldt dig med {email}, kan du blot ignorere denne besked.",
        },
        "password_reset": {
            "subject_named": "HandStats Pro — {first_name}, nulstil din adgangskode",
            "subject_anon": "HandStats Pro — Anmodning om nulstilling af adgangskode",
            "preheader": "Brug dette personlige engangslink til at vælge en ny adgangskode.",
            "pill": "ADGANGSGENDANNELSE",
            "greeting_named": "Hej {first_name},",
            "greeting_anon": "Hej,",
            "intro": "Vi har modtaget en individuel anmodning om at nulstille adgangskoden til din HandStats Pro-konto. Klik nedenfor for at oprette en ny adgangskode:",
            "status_value": "Nulstilling af adgangskode",
            "validity_value": "Udløber om 1 time · Engangslink",
            "cta": "Nulstil min adgangskode",
            "security_title": "Personlig sikkerhedsmeddelelse",
            "security_body": "Hvis du ikke har bedt om at nulstille adgangskoden for {email}, kan du roligt ignorere denne mail. Din nuværende adgangskode forbliver sikker.",
        },
    },
    "pl": {
        "common": {
            "tagline": "ANALIZUJ · UDOSKONALAJ · WYGRYWAJ",
            "account_badge": "KONTO INDYWIDUALNE",
            "cta_fallback": "Jeśli przycisk nie działa, skopiuj i wklej ten osobisty link w przeglądarce:",
            "manual_link": "Podręcznik Użytkownika",
            "privacy_link": "Polityka Prywatności",
            "terms_link": "Regulamin",
            "footer_note": "Otrzymałeś tę automatyczną wiadomość, ponieważ jest ona powiązana z Twoim kontem w HandStats Pro.",
            "rights": "HandStats Pro · Zaawansowana Analityka Piłki Ręcznej",
            "label_account": "Właściciel konta",
            "label_email": "Adres e-mail",
            "label_requested": "Data zgłoszenia",
            "label_validity": "Bezpieczeństwo linku",
            "label_status": "Status",
        },
        "verification": {
            "subject_named": "HandStats Pro — {first_name}, potwierdź adres e-mail",
            "subject_anon": "HandStats Pro — Potwierdź adres e-mail, aby aktywować konto",
            "preheader": "Potwierdź swój e-mail, aby aktywować osobistą przestrzeń w HandStats Pro.",
            "pill": "WERYFIKACJA E-MAILA",
            "greeting_named": "Witaj w HandStats Pro, {first_name}!",
            "greeting_anon": "Witaj w HandStats Pro!",
            "intro": "Twoje indywidualne konto zostało utworzone. Aby chronić mecze i statystyki zespołu, potwierdź, że ten adres e-mail należy do Ciebie.",
            "status_value": "Oczekuje na weryfikację",
            "validity_value": "Osobisty jednorazowy link aktywacyjny",
            "cta": "Zweryfikuj mój adres e-mail",
            "features_title": "Po weryfikacji konta uzyskasz dostęp do:",
            "feature_1": "Rejestracji meczów na żywo z mapami rzutów i bramki.",
            "feature_2": "Modeli xG, xSaves bramkarzy oraz indywidualnej oceny zawodników.",
            "feature_3": "Zapisanych drużyn i taktycznych raportów meczowych w PDF.",
            "security_title": "Nie zakładałeś tego konta?",
            "security_body": "Jeśli nie rejestrowałeś się w HandStats Pro z użyciem {email}, możesz bezpiecznie zignorować tę wiadomość.",
        },
        "password_reset": {
            "subject_named": "HandStats Pro — {first_name}, zresetuj swoje hasło",
            "subject_anon": "HandStats Pro — Prośba o zresetowanie hasła",
            "preheader": "Użyj tego osobistego, jednorazowego linku, aby ustawić nowe hasło.",
            "pill": "ODZYSKIWANIE DOSTĘPU",
            "greeting_named": "Cześć {first_name},",
            "greeting_anon": "Cześć,",
            "intro": "Otrzymaliśmy indywidualną prośbę o zresetowanie hasła do Twojego konta HandStats Pro. Kliknij poniższy przycisk, aby ustawić nowe hasło:",
            "status_value": "Resetowanie hasła",
            "validity_value": "Ważny przez 1 godzinę · Link jednorazowy",
            "cta": "Zresetuj moje hasło",
            "security_title": "Indywidualne powiadomienie bezpieczeństwa",
            "security_body": "Jeśli nie prosiłeś o zmianę hasła dla {email}, zignoruj tę wiadomość. Twoje obecne hasło pozostaje bezpieczne i bez zmian.",
        },
    },
}


def resolve_lang(lang: Optional[str]) -> str:
    code = (lang or "es").strip().lower()[:2]
    return code if code in EMAIL_TRANSLATIONS else "es"


def resolve_recipient_names(full_name: Optional[str], email: str) -> Tuple[str, Optional[str]]:
    """
    Devuelve (full_name_display, first_name_optional) de forma limpia para
    saludos personalizados sin exponer identificadores robóticos.
    """
    cleaned = " ".join((full_name or "").strip().split())
    if cleaned:
        first_token = cleaned.split(" ")[0]
        first_clean = first_token[0].upper() + first_token[1:] if len(first_token) > 1 else first_token.upper()
        return cleaned, first_clean

    local_part = (email or "").split("@")[0].strip()
    tokens = [tok for tok in re.split(r"[._\-]+", local_part) if tok]
    if tokens and re.match(r"^[A-Za-zÀ-ÿ]{2,20}$", tokens[0]):
        inferred = tokens[0][0].upper() + tokens[0][1:]
        return inferred, inferred

    return email, None


def format_request_timestamp() -> str:
    now = datetime.now(timezone.utc)
    return now.strftime("%d/%m/%Y · %H:%M UTC")


def _render_base_email(
    *,
    brand_url: str,
    preheader: str,
    pill_text: str,
    greeting: str,
    intro: str,
    cta_label: str,
    action_url: str,
    account_name: str,
    recipient_email: str,
    status_label: str,
    validity_label: str,
    requested_at: str,
    extra_block_html: str,
    security_title: str,
    security_body: str,
    common_t: Dict[str, str],
) -> str:
    safe_brand_url = html.escape(brand_url.rstrip("/"), quote=True)
    safe_logo_url = f"{safe_brand_url}/favicon.png"
    safe_preheader = html.escape(preheader)
    safe_pill = html.escape(pill_text)
    safe_greeting = html.escape(greeting)
    safe_intro = html.escape(intro)
    safe_cta_label = html.escape(cta_label)
    safe_action_url = html.escape(action_url, quote=True)
    safe_action_url_text = html.escape(action_url)
    safe_account_name = html.escape(account_name)
    safe_recipient_email = html.escape(recipient_email)
    safe_status_label = html.escape(status_label)
    safe_validity_label = html.escape(validity_label)
    safe_requested_at = html.escape(requested_at)
    safe_security_title = html.escape(security_title)
    safe_security_body = html.escape(security_body)

    year = datetime.now(timezone.utc).year

    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>HandStats Pro</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
    {safe_preheader}
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
          <!-- Top Accent Bar -->
          <tr>
            <td style="height:5px;background-color:#ea580c;font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Dark Header Banner -->
          <tr>
            <td style="background-color:#0f172a;padding:24px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="left" style="vertical-align:middle;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="vertical-align:middle;padding-right:12px;">
                          <img src="{safe_logo_url}" alt="HandStats Pro" width="38" height="38" style="display:block;border-radius:9px;border:1px solid rgba(255,255,255,0.16);" />
                        </td>
                        <td style="vertical-align:middle;">
                          <div style="font-size:18px;font-weight:800;letter-spacing:0.04em;color:#ffffff;line-height:1.1;">
                            HANDSTATS <span style="color:#fb923c;">PRO</span>
                          </div>
                          <div style="font-size:10px;font-weight:700;letter-spacing:0.12em;color:#94a3b8;margin-top:3px;">
                            {html.escape(common_t["tagline"])}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align:middle;">
                    <span style="display:inline-block;background-color:rgba(234,88,12,0.18);border:1px solid rgba(251,146,60,0.45);color:#fdba74;font-size:10px;font-weight:800;letter-spacing:0.08em;padding:5px 10px;border-radius:999px;">
                      {safe_pill}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding:36px 32px 28px 32px;">
              <h1 style="margin:0 0 14px 0;font-size:23px;font-weight:800;line-height:1.3;color:#0f172a;letter-spacing:-0.015em;">
                {safe_greeting}
              </h1>

              <p style="margin:0 0 24px 0;font-size:15px;line-height:1.65;color:#334155;">
                {safe_intro}
              </p>

              <!-- Individual Account Context Card -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:26px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:10px;font-weight:800;letter-spacing:0.1em;color:#ea580c;margin-bottom:12px;">
                      {html.escape(common_t["account_badge"])}
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:13px;line-height:1.5;">
                      <tr>
                        <td style="padding:4px 0;color:#64748b;width:40%;">{html.escape(common_t["label_account"])}</td>
                        <td style="padding:4px 0;color:#0f172a;font-weight:700;">{safe_account_name}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#64748b;">{html.escape(common_t["label_email"])}</td>
                        <td style="padding:4px 0;color:#0f172a;font-weight:600;">{safe_recipient_email}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#64748b;">{html.escape(common_t["label_status"])}</td>
                        <td style="padding:4px 0;color:#c2410c;font-weight:700;">{safe_status_label}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#64748b;">{html.escape(common_t["label_validity"])}</td>
                        <td style="padding:4px 0;color:#334155;font-weight:600;">{safe_validity_label}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#64748b;">{html.escape(common_t["label_requested"])}</td>
                        <td style="padding:4px 0;color:#475569;">{safe_requested_at}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Primary Action CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:26px;">
                <tr>
                  <td align="center">
                    <a href="{safe_action_url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background-color:#ea580c;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:15px 34px;border-radius:10px;letter-spacing:0.01em;box-shadow:0 4px 14px rgba(234,88,12,0.32);">
                      {safe_cta_label}
                    </a>
                  </td>
                </tr>
              </table>

              {extra_block_html}

              <!-- Security Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fff7ed;border-left:4px solid #ea580c;border-radius:0 10px 10px 0;margin-bottom:22px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <div style="font-size:13px;font-weight:800;color:#9a3412;margin-bottom:4px;">
                      {safe_security_title}
                    </div>
                    <div style="font-size:13px;line-height:1.55;color:#7c2d12;">
                      {safe_security_body}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Fallback URL -->
              <div style="padding-top:16px;border-top:1px solid #e2e8f0;">
                <p style="margin:0 0 6px 0;font-size:12px;color:#64748b;">
                  {html.escape(common_t["cta_fallback"])}
                </p>
                <p style="margin:0;font-size:11.5px;line-height:1.5;word-break:break-all;">
                  <a href="{safe_action_url}" target="_blank" rel="noopener noreferrer" style="color:#ea580c;text-decoration:underline;">
                    {safe_action_url_text}
                  </a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:22px 32px;text-align:center;">
              <p style="margin:0 0 10px 0;font-size:12px;line-height:1.5;color:#64748b;">
                {html.escape(common_t["footer_note"])}
              </p>
              <p style="margin:0 0 10px 0;font-size:12px;">
                <a href="{safe_brand_url}/manual" style="color:#475569;text-decoration:none;font-weight:600;">{html.escape(common_t["manual_link"])}</a>
                <span style="color:#cbd5e1;padding:0 6px;">&middot;</span>
                <a href="{safe_brand_url}/privacy" style="color:#475569;text-decoration:none;font-weight:600;">{html.escape(common_t["privacy_link"])}</a>
                <span style="color:#cbd5e1;padding:0 6px;">&middot;</span>
                <a href="{safe_brand_url}/terms" style="color:#475569;text-decoration:none;font-weight:600;">{html.escape(common_t["terms_link"])}</a>
              </p>
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                &copy; {year} {html.escape(common_t["rights"])}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def build_verification_email(
    *,
    recipient_email: str,
    full_name: Optional[str],
    action_url: str,
    brand_url: str = "https://hand-stats.vercel.app",
    lang: Optional[str] = "es",
    requested_at: Optional[str] = None,
) -> Dict[str, str]:
    lang_code = resolve_lang(lang)
    tr = EMAIL_TRANSLATIONS[lang_code]
    common_t = tr["common"]
    verif_t = tr["verification"]

    display_full_name, first_name = resolve_recipient_names(full_name, recipient_email)
    ts = requested_at or format_request_timestamp()

    if first_name:
        subject = verif_t["subject_named"].format(first_name=first_name)
        greeting = verif_t["greeting_named"].format(first_name=first_name)
    else:
        subject = verif_t["subject_anon"]
        greeting = verif_t["greeting_anon"]

    security_body = verif_t["security_body"].format(email=recipient_email)

    extra_block_html = f"""
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:22px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:10px;">
                      {html.escape(verif_t["features_title"])}
                    </div>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:13px;line-height:1.55;color:#475569;">
                      <tr>
                        <td style="width:18px;vertical-align:top;color:#ea580c;font-weight:800;padding-bottom:6px;">&bull;</td>
                        <td style="padding-bottom:6px;">{html.escape(verif_t["feature_1"])}</td>
                      </tr>
                      <tr>
                        <td style="width:18px;vertical-align:top;color:#ea580c;font-weight:800;padding-bottom:6px;">&bull;</td>
                        <td style="padding-bottom:6px;">{html.escape(verif_t["feature_2"])}</td>
                      </tr>
                      <tr>
                        <td style="width:18px;vertical-align:top;color:#ea580c;font-weight:800;">&bull;</td>
                        <td>{html.escape(verif_t["feature_3"])}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>"""

    html_body = _render_base_email(
        brand_url=brand_url,
        preheader=verif_t["preheader"],
        pill_text=verif_t["pill"],
        greeting=greeting,
        intro=verif_t["intro"],
        cta_label=verif_t["cta"],
        action_url=action_url,
        account_name=display_full_name,
        recipient_email=recipient_email,
        status_label=verif_t["status_value"],
        validity_label=verif_t["validity_value"],
        requested_at=ts,
        extra_block_html=extra_block_html,
        security_title=verif_t["security_title"],
        security_body=security_body,
        common_t=common_t,
    )

    text_body = (
        f"{greeting}\n\n"
        f"{verif_t['intro']}\n\n"
        f"{common_t['label_account']}: {display_full_name}\n"
        f"{common_t['label_email']}: {recipient_email}\n"
        f"{common_t['label_requested']}: {ts}\n\n"
        f"{verif_t['cta']}: {action_url}\n\n"
        f"{verif_t['security_title']}: {security_body}\n\n"
        f"-- {common_t['rights']} ({brand_url.rstrip('/')})"
    )

    return {
        "subject": subject,
        "html": html_body,
        "text": text_body,
        "lang": lang_code,
    }


def build_password_reset_email(
    *,
    recipient_email: str,
    full_name: Optional[str],
    action_url: str,
    brand_url: str = "https://hand-stats.vercel.app",
    lang: Optional[str] = "es",
    requested_at: Optional[str] = None,
) -> Dict[str, str]:
    lang_code = resolve_lang(lang)
    tr = EMAIL_TRANSLATIONS[lang_code]
    common_t = tr["common"]
    reset_t = tr["password_reset"]

    display_full_name, first_name = resolve_recipient_names(full_name, recipient_email)
    ts = requested_at or format_request_timestamp()

    if first_name:
        subject = reset_t["subject_named"].format(first_name=first_name)
        greeting = reset_t["greeting_named"].format(first_name=first_name)
    else:
        subject = reset_t["subject_anon"]
        greeting = reset_t["greeting_anon"]

    security_body = reset_t["security_body"].format(email=recipient_email)

    html_body = _render_base_email(
        brand_url=brand_url,
        preheader=reset_t["preheader"],
        pill_text=reset_t["pill"],
        greeting=greeting,
        intro=reset_t["intro"],
        cta_label=reset_t["cta"],
        action_url=action_url,
        account_name=display_full_name,
        recipient_email=recipient_email,
        status_label=reset_t["status_value"],
        validity_label=reset_t["validity_value"],
        requested_at=ts,
        extra_block_html="",
        security_title=reset_t["security_title"],
        security_body=security_body,
        common_t=common_t,
    )

    text_body = (
        f"{greeting}\n\n"
        f"{reset_t['intro']}\n\n"
        f"{common_t['label_account']}: {display_full_name}\n"
        f"{common_t['label_email']}: {recipient_email}\n"
        f"{common_t['label_validity']}: {reset_t['validity_value']}\n"
        f"{common_t['label_requested']}: {ts}\n\n"
        f"{reset_t['cta']}: {action_url}\n\n"
        f"{reset_t['security_title']}: {security_body}\n\n"
        f"-- {common_t['rights']} ({brand_url.rstrip('/')})"
    )

    return {
        "subject": subject,
        "html": html_body,
        "text": text_body,
        "lang": lang_code,
    }

