import io
from typing import Dict, Any, List
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    PageBreak,
    HRFlowable,
)
from reportlab.pdfgen import canvas


def _clean_text(text: Any) -> str:
    """Membersihkan karakter unicode yang tidak didukung font standar Helvetica ReportLab."""
    if text is None:
        return ""
    s = str(text)
    replacements = {
        "\u2014": " - ",  # em dash
        "\u2013": "-",    # en dash
        "\u2018": "'",    # left single quote
        "\u2019": "'",    # right single quote
        "\u201c": '"',    # left double quote
        "\u201d": '"',    # right double quote
        "\u2026": "...",  # ellipsis
        "\u00a0": " ",    # non-breaking space
        "\u2264": "<=",   # less than or equal
        "\u2265": ">=",   # greater than or equal
        "\u2260": "!=",   # not equal
        "\u00b1": "+/-",  # plus-minus
    }
    for k, v in replacements.items():
        s = s.replace(k, v)
    return s


class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Header (mulai halaman 2)
        if self._pageNumber > 1:
            self.drawString(2 * cm, 28.5 * cm, "Statistika Pro - Laporan Analisis Data")
            self.drawRightString(19 * cm, 28.5 * cm, datetime.now().strftime("%d/%m/%Y"))
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.5)
            self.line(2 * cm, 28.3 * cm, 19 * cm, 28.3 * cm)

        # Footer (semua halaman)
        page_str = f"Halaman {self._pageNumber} dari {total_pages}"
        self.drawRightString(19 * cm, 1.2 * cm, page_str)
        self.drawString(2 * cm, 1.2 * cm, "Dokumen resmi dihasilkan oleh Statistika Pro")
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(2 * cm, 1.5 * cm, 19 * cm, 1.5 * cm)

        self.restoreState()


def build_pdf_report(report_data: Dict[str, Any]) -> io.BytesIO:
    """Membangun laporan PDF berstandar akademik APA 7 menggunakan ReportLab."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )

    styles = getSampleStyleSheet()

    # Custom Typography Styles
    title_style = ParagraphStyle(
        "CoverTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=26,
        textColor=colors.HexColor("#0F172A"),
        spaceAfter=12,
        alignment=1,  # Center
    )

    subtitle_style = ParagraphStyle(
        "CoverSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#475569"),
        spaceAfter=24,
        alignment=1,
    )

    h1_style = ParagraphStyle(
        "APA_H1",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True,
    )

    h2_style = ParagraphStyle(
        "APA_H2",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#334155"),
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True,
    )

    body_style = ParagraphStyle(
        "APA_Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=14,
        textColor=colors.HexColor("#1E293B"),
        spaceAfter=6,
    )

    table_header_style = ParagraphStyle(
        "APA_TH",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0F172A"),
        alignment=1,
    )

    table_cell_style = ParagraphStyle(
        "APA_TD",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8,
        leading=10.5,
        textColor=colors.HexColor("#1E293B"),
    )

    meta_label_style = ParagraphStyle(
        "MetaLabel",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor("#475569"),
    )

    story: List[Any] = []

    meta = report_data.get("metadata", {})
    ds = report_data.get("dataset", {})
    sel_sections = set(report_data.get("selected_sections", []))
    analysis_map = report_data.get("analysis_map", {})
    histories = report_data.get("histories", [])

    # 1. HALAMAN JUDUL / SAMPUL (Cover)
    story.append(Spacer(1, 2 * cm))
    doc_title = _clean_text(meta.get("title") or "Laporan Hasil Analisis Statistik")
    story.append(Paragraph(doc_title, title_style))
    story.append(Paragraph("Statistika Pro - Applied Statistical Analysis System", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A8A"), spaceBefore=5, spaceAfter=25))

    # Kotak Informasi Metadata Penelitian
    meta_table_data = [
        [Paragraph("Peneliti:", meta_label_style), Paragraph(_clean_text(meta.get("researcher") or "-"), body_style)],
        [Paragraph("Institusi / Jurusan:", meta_label_style), Paragraph(_clean_text(meta.get("institution") or "-"), body_style)],
        [Paragraph("Periode Penelitian:", meta_label_style), Paragraph(_clean_text(meta.get("period") or "-"), body_style)],
        [Paragraph("Nama Dataset:", meta_label_style), Paragraph(_clean_text(ds.get("name") or "-"), body_style)],
        [Paragraph("Ukuran Sampel (N):", meta_label_style), Paragraph(f"{len(ds.get('rows', []))} Responden / Kasus", body_style)],
        [Paragraph("Jumlah Variabel:", meta_label_style), Paragraph(f"{len(ds.get('variables', []))} Kolom", body_style)],
        [Paragraph("Tanggal Cetak:", meta_label_style), Paragraph(datetime.now().strftime("%d %B %Y %H:%M WIB"), body_style)],
    ]
    if meta.get("notes"):
        meta_table_data.append([Paragraph("Catatan:", meta_label_style), Paragraph(_clean_text(meta.get("notes")), body_style)])

    meta_tbl = Table(meta_table_data, colWidths=[4.5 * cm, 12.5 * cm])
    meta_tbl.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#F1F5F9")),
    ]))
    story.append(meta_tbl)
    story.append(Spacer(1, 1.5 * cm))

    story.append(PageBreak())

    # 2. KAMUS VARIABEL (Jika Dipilih)
    if "kamus_variabel" in sel_sections and ds.get("variables"):
        story.append(Paragraph("1. Kamus Variabel (Codebook)", h1_style))
        story.append(Paragraph(
            "Tabel berikut merangkum definisi variabel penelitian, tipe data, skala pengukuran, dan label nilai yang digunakan dalam dataset aktif.",
            body_style,
        ))

        var_header = [
            Paragraph("No", table_header_style),
            Paragraph("Nama", table_header_style),
            Paragraph("Label Variabel", table_header_style),
            Paragraph("Tipe", table_header_style),
            Paragraph("Skala Ukur", table_header_style),
            Paragraph("Missing", table_header_style),
        ]
        var_rows = [var_header]
        for idx, v in enumerate(ds.get("variables", [])):
            missing_str = ", ".join(str(m) for m in v.get("missing", [])) or "None"
            var_rows.append([
                Paragraph(str(idx + 1), table_cell_style),
                Paragraph(v.get("name", ""), table_cell_style),
                Paragraph(v.get("label", "") or "-", table_cell_style),
                Paragraph(v.get("type", "numeric"), table_cell_style),
                Paragraph(v.get("measure", "scale"), table_cell_style),
                Paragraph(missing_str, table_cell_style),
            ])

        var_tbl = Table(var_rows, colWidths=[1.2 * cm, 3.5 * cm, 5.8 * cm, 2.2 * cm, 2.3 * cm, 2.0 * cm])
        # Gaya Tabel Standar APA 7: Garis horizontal atas, batas bawah header, dan garis bawah tabel
        var_tbl.setStyle(TableStyle([
            ("LINEABOVE", (0, 0), (-1, 0), 1.2, colors.HexColor("#0F172A")),
            ("LINEBELOW", (0, 0), (-1, 0), 0.8, colors.HexColor("#0F172A")),
            ("LINEBELOW", (0, -1), (-1, -1), 1.2, colors.HexColor("#0F172A")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(var_tbl)
        story.append(Spacer(1, 0.8 * cm))

    # 3. RIWAYAT TRANSFORMASI DATA
    if "riwayat_transformasi" in sel_sections and histories:
        story.append(Paragraph("2. Riwayat Transformasi Data (Audit Trail)", h1_style))
        story.append(Paragraph(
            "Rekaman audit seluruh operasi manipulasi dan komputasi variabel yang dilakukan pada dataset ini:",
            body_style,
        ))

        hist_header = [
            Paragraph("Waktu (UTC)", table_header_style),
            Paragraph("Operasi", table_header_style),
            Paragraph("Keterangan", table_header_style),
            Paragraph("Baris Terdampak", table_header_style),
        ]
        hist_rows = [hist_header]
        for h in histories[:15]:
            ts_clean = h.get("timestamp", "").replace("T", " ")[:19]
            hist_rows.append([
                Paragraph(ts_clean, table_cell_style),
                Paragraph(h.get("operation_type", "-"), table_cell_style),
                Paragraph(h.get("description", "-"), table_cell_style),
                Paragraph(str(h.get("affected_rows", "-")), table_cell_style),
            ])

        hist_tbl = Table(hist_rows, colWidths=[3.5 * cm, 3.5 * cm, 7.5 * cm, 2.5 * cm])
        hist_tbl.setStyle(TableStyle([
            ("LINEABOVE", (0, 0), (-1, 0), 1.2, colors.HexColor("#0F172A")),
            ("LINEBELOW", (0, 0), (-1, 0), 0.8, colors.HexColor("#0F172A")),
            ("LINEBELOW", (0, -1), (-1, -1), 1.2, colors.HexColor("#0F172A")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        story.append(hist_tbl)
        story.append(Spacer(1, 0.8 * cm))

    # 4. HASIL ANALISIS STATISTIK (Berdasarkan Bagian Terpilih)
    section_mapping = [
        ("deskriptif", "descriptive", "Statistik Deskriptif"),
        ("reliabilitas", "reliability", "Uji Reliabilitas Instrumen"),
        ("validitas", "validity", "Uji Validitas Item"),
        ("korelasi", "correlation", "Analisis Korelasi"),
        ("regresi", "regression", "Analisis Regresi Linier"),
        ("diagnostik", "diagnostics", "Uji Asumsi Klasik"),
    ]

    sec_counter = 3
    for sec_key, anal_type, sec_title in section_mapping:
        if sec_key not in sel_sections:
            continue

        outputs_list = analysis_map.get(anal_type, [])
        if not outputs_list:
            continue

        story.append(Paragraph(f"{sec_counter}. {sec_title}", h1_style))
        sec_counter += 1

        for out in outputs_list:
            story.append(Paragraph(f"Tabel: {out.title}", h2_style))
            
            # Peringatan jika dataset telah berubah sejak analisis dijalankan
            if out.dataset_updated_at and ds.get("updated_at") and out.dataset_updated_at != ds.get("updated_at"):
                story.append(Paragraph(
                    "<i>Perhatian: Dataset telah diperbarui sejak analisis ini dijalankan. Angka di bawah merupakan hasil sebelum pembaruan terkini.</i>",
                    ParagraphStyle("Warn", parent=body_style, textColor=colors.HexColor("#D97706"), fontName="Helvetica-Oblique")
                ))

            res = out.results
            # Render tabel dari hasil statistik
            # Cek apakah ada 'tables' atau struktur kamus langsung
            if isinstance(res, dict):
                # Cetak ringkasan atau tabel
                tables_to_draw = []
                if "tables" in res and isinstance(res["tables"], list):
                    tables_to_draw = res["tables"]
                elif "statistics" in res and isinstance(res["statistics"], list):
                    # Deskriptif format
                    tables_to_draw = [{"title": "Ringkasan Statistik", "rows": res["statistics"]}]

                if tables_to_draw:
                    for t in tables_to_draw:
                        t_rows_raw = t.get("rows", [])
                        if not t_rows_raw:
                            continue
                        # Kolom
                        cols = list(t_rows_raw[0].keys())
                        th_row = [Paragraph(str(c), table_header_style) for c in cols]
                        td_rows = [th_row]
                        for r_item in t_rows_raw:
                            row_cells = []
                            for c in cols:
                                val = r_item.get(c)
                                val_str = f"{val:.4f}" if isinstance(val, float) else str(val if val is not None else "-")
                                row_cells.append(Paragraph(val_str, table_cell_style))
                            td_rows.append(row_cells)

                        col_w = (17.0 * cm) / max(1, len(cols))
                        t_flow = Table(td_rows, colWidths=[col_w] * len(cols))
                        t_flow.setStyle(TableStyle([
                            ("LINEABOVE", (0, 0), (-1, 0), 1.2, colors.HexColor("#0F172A")),
                            ("LINEBELOW", (0, 0), (-1, 0), 0.8, colors.HexColor("#0F172A")),
                            ("LINEBELOW", (0, -1), (-1, -1), 1.2, colors.HexColor("#0F172A")),
                            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                            ("TOPPADDING", (0, 0), (-1, -1), 3),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                        ]))
                        story.append(t_flow)
                        story.append(Spacer(1, 0.4 * cm))
                else:
                    # Generic summary key-value table
                    kv_rows = []
                    for k, v in list(res.items())[:12]:
                        if isinstance(v, (int, float, str, bool)):
                            kv_rows.append([Paragraph(str(k), table_header_style), Paragraph(str(v), table_cell_style)])
                    if kv_rows:
                        kv_tbl = Table(kv_rows, colWidths=[6.0 * cm, 11.0 * cm])
                        kv_tbl.setStyle(TableStyle([
                            ("LINEABOVE", (0, 0), (-1, 0), 1.0, colors.HexColor("#0F172A")),
                            ("LINEBELOW", (0, -1), (-1, -1), 1.0, colors.HexColor("#0F172A")),
                            ("TOPPADDING", (0, 0), (-1, -1), 2),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
                        ]))
                        story.append(kv_tbl)

            # Interpretasi
            if out.interpretation:
                story.append(Spacer(1, 0.3 * cm))
                story.append(Paragraph(f"<b>Interpretasi:</b> {_clean_text(out.interpretation)}", body_style))

            story.append(Spacer(1, 0.6 * cm))

    # Build document dengan NumberedCanvas untuk penomoran otomatis
    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer
