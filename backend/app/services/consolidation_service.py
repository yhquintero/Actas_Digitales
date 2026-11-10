import re
from typing import List, Tuple
from ..models.job import CorrectionItem, AudioSegment

class ConsolidationService:
    # Muletillas y expresiones orales comunes en español
    FILLER_WORDS = [
        r"\b(?:eh|ehh|ehhh|em|emm|emmm|uh|uhh|mmm|mm)\b",
        r"\b(?:o sea|osea)\b(?=,\s*o sea|\s+que|\s+bueno|\s*$|\s+este)",
        r"\b(?:este\.\.\.|este,|este(?=\s+(?:eh|bueno|pues)))",
        r"\b(?:bueno pues|bueno,\s*pues)\b",
        r"\b(?:tipo que|tipo nada)\b",
        r"\b(?:¿sabes\?|¿me explico\?|¿me entiendes\?)\b",
    ]

    @classmethod
    def stitch_segments(cls, segments: List[AudioSegment]) -> str:
        """
        Une fragmentos sucesivos de audio resolviendo solapamientos en las fronteras.
        """
        if not segments:
            return ""
        
        full_text = segments[0].text.strip()
        for i in range(1, len(segments)):
            next_text = segments[i].text.strip()
            overlap_len = cls._find_overlap(full_text, next_text)
            if overlap_len > 0:
                full_text += " " + next_text[overlap_len:].strip()
            else:
                full_text += " " + next_text
                
        return full_text

    @staticmethod
    def _find_overlap(text_a: str, text_b: str, max_words: int = 6) -> int:
        """
        Encuentra el número de caracteres solapados entre el final de text_a y el inicio de text_b.
        """
        words_a = text_a.split()
        words_b = text_b.split()
        
        for k in range(min(max_words, len(words_a), len(words_b)), 1, -1):
            tail_a = " ".join(words_a[-k:]).lower()
            head_b = " ".join(words_b[:k]).lower()
            if tail_a == head_b:
                # Retorna índice en text_b donde termina la coincidencia
                match_str = " ".join(words_b[:k])
                idx = text_b.lower().find(match_str.lower())
                if idx != -1:
                    return idx + len(match_str)
        return 0

    @classmethod
    def clean_and_consolidate(cls, raw_text: str) -> Tuple[str, List[CorrectionItem], int]:
        """
        Limpia artefactos orales, tartamudeos y repeticiones.
        Retorna (texto_limpio, lista_de_correcciones, cantidad_muletillas_eliminadas).
        """
        corrections: List[CorrectionItem] = []
        text = raw_text
        fillers_count = 0

        # 1. Eliminar tartamudeos con guiones: ej. "de-de-de verdad" -> "de verdad", "yo-yo" -> "yo"
        def fix_stutter_hyphen(match):
            nonlocal fillers_count
            full = match.group(0)
            word = match.group(2)
            fillers_count += 1
            corrections.append(CorrectionItem(
                original=full,
                corrected=word,
                type="repeticion",
                explanation="Eliminación de tartamudeo o corte de voz"
            ))
            return word

        text = re.sub(r'\b((\w{1,5})-)+(\w{1,5})\b', fix_stutter_hyphen, text, flags=re.IGNORECASE)

        # 2. Eliminar repetición inmediata de palabras: "vamos a a a revisar" -> "vamos a revisar"
        def fix_immediate_repeat(match):
            nonlocal fillers_count
            word = match.group(1)
            full = match.group(0)
            fillers_count += 1
            corrections.append(CorrectionItem(
                original=full,
                corrected=word,
                type="repeticion",
                explanation=f"Eliminación de palabra repetida accidentalmente ('{word}')"
            ))
            return word

        text = re.sub(r'\b([a-zA-ZáéíóúÁÉÍÓÚñÑ]+)(?:\s+\1\b)+', fix_immediate_repeat, text, flags=re.IGNORECASE)

        # 3. Eliminar muletillas y vacilaciones
        for pattern in cls.FILLER_WORDS:
            matches = list(re.finditer(pattern, text, flags=re.IGNORECASE))
            for m in matches:
                fillers_count += 1
                matched_str = m.group(0)
                corrections.append(CorrectionItem(
                    original=matched_str,
                    corrected="",
                    type="muletilla",
                    explanation=f"Supresión de muletilla o vacilación oral ('{matched_str}')"
                ))
            text = re.sub(pattern, '', text, flags=re.IGNORECASE)

        # 4. Limpieza de espacios redundantes y comas sueltas
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'\s*,\s*,+', ',', text)
        text = re.sub(r'\s+([,.:;?!])', r'\1', text)
        text = text.strip()

        return text, corrections, fillers_count
