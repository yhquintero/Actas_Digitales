#!/usr/bin/env python3
"""
Pruebas Unitarias del Pipeline de Voz a Texto, Consolidación y Corrección Ortotipográfica
"""

import sys
import unittest
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR / "backend"))

from app.services.consolidation_service import ConsolidationService
from app.services.correction_service import CorrectionService
from app.models.job import AudioSegment

class TestPipelineProcesamiento(unittest.TestCase):

    def test_01_eliminacion_tartamudeos(self):
        """Verifica la eliminación de tartamudeos con guion."""
        raw = "yo-yo creo que de-de-de verdad debemos comenzar."
        cleaned, corrections, count = ConsolidationService.clean_and_consolidate(raw)
        self.assertIn("yo creo", cleaned)
        self.assertIn("de verdad", cleaned)
        self.assertNotIn("yo-yo", cleaned)
        self.assertNotIn("de-de-de", cleaned)

    def test_02_eliminacion_palabras_repetidas(self):
        """Verifica la eliminación de repetición inmediata de palabras."""
        raw = "vamos a a a revisar el informe técnico."
        cleaned, corrections, count = ConsolidationService.clean_and_consolidate(raw)
        self.assertEqual(cleaned, "vamos a revisar el informe técnico.")

    def test_03_supresion_muletillas_orales(self):
        """Verifica la eliminación de muletillas típicas del español."""
        raw = "bueno pues este... damos inicio a la sesión. o sea que estamos todos."
        cleaned, corrections, count = ConsolidationService.clean_and_consolidate(raw)
        self.assertNotIn("bueno pues", cleaned)
        self.assertNotIn("este...", cleaned)

    def test_04_correccion_ortografica_y_acentos(self):
        """Verifica la corrección de tildes y palabras frecuentes en español."""
        raw = "la sesion del dia de hoy tendra lugar aqui."
        corrected, corrections = CorrectionService.correct_text(raw)
        self.assertIn("sesión", corrected)
        self.assertIn("día", corrected)
        self.assertIn("tendrá", corrected)
        self.assertIn("aquí", corrected)

    def test_05_signos_de_apertura_espanol(self):
        """Verifica la inserción de signos de apertura obligatorios (¿ y ¡)."""
        raw = "habra alguna duda al respecto? que gran acuerdo!"
        corrected, corrections = CorrectionService.correct_text(raw)
        self.assertTrue(corrected.startswith("¿") or "¿habrá" in corrected or "¿Habrá" in corrected)

    def test_06_union_de_segmentos_solapados(self):
        """Verifica que el algoritmo una segmentos con solapamiento."""
        seg1 = AudioSegment(id=0, start_time=0.0, end_time=4.0, text="ayer fuimos a la reunión del comité")
        seg2 = AudioSegment(id=1, start_time=3.0, end_time=7.0, text="del comité y aprobamos los presupuestos")
        stitched = ConsolidationService.stitch_segments([seg1, seg2])
        self.assertIn("ayer fuimos a la reunión del comité y aprobamos los presupuestos", stitched)

if __name__ == "__main__":
    unittest.main()
