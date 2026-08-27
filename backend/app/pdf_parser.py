"""
Parser de actas de balonmano en formato PDF.

Extrae los nombres de los dos equipos y las listas de jugadores
(dorsal + nombre) de cada uno.

Compatible con actas de la RFEBM y formatos de federaciones territoriales.
"""

import re
import base64
import fitz  # PyMuPDF


def extract_team_logos(doc):
    """
    Extrae los escudos de los dos equipos desde la cabecera superior del acta PDF.
    Devuelve un diccionario {"home_logo": str, "away_logo": str}.
    """
    if len(doc) == 0:
        return {"home_logo": None, "away_logo": None}

    header_images = []
    pages_to_check = doc[:min(2, len(doc))]

    for page_idx, page in enumerate(pages_to_check):
        header_max_y = page.rect.height * 0.48

        try:
            image_list = page.get_images(full=True)
        except Exception:
            image_list = []

        for img in image_list:
            xref = img[0]
            rects = page.get_image_rects(xref)
            if not rects:
                continue

            for bbox in rects:
                x0, y0, x1, y1 = bbox
                w = x1 - x0
                h = y1 - y0

                # Filtrar gráficos no relevantes (demasiado pequeños o marcas de agua gigantes)
                if w < 12 or h < 12 or w > 450 or h > 450 or y0 > header_max_y:
                    continue

                cx = (x0 + x1) / 2

                try:
                    base_img = doc.extract_image(xref)
                    img_bytes = base_img.get("image")
                    img_ext = base_img.get("ext", "png")
                    if img_bytes and len(img_bytes) > 200:
                        b64 = base64.b64encode(img_bytes).decode("utf-8")
                        data_uri = f"data:image/{img_ext};base64,{b64}"
                        
                        header_images.append({
                            "page": page_idx,
                            "y0": y0,
                            "cx": cx,
                            "area": w * h,
                            "data_uri": data_uri
                        })
                except Exception as e:
                    print("Error extrayendo logo xref", xref, e)

    # Eliminar duplicados por data_uri
    unique_images = []
    seen_uris = set()
    for img in header_images:
        if img["data_uri"] not in seen_uris:
            seen_uris.add(img["data_uri"])
            unique_images.append(img)

    if not unique_images:
        return {"home_logo": None, "away_logo": None}

    # AGRUPAR POR MISMA ALTURA Y0 (Ambos escudos de los equipos comparten la misma altura Y0 en la hoja)
    y_groups = []
    for img in unique_images:
        placed = False
        for group in y_groups:
            if abs(group[0]["y0"] - img["y0"]) <= 20:
                group.append(img)
                placed = True
                break
        if not placed:
            y_groups.append([img])

    # 1. Buscar preferiblemente el grupo que contenga exactamente 2 escudos al mismo nivel de Y0 (Local y Visitante)
    two_logo_group = None
    for group in y_groups:
        if len(group) == 2:
            two_logo_group = group
            break

    if two_logo_group:
        sorted_pair = sorted(two_logo_group, key=lambda x: x["cx"])
        return {
            "home_logo": sorted_pair[0]["data_uri"],
            "away_logo": sorted_pair[1]["data_uri"]
        }

    # 2. Si un grupo tiene más de 2 imágenes (ej. Escudo Local, Logo Federación Centro, Escudo Visitante)
    for group in y_groups:
        if len(group) >= 2:
            sorted_by_x = sorted(group, key=lambda x: x["cx"])
            return {
                "home_logo": sorted_by_x[0]["data_uri"],
                "away_logo": sorted_by_x[-1]["data_uri"]
            }

    # 3. Fallback general ordenando por X
    sorted_all = sorted(unique_images, key=lambda x: x["cx"])
    home_logo = sorted_all[0]["data_uri"]
    away_logo = sorted_all[-1]["data_uri"] if len(sorted_all) > 1 else None

    return {"home_logo": home_logo, "away_logo": away_logo}


def parse_acta_pdf(pdf_bytes: bytes) -> dict:
    """
    Parsea un PDF de acta de balonmano y devuelve los equipos, logos y jugadores.
    """
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")

    # Extraer logos de escudos desde la cabecera del acta
    logos = extract_team_logos(doc)

    # Extraer el texto completo sin modificar nada para depuración / impresión
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"

    home_team = ""
    away_team = ""
    home_players = []
    away_players = []

    for page in doc:
        width = page.rect.width
        mid_x = width / 2

        blocks = page.get_text("blocks")
        blocks.sort(key=lambda b: b[1])

        left_lines = []
        right_lines = []

        for b in blocks:
            x0, y0, x1, y1, text, block_no, block_type = b
            if block_type != 0:
                continue

            block_lines = [line.strip() for line in text.split("\n") if line.strip()]

            center_x = (x0 + x1) / 2
            if center_x < mid_x:
                left_lines.extend(block_lines)
            else:
                right_lines.extend(block_lines)

        left_lines = [l for l in left_lines if l]
        right_lines = [l for l in right_lines if l]

        def clean_team_name(name_str: str) -> str:
            m = re.match(r"^(.+?)\s+(\d+)$", name_str)
            if m:
                return m.group(1).strip()
            return name_str.strip()

        def extract_team_name(lines_list):
            for idx, line in enumerate(lines_list):
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
        def extract_players(lines_list):
            players = []
            start_idx = 0
            for idx, line in enumerate(lines_list):
                if line.strip().isdigit() and 0 <= int(line.strip()) <= 99:
                    start_idx = idx + 1
                    break

            i = start_idx
            while i < len(lines_list):
                line = lines_list[i].strip()

                if any(
                    kw in line.lower()
                    for kw in [
                        "staff", "entrenador", "oficial", "responsable",
                        "arbitro", "anotador", "delegado", "resultado"
                    ]
                ):
                    break

                # Caso 1: Dorsal y nombre en la misma línea (ej. "12 JUAN PEREZ")
                m = re.match(r"^(\d{1,2})\s+([A-ZÁÉÍÓÚÑa-zácéíóúñ\s,\.\'-]+)$", line)
                if m:
                    num = int(m.group(1))
                    name = m.group(2).strip()
                    if len(name) >= 3 and not any(kw in name.lower() for kw in ["oficial", "entrenador", "delegado", "medico", "responsable"]):
                        is_gk = num in [1, 12, 16]
                        if re.search(r"\s*[\(\[]?(?:p|po|gk|portero|goalkeeper)[\)\]]?\s*$", name, re.IGNORECASE):
                            is_gk = True
                            name = re.sub(r"\s*[\(\[]?(?:p|po|gk|portero|goalkeeper)[\)\]]?\s*$", "", name, flags=re.IGNORECASE)
                        players.append({"name": name.strip(), "number": num, "is_goalkeeper": is_gk})
                        i += 1
                        continue

                # Caso 2: Dorsal en una línea y nombre en la siguiente
                dorsal_match = re.match(r"^\s*(\d{1,2})(?:\s*\*|\s+\*)?\s*$", line)
                if dorsal_match:
                    if i + 1 < len(lines_list):
                        next_line = lines_list[i + 1].strip()
                        if any(
                            kw in next_line.lower()
                            for kw in [
                                "staff", "entrenador:", "oficial:", "responsable",
                                "arbitro:", "anotador", "delegado", "resultado"
                            ]
                        ):
                            break
                        if (
                            re.search(r"[a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]", next_line)
                            and ":" not in next_line
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
        "home_logo": logos.get("home_logo"),
        "away_logo": logos.get("away_logo"),
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
