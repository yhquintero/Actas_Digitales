"""
Generación de PDF del acta en el servidor (fpdf2, puramente local).

- Sin servicios externos: todo se genera en el propio proceso.
- Fuentes core (helvetica) con codificación latin-1; el texto se sanea con un
  mapa de puntuación tipográfica (— – ‘ ’ “ ” … • ‑) a latin-1. Los caracteres
  fuera de latin-1 se reemplazan por '?' de forma visible y honesta.
- Tres tamaños de hoja (A4 / Carta / Oficio) y tres juegos de márgenes
  (estándar / estrecho / encuadernación), coherentes con la exportación DOCX.
- Modos: 'full_text' (solo el contenido) y 'official_acta' (acta con secciones
  y bloque de firmas), con huella SHA-256 del contenido en el pie.
"""

import hashlib
from typing import List, Optional

from fpdf import FPDF
from fpdf.enums import XPos, YPos

_PAGE_FORMATS = {
    "a4": (210, 297),
    "letter": (215.9, 279.4),
    "legal": (215.9, 355.6),
}

_MARGINS = {  # (top, bottom, left, right) en mm
    "narrow": (12.7, 12.7, 12.7, 12.7),
    "binding": (25.4, 25.4, 35.6, 20.3),
    "standard": (25.4, 25.4, 25.4, 25.4),
}

_ACCENT = (49, 46, 129)     # índigo oscuro (#312E81)
_TEXT = (30, 41, 59)        # pizarra (#1E293B)
_MUTED = (100, 116, 139)    # gris (#64748B)

_SMART_MAP = {
    "—": "-", "–": "-", "―": "-", "‑": "-", "‒": "-",
    "‘": "'", "’": "'", "‚": "'", "‛": "'", "′": "'",
    "“": '"', "”": '"', "„": '"', "‟": '"', "″": '"',
    "…": "...", "•": "*", "●": "*", "◦": "*",
    "‹": "<", "›": ">",
    "€": "EUR", "£": "GBP", "©": "(c)", "®": "(R)", "™": "(TM)",
    " ": " ", " ": " ", "​": "", "﻿": "",
}


def sanitize_latin1(text: str) -> str:
    """Convierte texto Unicode a algo representable en latin-1 sin romper tildes ni ¿/¡."""
    out: List[str] = []
    for ch in text or "":
        if ch in _SMART_MAP:
            out.append(_SMART_MAP[ch])
        else:
            try:
                ch.encode("latin-1")
                out.append(ch)
            except UnicodeEncodeError:
                out.append("?")
    return "".join(out)


class ActaPDF(FPDF):
    def __init__(self, content_sha256: str, paper_format: str):
        super().__init__()
        self._content_sha256 = content_sha256
        self._paper_format = paper_format
        self.set_auto_page_break(auto=True, margin=18)

    def header(self):
        self.set_font("helvetica", "B", 7)
        self.set_text_color(*_MUTED)
        self.cell(0, 5, "ACTAS DIGITALES  ·  PROTOCOLO OFICIAL", align="L",
                  new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.cell(0, 5, f"SHA-256 {self._content_sha256[:16]}", align="R")
        self.ln(8)

    def footer(self):
        self.set_y(-13)
        self.set_font("helvetica", "I", 7)
        self.set_text_color(*_MUTED)
        self.cell(0, 6, f"Actas Digitales · {self._paper_format.upper()} · Página {self.page_no()}/{{nb}}",
                  align="C")


def build_acta_pdf(
    text: str,
    *,
    title: str,
    export_type: str,
    paper_size: str = "a4",
    margin_type: str = "standard",
    date_str: Optional[str] = None,
    place: Optional[str] = None,
    attendees: Optional[str] = None,
    president: Optional[str] = None,
    secretary: Optional[str] = None,
    audio_duration: Optional[str] = None,
    wpm: Optional[str] = None,
    reading_time: Optional[str] = None,
) -> bytes:
    paper_size = paper_size if paper_size in _PAGE_FORMATS else "a4"
    margin_type = margin_type if margin_type in _MARGINS else "standard"
    content_sha256 = hashlib.sha256((text or "").encode("utf-8")).hexdigest()

    width_mm, height_mm = _PAGE_FORMATS[paper_size]
    margins = _MARGINS[margin_type]

    pdf = ActaPDF(content_sha256, paper_size)
    pdf.alias_nb_pages()
    pdf.set_margins(margins[2], margins[0], margins[3])
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page(format=(width_mm, height_mm))
    pdf.set_title(sanitize_latin1(title or "Acta"))
    pdf.set_author("Actas Digitales")
    pdf.set_creator("Actas Digitales · export-pdf")

    clean = sanitize_latin1(text or "")
    now = sanitize_latin1(date_str or "")

    def title_block(main: str, sub: str):
        pdf.set_font("helvetica", "B", 15)
        pdf.set_text_color(*_ACCENT)
        pdf.multi_cell(0, 8, main, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("helvetica", "I", 9)
        pdf.set_text_color(*_MUTED)
        pdf.multi_cell(0, 5, sub, align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)
        pdf.set_draw_color(*_ACCENT)
        pdf.set_line_width(0.6)
        pdf.line(margins[2], pdf.get_y(), width_mm - margins[3], pdf.get_y())
        pdf.ln(4)

    def section_heading(text_h: str):
        pdf.set_font("helvetica", "B", 10.5)
        pdf.set_text_color(*_ACCENT)
        pdf.multi_cell(0, 6, sanitize_latin1(text_h), new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(0.5)

    def body_paragraph(para: str):
        pdf.set_font("helvetica", "", 10)
        pdf.set_text_color(*_TEXT)
        pdf.multi_cell(0, 5.6, para, align="J", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(1.2)

    def audit_line():
        if not audio_duration:
            return
        pdf.set_font("helvetica", "I", 8)
        pdf.set_text_color(*_MUTED)
        extra = f"Auditoría temporal de audio: duración real {sanitize_latin1(audio_duration)}"
        if reading_time:
            extra += f" | lectura ~ {sanitize_latin1(reading_time)}"
        if wpm:
            extra += f" | ritmo {sanitize_latin1(wpm)} WPM"
        pdf.multi_cell(0, 4.5, sanitize_latin1(extra), align="C", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.ln(2)

    paragraphs = [p.strip() for p in clean.split("\n") if p.strip()] or ([clean] if clean else ["(sin contenido)"])

    if export_type == "full_text":
        title_block(
            f"TRANSCRIPCIÓN Y TRADUCCIÓN OFICIAL\n{sanitize_latin1((title or 'ACTA').upper())}",
            f"Fecha: {now or '-'} | Papel: {paper_size.upper()} | Corrección ortotipográfica RAE",
        )
        audit_line()
        for para in paragraphs:
            body_paragraph(para)
    else:
        title_block(
            f"ACTA OFICIAL\n{sanitize_latin1((title or 'ACTA').upper())}",
            f"Fecha: {now or '-'}   |   Lugar: {sanitize_latin1(place or '-')}   |   Asistentes: {sanitize_latin1(attendees or '-')}",
        )
        audit_line()

        section_heading("1. Convocatoria y Quórum")
        body_paragraph("Reunidos los comparecientes señalados en la fecha y lugar indicados, se verifica el quórum legal y se declara abierta la sesión.")

        section_heading("2. Resumen de Intervenciones y Deliberaciones")
        for para in paragraphs:
            body_paragraph(para)

        section_heading("3. Acuerdos Adoptados")
        sentences = [s.strip() for s in clean.replace("\n", ". ").split(".") if len(s.strip()) > 15]
        acuerdos = sentences[:4] if sentences else ["Aprobación de la agenda y seguimiento de acuerdos previos"]
        for idx, ac in enumerate(acuerdos, 1):
            body_paragraph(f"{idx}. ACUERDO-{idx:02d}: {ac}.")

        section_heading("4. Cierre y Diligencia de Firmas")
        body_paragraph("No habiendo más asuntos que tratar, se levanta la sesión formal:")
        pdf.ln(14)
        sig_left = sanitize_latin1(president or "Presidente")
        sig_right = sanitize_latin1(secretary or "Secretario")
        line = "_" * 30
        pdf.set_font("helvetica", "", 9)
        pdf.set_text_color(*_TEXT)
        pdf.cell(width_mm / 2 - margins[2], 6, line, align="L", new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(0, 6, line, align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("helvetica", "B", 9)
        pdf.cell(width_mm / 2 - margins[2], 5, sig_left[:34], align="L", new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(0, 5, sig_right[:34], align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.set_font("helvetica", "I", 8)
        pdf.set_text_color(*_MUTED)
        pdf.cell(width_mm / 2 - margins[2], 5, "Presidente", align="L", new_x=XPos.RIGHT, new_y=YPos.TOP)
        pdf.cell(0, 5, "Secretario", align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.ln(6)
    pdf.set_font("helvetica", "I", 6.5)
    pdf.set_text_color(*_MUTED)
    pdf.multi_cell(0, 4, f"Huella SHA-256 del contenido: {content_sha256}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    return bytes(pdf.output())
