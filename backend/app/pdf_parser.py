"""
Parser de actas de balonmano en formato PDF.

Extrae los nombres de los dos equipos y las listas de jugadores
(dorsal + nombre) de cada uno.

Compatible con actas de la RFEBM y formatos de federaciones territoriales.
"""

import re
import fitz  # PyMuPDF


def parse_acta_pdf(pdf_bytes: bytes) -> dict:
    """
    Parsea un PDF de acta de balonmano y devuelve los equipos y jugadores.

    Returns:
        {
            "home_team": str,
            "away_team": str,
            "home_players": [{"name": str, "number": int}, ...],
            "away_players": [{"name": str, "number": int}, ...]
        }
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    # Extraer el texto completo sin modificar nada para depuración / impresión
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"

    print("=== TEXTO COMPLETO EXTRAÍDO ===")
    print(full_text)
    print("===============================")

    home_team = ""
    away_team = ""
    home_players = []
    away_players = []

    for page in doc:
        width = page.rect.width
        mid_x = width / 2

        # Obtener bloques: lista de (x0, y0, x1, y1, "text", block_no, block_type)
        blocks = page.get_text("blocks")

        # Ordenar bloques por coordenada Y (de arriba a abajo)
        blocks.sort(key=lambda b: b[1])

        left_lines = []
        right_lines = []

        for b in blocks:
            x0, y0, x1, y1, text, block_no, block_type = b
            if block_type != 0:  # Omitir bloques de imagen
                continue

            block_lines = [line.strip() for line in text.split("\n") if line.strip()]

            # Determinar si el bloque está en la mitad izquierda o derecha
            center_x = (x0 + x1) / 2
            if center_x < mid_x:
                left_lines.extend(block_lines)
            else:
                right_lines.extend(block_lines)

        # Limpiar líneas vacías
        left_lines = [l for l in left_lines if l]
        right_lines = [l for l in right_lines if l]

        def clean_team_name(name_str: str) -> str:
            m = re.match(r"^(.+?)\s+(\d+)$", name_str)
            if m:
                return m.group(1).strip()
            return name_str.strip()

        def extract_team_name(lines_list):
            for idx, line in enumerate(lines_list):
                # Buscamos la línea que sea el marcador (dígitos del marcador, ej: "32")
                if line.strip().isdigit() and 0 <= int(line.strip()) <= 99:
                    for k in range(1, 4):
                        if idx - k >= 0:
                            cand = lines_list[idx - k].strip()
                            if (
                                cand
                                and not any(
                                    kw in cand.lower()
                                    for kw in [
                                        "fecha", "terreno", "streaming", "código",
                                        "celebrado", "espectadores", "temporada",
                                        "andaluza", "responsable", "arbitro", "oficial"
                                    ]
                                )
                            ):
                                return clean_team_name(cand)
            return ""

        def extract_players(lines_list):
            players = []
            
            # Encontrar dónde empezar: después del marcador
            start_idx = 0
            for idx, line in enumerate(lines_list):
                if line.strip().isdigit() and 0 <= int(line.strip()) <= 99:
                    start_idx = idx + 1
                    break
                    
            i = start_idx
            while i < len(lines_list):
                line = lines_list[i].strip()
                
                # Detenerse si encontramos palabras clave del staff técnico
                if any(
                    kw in line.lower()
                    for kw in [
                        "staff", "entrenador", "oficial", "responsable",
                        "arbitro", "anotador", "delegado", "resultado"
                    ]
                ):
                    break
                    
                # Buscar dorsal
                dorsal_match = re.match(r"^\s*(\d{1,2})(?:\s*\*|\s+\*)?\s*$", line)
                if dorsal_match:
                    if i + 1 < len(lines_list):
                        next_line = lines_list[i + 1].strip()
                        # Detenerse si la siguiente línea es el inicio del staff
                        if any(
                            kw in next_line.lower()
                            for kw in [
                                "staff", "entrenador:", "oficial:", "responsable",
                                "arbitro:", "anotador", "delegado", "resultado"
                            ]
                        ):
                            break
                        # Validar si el siguiente es el nombre
                        if (
                            re.search(r"[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]", next_line)
                            and not ":" in next_line
                            and next_line.lower() not in ["nº", "nombre y apellidos", "jugadores", "g", "a", "d", "dd"]
                            and len(next_line) >= 3
                        ):
                            number = int(dorsal_match.group(1))
                            raw_name = next_line
                            is_gk = number in [1, 12, 16]
                            cleaned_name = raw_name
                            if re.search(r"\s*[\(\[]?(?:p|po|gk|portero|goalkeeper)[\)\]]?\s*$", raw_name, re.IGNORECASE):
                                is_gk = True
                                cleaned_name = re.sub(r"\s*[\(\[]?(?:p|po|gk|portero|goalkeeper)[\)\]]?\s*$", "", raw_name, flags=re.IGNORECASE)
                            
                            players.append({"name": cleaned_name.strip(), "number": number, "is_goalkeeper": is_gk})
                            i += 2
                            continue
                i += 1
                
            return players

        h_team = extract_team_name(left_lines)
        a_team = extract_team_name(right_lines)
        h_players = extract_players(left_lines)
        a_players = extract_players(right_lines)

        if h_team:
            home_team = h_team
        if a_team:
            away_team = a_team
        if h_players:
            home_players = h_players
        if a_players:
            away_players = a_players

    doc.close()

    # Plan de respaldo (fallback) en base a texto plano si falla la separación
    if not home_team or not away_team or (not home_players and not away_players):
        fallback_res = _extract_teams_and_players(full_text)
        if not home_team:
            home_team = fallback_res["home_team"]
        if not away_team:
            away_team = fallback_res["away_team"]
        if not home_players:
            home_players = fallback_res["home_players"]
        if not away_players:
            away_players = fallback_res["away_players"]

    return {
        "home_team": home_team,
        "away_team": away_team,
        "home_players": home_players,
        "away_players": away_players,
    }


def _extract_teams_and_players(text: str) -> dict:
    """
    Plan de respaldo en base a texto plano.
    """
    lines = text.split("\n")
    lines = [line.strip() for line in lines if line.strip()]

    home_team = ""
    away_team = ""
    home_players = []
    away_players = []

    # Buscar "EQUIPO LOCAL" / "EQUIPO VISITANTE"
    team_pattern = re.compile(
        r"(?:equipo\s+)?(?:local|loc\.?)\s*[:\-]?\s*(.+)",
        re.IGNORECASE
    )
    away_pattern = re.compile(
        r"(?:equipo\s+)?(?:visitante|vis\.?)\s*[:\-]?\s*(.+)",
        re.IGNORECASE
    )

    for line in lines:
        if any(
            kw in line.lower()
            for kw in [
                "responsable", "entrenador", "oficial", "arbitro", "anotador",
                "delegado"
            ]
        ):
            continue

        m = team_pattern.match(line)
        if m and not home_team:
            home_team = m.group(1).strip()
        m = away_pattern.match(line)
        if m and not away_team:
            away_team = m.group(1).strip()

    # Buscar cabecera de jugadores
    header_idx = -1
    for idx, line in enumerate(lines):
        if "nº" in line.lower() and "nombre" in line.lower():
            header_idx = idx
            break

    if not home_team or not away_team:
        if header_idx != -1:
            candidates = []
            for k in range(1, 5):
                if header_idx - k >= 0:
                    cand = lines[header_idx - k]
                    if (
                        not any(
                            kw in cand.lower()
                            for kw in [
                                "fecha", "terreno", "streaming", "código",
                                "celebrado", "espectadores", "temporada",
                                "andaluza", "responsable", "arbitro", "oficial"
                            ]
                        )
                        and not cand.isdigit()
                    ):
                        candidates.append(cand)

            if len(candidates) >= 2:
                away_cand = candidates[0]
                home_cand = candidates[1]

                def clean_name(name_str):
                    m = re.match(r"^(.+?)\s+(\d+)$", name_str)
                    return m.group(1).strip() if m else name_str.strip()

                home_team = clean_name(home_cand)
                away_team = clean_name(away_cand)

    # Extraer jugadores
    player_pattern = re.compile(
        r"^\s*(\d{1,2})\s*(?:\*\s*)?([^\d\:\*]+)",
    )

    all_players = []
    for line in lines:
        if any(
            kw in line.lower()
            for kw in [
                "staff", "entrenador", "oficial", "responsable",
                "arbitro", "anotador", "delegado", "resultado"
            ]
        ):
            continue

        m = player_pattern.match(line)
        if m:
            number = int(m.group(1))
            raw_name = m.group(2).strip().rstrip(",").strip()
            is_gk = number in [1, 12, 16]
            cleaned_name = raw_name
            if re.search(r"\s*[\(\[]?(?:p|po|gk|portero|goalkeeper)[\)\]]?\s*$", raw_name, re.IGNORECASE):
                is_gk = True
                cleaned_name = re.sub(r"\s*[\(\[]?(?:p|po|gk|portero|goalkeeper)[\)\]]?\s*$", "", raw_name, flags=re.IGNORECASE)
            
            all_players.append({"name": cleaned_name.strip(), "number": number, "is_goalkeeper": is_gk})

    if all_players:
        mid = len(all_players) // 2
        home_players = all_players[:mid]
        away_players = all_players[mid:]

    return {
        "home_team": home_team,
        "away_team": away_team,
        "home_players": home_players,
        "away_players": away_players,
    }
