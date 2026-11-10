import re
import json
from typing import List, Tuple
import requests
from ..config import settings
from ..models.job import CorrectionItem

class CorrectionService:
    # Diccionario de correcciones ortográficas frecuentes en español (acentuación y ortografía)
    COMMON_SPELLING_CORRECTIONS = {
        "tambien": "también",
        "ademas": "además",
        "despues": "después",
        "aqui": "aquí",
        "ahi": "ahí",
        "alli": "allí",
        "asi": "así",
        "mas": "más",
        "dia": "día",
        "dias": "días",
        "ano": "año",
        "anos": "años",
        "reunion": "reunión",
        "reuniones": "reuniones",
        "conclusion": "conclusión",
        "conclusiones": "conclusiones",
        "sesion": "sesión",
        "sesiones": "sesiones",
        "discusion": "discusión",
        "comision": "comisión",
        "comunicacion": "comunicación",
        "situacion": "situación",
        "informacion": "información",
        "decision": "decisión",
        "decisiones": "decisiones",
        "numero": "número",
        "numeros": "números",
        "ultimo": "último",
        "ultimos": "últimos",
        "ultima": "última",
        "ultimas": "últimas",
        "proximo": "próximo",
        "proximos": "próximos",
        "proxima": "próxima",
        "proximas": "próximas",
        "parrafo": "párrafo",
        "articulo": "artículo",
        "articulos": "artículos",
        "tecnico": "técnico",
        "tecnicos": "técnicos",
        "tecnica": "técnica",
        "politica": "política",
        "publico": "público",
        "publica": "pública",
        "estara": "estará",
        "estaran": "estarán",
        "habra": "habrá",
        "tendra": "tendrá",
        "tendran": "tendrán",
        "sera": "será",
        "seran": "serán",
        "haria": "haría",
        "harian": "harían",
        "deberia": "debería",
        "deberian": "deberían",
        "podria": "podría",
        "podrian": "podrían",
        "facil": "fácil",
        "dificil": "difícil",
        "util": "útil",
        "caracter": "carácter",
        "orden del dia": "orden del día",
        "a ver": "a ver",
    }

    @classmethod
    def correct_text(
        cls,
        text: str,
        custom_api_key: str = ""
    ) -> Tuple[str, List[CorrectionItem]]:
        """
        Corrige gramática, ortografía y tipografía.
        Si hay API Key de OpenAI o Groq, delega a LLM especializado en español.
        En caso contrario, utiliza el motor de reglas NLP de español.
        """
        api_key = custom_api_key or settings.OPENAI_API_KEY or settings.GROQ_API_KEY
        
        if api_key:
            try:
                llm_result, llm_corrections = cls._correct_via_llm(text, api_key)
                if llm_result:
                    return llm_result, llm_corrections
            except Exception as e:
                # Fallback al motor local si la API externa falla
                print(f"[Warning] LLM correction failed: {e}. Falling back to rule engine.")

        return cls._correct_via_rules(text)

    @classmethod
    def _correct_via_rules(cls, text: str) -> Tuple[str, List[CorrectionItem]]:
        corrections: List[CorrectionItem] = []
        result = text

        # 1. Correcciones de palabras comunes sin tilde u ortografía
        for wrong, correct in cls.COMMON_SPELLING_CORRECTIONS.items():
            pattern = rf"\b{re.escape(wrong)}\b"
            
            def replace_word(match):
                original_match = match.group(0)
                # Preserva mayúscula inicial si la tenía
                replacement = correct.capitalize() if original_match[0].isupper() else correct
                if original_match != replacement:
                    corrections.append(CorrectionItem(
                        original=original_match,
                        corrected=replacement,
                        type="ortografia",
                        explanation=f"Acentuación u ortografía correcta en español: '{replacement}'"
                    ))
                return replacement

            result = re.sub(pattern, replace_word, result, flags=re.IGNORECASE)

        # 2. Puntuación: asegurar signos de apertura en español (¿ y ¡)
        # Buscar oraciones que terminen en '?' pero no tengan '¿'
        def fix_question_marks(match):
            clause = match.group(0)
            if not clause.startswith("¿"):
                corrections.append(CorrectionItem(
                    original=clause,
                    corrected="¿" + clause,
                    type="puntuacion",
                    explanation="Añadido signo de interrogación de apertura '¿' reglamentario en español"
                ))
                return "¿" + clause
            return clause

        result = re.sub(r'(?:^|[.!?]\s+)([a-zA-ZáéíóúÁÉÍÓÚñÑ][^.!?]*\?)', fix_question_marks, result)

        # 3. Signo de exclamación de apertura '¡'
        def fix_exclamation_marks(match):
            clause = match.group(0)
            if not clause.startswith("¡"):
                corrections.append(CorrectionItem(
                    original=clause,
                    corrected="¡" + clause,
                    type="puntuacion",
                    explanation="Añadido signo de exclamación de apertura '¡' reglamentario en español"
                ))
                return "¡" + clause
            return clause

        result = re.sub(r'(?:^|[.!?]\s+)([a-zA-ZáéíóúÁÉÍÓÚñÑ][^.!?]*\!)', fix_exclamation_marks, result)

        # 4. Mayúscula al inicio de cada oración
        def capitalize_sentences(match):
            sep = match.group(1)
            letter = match.group(2)
            return sep + letter.upper()

        result = re.sub(r'(^|[.!?¿¡]\s+)([a-záéíóúñ])', capitalize_sentences, result)

        # 5. Punto final si no tiene puntuación de cierre
        if result and result[-1] not in ".!?":
            result += "."
            corrections.append(CorrectionItem(
                original="(sin punto final)",
                corrected=".",
                type="puntuacion",
                explanation="Punto final añadido al término del texto"
            ))

        return result, corrections

    @classmethod
    def _correct_via_llm(cls, text: str, api_key: str) -> Tuple[str, List[CorrectionItem]]:
        """
        Llama al LLM para corrección ortotipográfica y gramatical avanzada en español.
        """
        is_groq = api_key.startswith("gsk_")
        endpoint = "https://api.groq.com/openai/v1/chat/completions" if is_groq else "https://api.openai.com/v1/chat/completions"
        model = "llama-3.1-8b-instant" if is_groq else "gpt-4o-mini"

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }

        prompt = f"""Actúa como un corrector ortotipográfico y gramatical experto en español para actas y documentos oficiales.
Tu tarea es tomar la siguiente transcripción y:
1. Corregir cualquier falta de ortografía, tildes diacríticas y puntuación (añadiendo signos ¿ y ¡ donde corresponda).
2. Asegurar concordancia gramatical y cohesión en las oraciones.
3. Mantener fielmente el sentido del mensaje sin inventar información.
4. Generar una salida en formato JSON con dos campos:
   - "corrected_text": El texto completo consolidado y corregido en párrafos limpios.
   - "corrections": Lista de correcciones aplicadas [{{"original": "...", "corrected": "...", "type": "ortografia|gramatica|puntuacion", "explanation": "..."}}]

Texto a corregir:
{text}
"""

        payload = {
            "model": model,
            "messages": [
                {"role": "system", "content": "Responde estrictamente en formato JSON válido."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        resp = requests.post(endpoint, json=payload, headers=headers, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        parsed = json.loads(content)
        
        corrected = parsed.get("corrected_text", text)
        raw_items = parsed.get("corrections", [])
        corrections = [
            CorrectionItem(
                original=item.get("original", ""),
                corrected=item.get("corrected", ""),
                type=item.get("type", "gramatica"),
                explanation=item.get("explanation")
            )
            for item in raw_items
        ]
        return corrected, corrections
