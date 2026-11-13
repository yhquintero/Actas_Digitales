package com.actasdigitales.app.export

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.pdf.PdfDocument
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import java.io.File
import java.io.FileOutputStream
import java.text.SimpleDateFormat
import java.util.*

object PdfExportManager {

    /**
     * Genera un documento PDF oficial formateado ejecutivamente con membrete,
     * cuadro de métricas y sello de custodia criptográfica SHA-256.
     */
    fun createActaPdf(
        context: Context,
        filename: String,
        jobId: String,
        correctedText: String,
        sha256: String,
        finalWords: Int,
        removedFillers: Int,
        orthographicCorrections: Int
    ): File? {
        return try {
            val pdfDocument = PdfDocument()
            val pageWidth = 595 // A4 standard width in points
            val pageHeight = 842 // A4 standard height in points

            val pageInfo = PdfDocument.PageInfo.Builder(pageWidth, pageHeight, 1).create()
            val page = pdfDocument.startPage(pageInfo)
            val canvas: Canvas = page.canvas

            val paint = Paint(Paint.ANTI_ALIAS_FLAG)
            val textPaint = TextPaint(Paint.ANTI_ALIAS_FLAG)

            // 1. Membrete e Encabezado Oficial
            paint.color = Color.parseColor("#4F46E5") // Indigo Primary
            canvas.drawRect(0f, 0f, pageWidth.toFloat(), 70f, paint)

            paint.color = Color.WHITE
            paint.textSize = 18f
            paint.isFakeBoldText = true
            canvas.drawText("ACTA DIGITAL OFICIAL", 35f, 40f, paint)

            paint.textSize = 10f
            paint.isFakeBoldText = false
            canvas.drawText("SISTEMA DE INTELIGENCIA ACÚSTICA & ORTOTIPOGRAFÍA RAE", 35f, 56f, paint)

            // 2. Metadatos del Documento
            val dateFormat = SimpleDateFormat("dd/MM/yyyy HH:mm:ss", Locale.getDefault())
            val currentDate = dateFormat.format(Date())

            paint.color = Color.parseColor("#0F172A") // Slate Text Primary
            paint.textSize = 12f
            paint.isFakeBoldText = true
            canvas.drawText("Documento: $filename", 35f, 100f, paint)

            paint.color = Color.parseColor("#64748B")
            paint.textSize = 9f
            paint.isFakeBoldText = false
            canvas.drawText("ID de Trabajo: $jobId  |  Fecha de Emisión: $currentDate", 35f, 116f, paint)

            // 3. Cuadro de Métricas de Procesamiento (Badges)
            val rectF = RectF(35f, 130f, (pageWidth - 35).toFloat(), 185f)
            paint.color = Color.parseColor("#F1F5F9")
            canvas.drawRoundRect(rectF, 8f, 8f, paint)

            paint.color = Color.parseColor("#0F172A")
            paint.textSize = 10f
            paint.isFakeBoldText = true
            canvas.drawText("Métricas de Inteligencia Acústica:", 45f, 148f, paint)

            paint.textSize = 9f
            paint.isFakeBoldText = false
            paint.color = Color.parseColor("#334155")
            canvas.drawText("• Palabras Totales: $finalWords", 50f, 168f, paint)
            canvas.drawText("• Muletillas Eliminadas: $removedFillers", 210f, 168f, paint)
            canvas.drawText("• Correcciones RAE: $orthographicCorrections", 380f, 168f, paint)

            // 4. Sello de Cadena de Custodia SHA-256
            val shaRect = RectF(35f, 195f, (pageWidth - 35).toFloat(), 235f)
            paint.color = Color.parseColor("#0F172A") // Dark Slate
            canvas.drawRoundRect(shaRect, 6f, 6f, paint)

            paint.color = Color.parseColor("#34D399") // Emerald Accent
            paint.textSize = 9f
            paint.isFakeBoldText = true
            canvas.drawText("CADENA DE CUSTODIA CRIPTOGRÁFICA (SHA-256):", 45f, 212f, paint)

            paint.color = Color.WHITE
            paint.textSize = 8f
            paint.isFakeBoldText = false
            canvas.drawText(sha256, 45f, 226f, paint)

            // 5. Cuerpo de Texto Transcrito y Corregido
            paint.color = Color.parseColor("#0F172A")
            paint.textSize = 12f
            paint.isFakeBoldText = true
            canvas.drawText("Transcripción Oficial Formalizada:", 35f, 260f, paint)

            textPaint.color = Color.parseColor("#1E293B")
            textPaint.textSize = 10.5f

            val contentWidth = pageWidth - 70
            val staticLayout = StaticLayout.Builder.obtain(
                correctedText,
                0,
                correctedText.length,
                textPaint,
                contentWidth
            ).setAlignment(Layout.Alignment.ALIGN_NORMAL)
                .setLineSpacing(3f, 1.15f)
                .build()

            // El cuerpo se recorta al espacio disponible antes del pie de página para que
            // el texto nunca se salga del folio A4 (un acta larga se ve truncada, no rota).
            canvas.save()
            canvas.translate(35f, 275f)
            canvas.clipRect(
                0f,
                0f,
                contentWidth.toFloat(),
                (pageHeight - 275 - 40).toFloat()
            )
            staticLayout.draw(canvas)
            canvas.restore()

            // 6. Pie de Página
            paint.color = Color.parseColor("#94A3B8")
            paint.textSize = 8f
            canvas.drawText(
                "Generado automáticamente por Actas Digitales Android · Trazabilidad SHA-256",
                35f,
                (pageHeight - 25).toFloat(),
                paint
            )

            pdfDocument.finishPage(page)

            // Guardar en directorio de la app
            val outputDir = File(context.cacheDir, "pdf_exports")
            if (!outputDir.exists()) outputDir.mkdirs()

            val pdfFile = File(outputDir, "Acta_Digital_${System.currentTimeMillis()}.pdf")
            FileOutputStream(pdfFile).use { fos ->
                pdfDocument.writeTo(fos)
            }
            pdfDocument.close()
            pdfFile
        } catch (e: Exception) {
            null
        }
    }
}
