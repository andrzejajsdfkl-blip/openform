import sys
import os
import json
from pathlib import Path

try:
    from reportlab.lib.pagesizes import letter
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
except ImportError:
    print("\033[91mError: reportlab is not installed.\033[0m")
    print("Please install it using: \033[96mpip install reportlab\033[0m")
    sys.exit(1)

def export_to_pdf(off_path, pdf_path=None):
    if not os.path.exists(off_path):
        print(f"Error: File '{off_path}' not found.")
        return False

    if not pdf_path:
        # Change .off extension to .pdf instead of appending it
        pdf_path = str(Path(off_path).with_suffix(".pdf"))

    try:
        with open(off_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON: {str(e)}")
        return False

    # Create PDF document
    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Palette (matching OpenForm sleek dark theme elements but for light-colored print)
    primary_color = colors.HexColor("#3b82f6") # Bright blue
    secondary_color = colors.HexColor("#1d4ed8")
    neutral_dark = colors.HexColor("#1f2937")
    neutral_light = colors.HexColor("#f3f4f6")
    border_color = colors.HexColor("#d1d5db")

    # Define paragraph styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=22,
        textColor=primary_color,
        spaceAfter=15
    )

    section_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        textColor=secondary_color,
        spaceBefore=12,
        spaceAfter=8
    )

    label_style = ParagraphStyle(
        'FieldLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        textColor=colors.HexColor("#4b5563")
    )

    val_style = ParagraphStyle(
        'FieldValue',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=neutral_dark
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        textColor=neutral_dark
    )

    story = []

    # Title Banner
    doc_title = data.get("document_type", {}).get("label", "OpenForm Document").upper()
    story.append(Paragraph(doc_title, title_style))
    story.append(Paragraph(f"<b>Document ID:</b> {data.get('document_id', 'N/A')}", val_style))
    story.append(Paragraph(f"<b>Created:</b> {data.get('created_at', 'N/A')[:19].replace('T', ' ')}", val_style))
    story.append(Spacer(1, 15))

    # Fields grid
    story.append(Paragraph("Fields & Metadata", section_style))
    
    fields = [f for f in data.get("fields", []) if f.get("enabled", True)]
    fields = sorted(fields, key=lambda x: x.get("order", 0))

    grid_data = []
    current_row = []
    
    for field in fields:
        label = field.get("label", "").upper()
        val = field.get("value")
        
        # Format bool values
        if field.get("type") == "bool":
            val_str = "YES" if val else "NO"
        else:
            val_str = str(val) if val is not None else "—"

        cell_content = [
            Paragraph(label, label_style),
            Spacer(1, 2),
            Paragraph(val_str, val_style),
            Spacer(1, 8)
        ]
        
        current_row.append(cell_content)
        if len(current_row) == 2:
            grid_data.append(current_row)
            current_row = []
            
    if current_row:
        current_row.append("") # Pad last row if odd number of fields
        grid_data.append(current_row)

    if grid_data:
        t = Table(grid_data, colWidths=[270, 270])
        t.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(t)

    story.append(Spacer(1, 15))

    # Tables
    tables = [t for t in data.get("tables", []) if t.get("enabled", True)]
    for table in tables:
        story.append(Paragraph(table.get("label", "Table"), section_style))
        
        cols = sorted([c for c in table.get("columns", []) if c.get("enabled", True)], key=lambda x: x.get("order", 0))
        
        # Build headers
        header_row = [Paragraph(col.get("label", "").upper(), table_header_style) for col in cols]
        
        table_rows = [header_row]
        
        # Build cell values
        rows_data = table.get("rows", []) or []
        for r_idx, row_data in enumerate(rows_data):
            row_cells = []
            for col in cols:
                val = row_data.get(col["key"])
                if col.get("type") == "bool":
                    val_str = "Yes" if val else "No"
                else:
                    val_str = str(val) if val is not None else "—"
                row_cells.append(Paragraph(val_str, table_cell_style))
            table_rows.append(row_cells)

        if len(table_rows) > 1:
            col_width = 540 / len(cols) if cols else 540
            t_layout = Table(table_rows, colWidths=[col_width] * len(cols))
            
            # Simple, clean table styling
            t_style = [
                ('BACKGROUND', (0,0), (-1,0), primary_color),
                ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('GRID', (0,0), (-1,-1), 0.5, border_color),
            ]
            
            # Alternating row colors
            for idx in range(1, len(table_rows)):
                if idx % 2 == 0:
                    t_style.append(('BACKGROUND', (0, idx), (-1, idx), neutral_light))
                    
            t_layout.setStyle(TableStyle(t_style))
            story.append(t_layout)
        else:
            story.append(Paragraph("<i>No entries in this table.</i>", val_style))
            
        story.append(Spacer(1, 15))

    # Footer/Signature block
    story.append(Spacer(1, 20))
    sig_data = [
        [Paragraph("<b>Prepared By:</b> ____________________", val_style), Paragraph("<b>Signature:</b> ____________________", val_style)]
    ]
    sig_table = Table(sig_data, colWidths=[270, 270])
    sig_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(sig_table)

    try:
        doc.build(story)
        print(f"\033[92m[OK] PDF successfully exported to: {pdf_path}\033[0m")
        return True
    except Exception as e:
        print(f"Error compiling PDF: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python export-pdf.py <path-to-file.off> [output-path.pdf]")
        sys.exit(1)
        
    out_pdf = sys.argv[2] if len(sys.argv) > 2 else None
    success = export_to_pdf(sys.argv[1], out_pdf)
    sys.exit(0 if success else 1)
