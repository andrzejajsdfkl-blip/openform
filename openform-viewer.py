import sys
import os
import json
import tkinter as tk
import base64
import subprocess
from tkinter import ttk, messagebox, filedialog
from pathlib import Path

# ============================================================================
# VALIDATION UTILITIES (from validate.py)
# ============================================================================

VALID_FIELD_TYPES = {"text", "date", "int", "decimal", "currency", "bool", "select"}

def validate_structure(data):
    """Validate the OpenForm JSON structure and return list of error messages."""
    errors = []
    
    required_keys = ["format", "format_version", "document_id", "document_type", "fields", "tables"]
    for key in required_keys:
        if key not in data:
            errors.append(f"Missing root key: '{key}'")
    
    if errors:
        return errors
    
    if data.get("format") != "OpenFormFile":
        errors.append(f"Invalid format value: '{data.get('format')}' (expected 'OpenFormFile')")
    
    doc_type = data.get("document_type")
    if not isinstance(doc_type, dict) or "id" not in doc_type or "label" not in doc_type:
        errors.append("Invalid 'document_type': must be an object with 'id' and 'label'")
    
    fields = data.get("fields")
    if not isinstance(fields, list):
        errors.append("'fields' must be a list")
    else:
        seen_keys = set()
        for idx, field in enumerate(fields):
            if not isinstance(field, dict):
                errors.append(f"Field at index {idx} is not an object")
                continue
            key = field.get("key")
            if not key:
                errors.append(f"Field at index {idx} is missing 'key'")
                continue
            if key in seen_keys:
                errors.append(f"Duplicate field key: '{key}'")
            seen_keys.add(key)
            
            if "type" not in field:
                errors.append(f"Field '{key}' is missing 'type'")
            elif field["type"] not in VALID_FIELD_TYPES:
                errors.append(f"Field '{key}' has invalid type: '{field['type']}'")
            
            if "label" not in field:
                errors.append(f"Field '{key}' is missing 'label'")
    
    tables = data.get("tables")
    if not isinstance(tables, list):
        errors.append("'tables' must be a list")
    else:
        seen_tables = set()
        for t_idx, table in enumerate(tables):
            if not isinstance(table, dict):
                errors.append(f"Table at index {t_idx} is not an object")
                continue
            tkey = table.get("key")
            if not tkey:
                errors.append(f"Table at index {t_idx} is missing 'key'")
                continue
            if tkey in seen_tables:
                errors.append(f"Duplicate table key: '{tkey}'")
            seen_tables.add(tkey)
            
            cols = table.get("columns")
            if not isinstance(cols, list):
                errors.append(f"Table '{tkey}' missing 'columns' list")
                continue
            seen_cols = set()
            for c_idx, col in enumerate(cols):
                if not isinstance(col, dict):
                    errors.append(f"Column at index {c_idx} in table '{tkey}' is not an object")
                    continue
                ckey = col.get("key")
                if not ckey:
                    errors.append(f"A column in table '{tkey}' is missing 'key'")
                    continue
                if ckey in seen_cols:
                    errors.append(f"Duplicate column key '{ckey}' in table '{tkey}'")
                seen_cols.add(ckey)
    
    return errors

# ============================================================================
# PDF EXPORT UTILITIES (from export-pdf.py)
# ============================================================================

def export_to_pdf_internal(off_path, pdf_path=None):
    """Export OpenForm document to PDF (internal implementation)."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib import colors
    except ImportError:
        return False, "reportlab is not installed. Please install: pip install reportlab"
    
    if not os.path.exists(off_path):
        return False, f"File '{off_path}' not found."
    
    if not pdf_path:
        pdf_path = str(Path(off_path).with_suffix(".pdf"))
    
    try:
        with open(off_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        return False, f"Error loading JSON: {str(e)}"
    
    try:
        doc = SimpleDocTemplate(
            pdf_path,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = getSampleStyleSheet()
        primary_color = colors.HexColor("#3b82f6")
        secondary_color = colors.HexColor("#1d4ed8")
        neutral_dark = colors.HexColor("#1f2937")
        neutral_light = colors.HexColor("#f3f4f6")
        border_color = colors.HexColor("#d1d5db")
        
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
        
        doc_title = data.get("document_type", {}).get("label", "OpenForm Document").upper()
        story.append(Paragraph(doc_title, title_style))
        story.append(Paragraph(f"<b>Document ID:</b> {data.get('document_id', 'N/A')}", val_style))
        story.append(Paragraph(f"<b>Created:</b> {data.get('created_at', 'N/A')[:19].replace('T', ' ')}", val_style))
        story.append(Spacer(1, 15))
        
        story.append(Paragraph("Fields & Metadata", section_style))
        fields = [f for f in data.get("fields", []) if f.get("enabled", True)]
        fields = sorted(fields, key=lambda x: x.get("order", 0))
        
        grid_data = []
        current_row = []
        
        for field in fields:
            label = field.get("label", "").upper()
            val = field.get("value")
            
            if field.get("type") == "bool":
                val_str = "YES" if val else "NO"
            elif field.get("type") == "currency":
                val_str = f"${val:.2f}" if val else "—"
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
            current_row.append("")
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
        
        tables = [t for t in data.get("tables", []) if t.get("enabled", True)]
        for table in tables:
            story.append(Paragraph(table.get("label", "Table"), section_style))
            
            cols = sorted([c for c in table.get("columns", []) if c.get("enabled", True)], key=lambda x: x.get("order", 0))
            header_row = [Paragraph(col.get("label", "").upper(), table_header_style) for col in cols]
            table_rows = [header_row]
            
            rows_data = table.get("rows", []) or []
            for row_data in rows_data:
                row_cells = []
                for col in cols:
                    val = row_data.get(col["key"])
                    if col.get("type") == "bool":
                        val_str = "Yes" if val else "No"
                    elif col.get("type") == "currency":
                        val_str = f"${val:.2f}" if val else "—"
                    else:
                        val_str = str(val) if val is not None else "—"
                    row_cells.append(Paragraph(val_str, table_cell_style))
                table_rows.append(row_cells)
            
            if len(table_rows) > 1:
                col_width = 540 / len(cols) if cols else 540
                t_layout = Table(table_rows, colWidths=[col_width] * len(cols))
                
                t_style = [
                    ('BACKGROUND', (0,0), (-1,0), primary_color),
                    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                    ('TOPPADDING', (0,0), (-1,-1), 6),
                    ('GRID', (0,0), (-1,-1), 0.5, border_color),
                ]
                
                for idx in range(1, len(table_rows)):
                    if idx % 2 == 0:
                        t_style.append(('BACKGROUND', (0, idx), (-1, idx), neutral_light))
                
                t_layout.setStyle(TableStyle(t_style))
                story.append(t_layout)
            else:
                story.append(Paragraph("<i>No entries in this table.</i>", val_style))
            
            story.append(Spacer(1, 15))
        
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
        
        doc.build(story)
        return True, f"PDF successfully exported to: {pdf_path}"
    
    except Exception as e:
        return False, f"Error compiling PDF: {str(e)}"

# ============================================================================
# MAIN VIEWER APPLICATION
# ============================================================================

def get_asset_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

class OpenFormDesktopViewer:
    def __init__(self, root, file_path=None):
        self.root = root
        self.root.title("OpenForm Desktop Studio")
        self.root.geometry("900x750")
        
        try:
            ico_path = get_asset_path("openform.ico")
            if os.path.exists(ico_path):
                self.root.iconbitmap(ico_path)
        except Exception:
            pass
            
        self.file_path = file_path
        self.doc_data = None
        self.edit_mode = False
        
        # Color scheme (Catppuccin Mocha Dark Theme)
        self.bg_color = "#1e1e2e"
        self.card_bg = "#252538"
        self.fg_color = "#cdd6f4"
        self.accent_color = "#cba6f7"
        self.primary_color = "#89b4fa"
        self.border_color = "#45475a"
        self.success_color = "#a6e3a1"
        self.danger_color = "#f38ba8"
        
        self.root.configure(bg=self.bg_color)
        
        # Styling configuration
        self.style = ttk.Style()
        self.style.theme_use('clam')
        self.style.configure(".", background=self.bg_color, foreground=self.fg_color)
        self.style.configure("TLabel", background=self.bg_color, foreground=self.fg_color, font=("Segoe UI", 10))
        self.style.configure("Header.TLabel", background=self.bg_color, foreground=self.primary_color, font=("Segoe UI", 16, "bold"))
        self.style.configure("Sub.TLabel", background=self.bg_color, foreground=self.accent_color, font=("Segoe UI", 9, "bold"))
        self.style.configure("TNotebook", background=self.bg_color, borderwidth=0)
        self.style.configure("TNotebook.Tab", background=self.card_bg, foreground=self.fg_color, padding=[12, 6], font=("Segoe UI", 10, "bold"))
        self.style.map("TNotebook.Tab", background=[("selected", self.primary_color)], foreground=[("selected", "#11111b")])
        
        self.style.configure("TCombobox", 
                             fieldbackground=self.card_bg, 
                             background=self.border_color, 
                             foreground=self.fg_color,
                             bordercolor=self.border_color,
                             arrowcolor=self.accent_color)
        self.root.option_add("*TCombobox*Listbox.background", self.card_bg)
        self.root.option_add("*TCombobox*Listbox.foreground", self.fg_color)
        self.root.option_add("*TCombobox*Listbox.selectBackground", self.primary_color)
        self.root.option_add("*TCombobox*Listbox.selectForeground", "#11111b")
        self.root.option_add("*TCombobox*Listbox.font", ("Segoe UI", 10))
        
        self.style.layout('Custom.TScrollbar', [
            ('Vertical.Scrollbar.trough', {
                'children': [
                    ('Vertical.Scrollbar.thumb', {'expand': '1', 'sticky': 'nswe'})
                ],
                'sticky': 'ns'
            })
        ])
        self.style.configure('Custom.TScrollbar', 
                             troughcolor=self.bg_color, 
                             background=self.border_color, 
                             borderwidth=0, 
                             arrowsize=0)
        
        self.field_inputs = {}
        self.table_inputs = {}
        
        self.status_bar = tk.Label(self.root, text="Ready", bd=1, relief=tk.SUNKEN, anchor=tk.W, 
                                   bg=self.card_bg, fg=self.fg_color, font=("Segoe UI", 9), padx=10, pady=4)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
        self.main_container = ttk.Frame(self.root, padding=20)
        self.main_container.pack(fill=tk.BOTH, expand=True)
        
        self.menu_bar = tk.Menu(self.root)
        self.file_menu = tk.Menu(self.menu_bar, tearoff=0)
        self.file_menu.add_command(label="Open File...", command=self.load_file_dialog)
        self.file_menu.add_command(label="Save", command=self.save_document)
        self.file_menu.add_separator()
        self.file_menu.add_command(label="Exit", command=root.quit)
        self.menu_bar.add_cascade(label="File", menu=self.file_menu)
        self.root.config(menu=self.menu_bar)
        
        if file_path:
            self.load_file(file_path)
        else:
            self.show_welcome()

    def bind_hover(self, widget, hover_bg, normal_bg):
        widget.bind("<Enter>", lambda e: widget.config(bg=hover_bg))
        widget.bind("<Leave>", lambda e: widget.config(bg=normal_bg))

    def show_welcome(self):
        for w in self.main_container.winfo_children():
            w.destroy()
            
        welcome_frame = ttk.Frame(self.main_container)
        welcome_frame.pack(expand=True)
        
        lbl = ttk.Label(welcome_frame, text="OpenForm Desktop Studio", font=("Segoe UI", 22, "bold"), foreground=self.primary_color)
        lbl.pack(pady=10)
        
        desc = ttk.Label(welcome_frame, text="A standalone utility to view, edit, and manage offline .off documents.", font=("Segoe UI", 11))
        desc.pack(pady=5)
        
        btn = tk.Button(welcome_frame, text="Select .off File", command=self.load_file_dialog, 
                        bg=self.primary_color, fg="#11111b", font=("Segoe UI", 11, "bold"), relief="flat", padx=15, pady=8, cursor="hand2")
        btn.pack(pady=20)
        self.bind_hover(btn, "#b4befe", self.primary_color)

    def load_file_dialog(self):
        path = filedialog.askopenfilename(filetypes=[("OpenForm Files", "*.off"), ("JSON Files", "*.json")])
        if path:
            self.load_file(path)

    def load_file(self, path):
        try:
            with open(path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            if data.get("format") != "OpenFormFile":
                raise ValueError("Not a valid OpenForm Standard file format.")
                
            self.file_path = path
            self.doc_data = data
            self.edit_mode = False
            self.render_document()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load file:\n{str(e)}")
            self.show_welcome()

    def render_document(self):
        for w in self.main_container.winfo_children():
            w.destroy()
            
        doc = self.doc_data
        
        header_frame = ttk.Frame(self.main_container)
        header_frame.pack(fill=tk.X, pady=(0, 15))
        
        doc_type_lbl = ttk.Label(header_frame, text=doc["document_type"]["label"].upper(), style="Sub.TLabel")
        doc_type_lbl.pack(anchor=tk.W)
        
        title_frame = ttk.Frame(header_frame)
        title_frame.pack(fill=tk.X, pady=(2, 5))
        
        title_lbl = ttk.Label(title_frame, text="OpenForm Studio Session", style="Header.TLabel")
        title_lbl.pack(side=tk.LEFT)
        
        btn_frame = ttk.Frame(title_frame)
        btn_frame.pack(side=tk.RIGHT)
        
        self.btn_edit = tk.Button(btn_frame, text="Edit Mode" if not self.edit_mode else "View Mode", 
                                  command=self.toggle_edit_mode, bg=self.accent_color, fg="#11111b", 
                                  font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=4, cursor="hand2")
        self.btn_edit.pack(side=tk.LEFT, padx=5)
        self.bind_hover(self.btn_edit, "#f5c2e7", self.accent_color)
        
        btn_validate = tk.Button(btn_frame, text="Validate", 
                                  command=self.validate_current_document, bg=self.primary_color, fg="#11111b", 
                                  font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=4, cursor="hand2")
        btn_validate.pack(side=tk.LEFT, padx=5)
        self.bind_hover(btn_validate, "#b4befe", self.primary_color)
        
        btn_pdf = tk.Button(btn_frame, text="Export PDF", 
                             command=self.export_to_pdf_action, bg=self.success_color, fg="#11111b", 
                             font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=4, cursor="hand2")
        btn_pdf.pack(side=tk.LEFT, padx=5)
        self.bind_hover(btn_pdf, "#a6e3a1", self.success_color)
        
        if self.edit_mode:
            self.btn_save = tk.Button(btn_frame, text="Save Changes", command=self.save_document, 
                                      bg=self.success_color, fg="#11111b", font=("Segoe UI", 9, "bold"), 
                                      relief="flat", padx=10, pady=4, cursor="hand2")
            self.btn_save.pack(side=tk.LEFT, padx=5)
            self.bind_hover(self.btn_save, "#a6e3a1", self.success_color)
            
        meta_lbl = ttk.Label(header_frame, text=f"File: {os.path.basename(self.file_path)}  |  Created: {doc['created_at'][:10]}", font=("Consolas", 9), foreground="#a6adc8")
        meta_lbl.pack(anchor=tk.W)
        
        self.notebook = ttk.Notebook(self.main_container)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        self.render_fields_tab()
        self.render_tables_tabs()
        self.render_attachment_tab()

    def render_fields_tab(self):
        fields_scroll = tk.Canvas(self.notebook, bg=self.bg_color, highlightthickness=0)
        fields_frame = ttk.Frame(fields_scroll, padding=10)
        scrollbar = ttk.Scrollbar(self.notebook, orient="vertical", command=fields_scroll.yview, style="Custom.TScrollbar")
        fields_scroll.configure(yscrollcommand=scrollbar.set)
        
        fields_scroll.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        fields_scroll.create_window((0, 0), window=fields_frame, anchor="nw")
        
        def on_configure(event):
            fields_scroll.configure(scrollregion=fields_scroll.bbox("all"))
        fields_frame.bind("<Configure>", on_configure)
        
        def _on_mousewheel(event):
            fields_scroll.yview_scroll(int(-1 * (event.delta / 120)), "units")
        fields_scroll.bind("<Enter>", lambda e: fields_scroll.bind_all("<MouseWheel>", _on_mousewheel))
        fields_scroll.bind("<Leave>", lambda e: fields_scroll.unbind_all("<MouseWheel>"))
        
        self.notebook.add(fields_scroll, text="Fields & Metadata")
        
        self.field_inputs = {}
        fields = sorted([f for f in self.doc_data["fields"] if f.get("enabled", True)], key=lambda x: x.get("order", 0))
        
        for i, field in enumerate(fields):
            row = i // 2
            col = (i % 2) * 2
            
            card = tk.Frame(fields_frame, bg=self.card_bg, highlightbackground=self.border_color, highlightthickness=1, bd=0)
            card.grid(row=row, column=col//2, padx=10, pady=10, sticky="nsew")
            fields_frame.grid_columnconfigure(col//2, weight=1)
            
            lbl_frame = tk.Frame(card, bg=self.card_bg)
            lbl_frame.pack(fill=tk.X, padx=12, pady=(10, 2))
            
            lbl_key = tk.Label(lbl_frame, text=field["label"].upper(), font=("Segoe UI", 9, "bold"), fg=self.accent_color, bg=self.card_bg)
            lbl_key.pack(side=tk.LEFT)
            
            if field.get("required"):
                tk.Label(lbl_frame, text="*", font=("Segoe UI", 9, "bold"), fg=self.danger_color, bg=self.card_bg).pack(side=tk.LEFT, padx=2)
            
            val = field.get("value")
            val_frame = tk.Frame(card, bg=self.card_bg)
            val_frame.pack(fill=tk.X, padx=12, pady=(2, 10))
            
            if self.edit_mode:
                if field.get("type") == "bool":
                    var = tk.BooleanVar(value=bool(val))
                    chk = tk.Checkbutton(val_frame, text=field.get("placeholder", "Active"), variable=var,
                                         bg=self.card_bg, fg=self.fg_color, selectcolor=self.bg_color,
                                         activebackground=self.card_bg, activeforeground=self.fg_color,
                                         font=("Segoe UI", 10))
                    chk.pack(side=tk.LEFT)
                    self.field_inputs[field["key"]] = var
                elif field.get("type") == "select":
                    options = field.get("options", [])
                    var = tk.StringVar(value=str(val) if val is not None else "")
                    cb = ttk.Combobox(val_frame, textvariable=var, values=options, state="readonly", font=("Segoe UI", 10))
                    cb.pack(side=tk.LEFT, fill=tk.X, expand=True)
                    self.field_inputs[field["key"]] = var
                elif field.get("type") == "currency":
                    var = tk.StringVar(value=str(val) if val is not None else "")
                    prefix_frame = tk.Frame(val_frame, bg=self.card_bg)
                    prefix_frame.pack(side=tk.LEFT, fill=tk.X, expand=True)
                    tk.Label(prefix_frame, text="$", font=("Segoe UI", 11, "bold"), fg=self.fg_color, bg=self.card_bg).pack(side=tk.LEFT, padx=(0, 4))
                    ent = tk.Entry(prefix_frame, textvariable=var, bg=self.bg_color, fg=self.fg_color,
                                   insertbackground=self.fg_color, relief="flat", font=("Segoe UI", 11),
                                   highlightbackground=self.border_color, highlightcolor=self.primary_color, highlightthickness=1)
                    ent.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=6, ipadx=4)
                    self.field_inputs[field["key"]] = var
                else:
                    var = tk.StringVar(value=str(val) if val is not None else "")
                    ent = tk.Entry(val_frame, textvariable=var, bg=self.bg_color, fg=self.fg_color,
                                   insertbackground=self.fg_color, relief="flat", font=("Segoe UI", 11),
                                   highlightbackground=self.border_color, highlightcolor=self.primary_color, highlightthickness=1)
                    ent.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=6, ipadx=4)
                    self.field_inputs[field["key"]] = var
            else:
                if field.get("type") == "bool":
                    val_str = "YES" if val else "NO"
                elif field.get("type") == "currency":
                    val_str = f"${val:.2f}" if val else "—"
                else:
                    val_str = str(val) if val is not None else "—"
                lbl_val = tk.Label(val_frame, text=val_str, font=("Segoe UI", 12, "bold"), fg=self.fg_color, bg=self.card_bg, wraplength=300, justify=tk.LEFT)
                lbl_val.pack(side=tk.LEFT, fill=tk.X, expand=True)
                
                def make_copy_fn(text_to_copy):
                    return lambda: self.copy_to_clipboard(text_to_copy)
                    
                copy_btn = tk.Button(val_frame, text="Copy", command=make_copy_fn(val_str), 
                                     bg=self.border_color, fg=self.fg_color, font=("Segoe UI", 8),
                                     relief="flat", cursor="hand2", padx=8, pady=3)
                copy_btn.pack(side=tk.RIGHT, padx=5)
                self.bind_hover(copy_btn, "#585b70", self.border_color)

    def render_tables_tabs(self):
        self.table_inputs = {}
        tables = [t for t in self.doc_data.get("tables", []) if t.get("enabled", True)]
        
        for table in tables:
            tab = ttk.Frame(self.notebook, padding=10)
            self.notebook.add(tab, text=table["label"])
            
            if self.edit_mode:
                ctrl_frame = ttk.Frame(tab)
                ctrl_frame.pack(fill=tk.X, pady=(0, 10))
                
                btn_add = tk.Button(ctrl_frame, text="+ Add Row", command=lambda tk=table["key"]: self.add_table_row(tk),
                                    bg=self.primary_color, fg="#11111b", font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=4, cursor="hand2")
                btn_add.pack(side=tk.LEFT)
                self.bind_hover(btn_add, "#b4befe", self.primary_color)
            
            scroll_canvas = tk.Canvas(tab, bg=self.bg_color, highlightthickness=0)
            t_frame = ttk.Frame(scroll_canvas, padding=5)
            t_scroll = ttk.Scrollbar(tab, orient="vertical", command=scroll_canvas.yview, style="Custom.TScrollbar")
            scroll_canvas.configure(yscrollcommand=t_scroll.set)
            
            scroll_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
            t_scroll.pack(side=tk.RIGHT, fill=tk.Y)
            scroll_canvas.create_window((0, 0), window=t_frame, anchor="nw")
            
            def make_table_config(canvas):
                return lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
            t_frame.bind("<Configure>", make_table_config(scroll_canvas))
            
            def _make_mw_handler(canvas):
                return lambda event: canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
            mw_handler = _make_mw_handler(scroll_canvas)
            scroll_canvas.bind("<Enter>", lambda e, h=mw_handler: scroll_canvas.bind_all("<MouseWheel>", h))
            scroll_canvas.bind("<Leave>", lambda e: scroll_canvas.unbind_all("<MouseWheel>"))
            
            cols = sorted([c for c in table["columns"] if c.get("enabled", True)], key=lambda x: x.get("order", 0))
            
            for col_idx, col in enumerate(cols):
                lbl_h = tk.Label(t_frame, text=col["label"].upper(), font=("Segoe UI", 9, "bold"), fg=self.accent_color, bg=self.bg_color, pady=5)
                lbl_h.grid(row=0, column=col_idx, padx=5, pady=5, sticky="ew")
                
            if self.edit_mode:
                lbl_h = tk.Label(t_frame, text="", bg=self.bg_color)
                lbl_h.grid(row=0, column=len(cols), padx=5, pady=5, sticky="ew")
                
            self.table_inputs[table["key"]] = []
            
            rows = table.get("rows", [])
            for row_idx, r in enumerate(rows):
                self.render_row_fields(t_frame, table["key"], row_idx, r, cols)

    def render_row_fields(self, container, table_key, row_idx, row_data, cols):
        row_widgets = {}
        row_grid_idx = row_idx + 1
        
        for col_idx, col in enumerate(cols):
            val = row_data.get(col["key"])
            cell_frame = tk.Frame(container, bg=self.bg_color)
            cell_frame.grid(row=row_grid_idx, column=col_idx, padx=3, pady=3, sticky="nsew")
            
            if self.edit_mode:
                if col.get("type") == "bool":
                    var = tk.BooleanVar(value=bool(val))
                    chk = tk.Checkbutton(cell_frame, variable=var, bg=self.bg_color, selectcolor=self.bg_color,
                                         activebackground=self.bg_color)
                    chk.pack(anchor=tk.CENTER)
                    row_widgets[col["key"]] = var
                elif col.get("type") == "currency":
                    var = tk.StringVar(value=str(val) if val is not None else "")
                    prefix_lbl = tk.Label(cell_frame, text="$", font=("Segoe UI", 9, "bold"), fg=self.fg_color, bg=self.bg_color)
                    prefix_lbl.pack(side=tk.LEFT, padx=(0, 2))
                    ent = tk.Entry(cell_frame, textvariable=var, bg=self.card_bg, fg=self.fg_color,
                                   insertbackground=self.fg_color, relief="flat", font=("Segoe UI", 10),
                                   highlightbackground=self.border_color, highlightcolor=self.primary_color, highlightthickness=1, width=15)
                    ent.pack(side=tk.LEFT, fill=tk.X, expand=True, ipady=4, ipadx=3)
                    row_widgets[col["key"]] = var
                else:
                    var = tk.StringVar(value=str(val) if val is not None else "")
                    ent = tk.Entry(cell_frame, textvariable=var, bg=self.card_bg, fg=self.fg_color,
                                   insertbackground=self.fg_color, relief="flat", font=("Segoe UI", 10),
                                   highlightbackground=self.border_color, highlightcolor=self.primary_color, highlightthickness=1, width=15)
                    ent.pack(fill=tk.X, ipady=4, ipadx=3)
                    row_widgets[col["key"]] = var
            else:
                if col.get("type") == "bool":
                    val_str = "Yes" if val else "No"
                elif col.get("type") == "currency":
                    val_str = f"${val:.2f}" if val else "—"
                else:
                    val_str = str(val) if val is not None else "—"
                lbl = tk.Label(cell_frame, text=val_str, font=("Segoe UI", 10), fg=self.fg_color, bg=self.bg_color, anchor=tk.W)
                lbl.pack(fill=tk.X, padx=5, pady=2)
                row_widgets[col["key"]] = val
                
        if self.edit_mode:
            del_frame = tk.Frame(container, bg=self.bg_color)
            del_frame.grid(row=row_grid_idx, column=len(cols), padx=3, pady=3, sticky="nsew")
            btn_del = tk.Button(del_frame, text="Delete", command=lambda tk=table_key, ri=row_idx: self.remove_table_row(tk, ri),
                                bg=self.danger_color, fg="#11111b", font=("Segoe UI", 8, "bold"), relief="flat", cursor="hand2", padx=8, pady=3)
            btn_del.pack(anchor=tk.CENTER)
            self.bind_hover(btn_del, "#f38ba8", self.danger_color)
            
        self.table_inputs[table_key].append(row_widgets)

    def add_table_row(self, table_key):
        self.collect_inputs_in_memory()
        table = next(t for t in self.doc_data["tables"] if t["key"] == table_key)
        new_row = {}
        for col in table["columns"]:
            new_row[col["key"]] = col.get("default_value", False if col.get("type") == "bool" else "")
            
        if "rows" not in table or table["rows"] is None:
            table["rows"] = []
        table["rows"].append(new_row)
        self.render_document()

    def remove_table_row(self, table_key, row_index):
        self.collect_inputs_in_memory()
        table = next(t for t in self.doc_data["tables"] if t["key"] == table_key)
        if 0 <= row_index < len(table["rows"]):
            table["rows"].pop(row_index)
            self.render_document()

    def render_attachment_tab(self):
        att = self.doc_data.get("attachment")
        if not att or not att.get("included"):
            return
            
        att_frame = ttk.Frame(self.notebook, padding=20)
        self.notebook.add(att_frame, text="Attachment")
        
        card = tk.Frame(att_frame, bg=self.card_bg, highlightbackground=self.border_color, highlightthickness=1, bd=0)
        card.pack(fill=tk.X, pady=10)
        
        tk.Label(card, text="ATTACHED FILE DATA", font=("Segoe UI", 9, "bold"), fg=self.accent_color, bg=self.card_bg).pack(anchor=tk.W, padx=15, pady=(15, 5))
        tk.Label(card, text=att.get("file_name"), font=("Segoe UI", 14, "bold"), fg=self.primary_color, bg=self.card_bg).pack(anchor=tk.W, padx=15, pady=2)
        tk.Label(card, text=f"Mime-Type: {att.get('mime_type')}   |   Size: {att.get('size') / 1024:.1f} KB", font=("Segoe UI", 10), fg="#a6adc8", bg=self.card_bg).pack(anchor=tk.W, padx=15, pady=2)
        
        btn_save = tk.Button(card, text="Save Attachment to Disk", command=self.save_attachment_payload,
                            bg=self.primary_color, fg="#11111b", font=("Segoe UI", 10, "bold"), relief="flat", padx=12, pady=6, cursor="hand2")
        btn_save.pack(anchor=tk.W, padx=15, pady=20)
        self.bind_hover(btn_save, "#b4befe", self.primary_color)

    def save_attachment_payload(self):
        att = self.doc_data.get("attachment")
        save_path = filedialog.asksaveasfilename(initialfile=att.get("file_name"))
        if save_path:
            try:
                b64_data = att.get("base64")
                if "," in b64_data:
                    b64_data = b64_data.split(",")[1]
                with open(save_path, "wb") as out_f:
                    out_f.write(base64.b64decode(b64_data))
                messagebox.showinfo("Success", "Attachment exported successfully!")
            except Exception as err:
                messagebox.showerror("Error", f"Failed to save attachment:\n{str(err)}")

    def toggle_edit_mode(self):
        if self.edit_mode:
            self.edit_mode = False
            self.render_document()
        else:
            self.edit_mode = True
            self.render_document()

    def collect_inputs_in_memory(self):
        if not self.edit_mode or not self.doc_data:
            return
            
        for field in self.doc_data["fields"]:
            if field.get("enabled", True) and field["key"] in self.field_inputs:
                input_val = self.field_inputs[field["key"]].get()
                
                if field.get("type") == "int":
                    if str(input_val).strip() == "":
                        field["value"] = None
                    else:
                        try: field["value"] = int(input_val)
                        except ValueError: field["value"] = input_val
                elif field.get("type") == "decimal" or field.get("type") == "currency":
                    if str(input_val).strip() == "":
                        field["value"] = None
                    else:
                        try: field["value"] = float(input_val)
                        except ValueError: field["value"] = input_val
                elif field.get("type") == "bool":
                    field["value"] = bool(input_val)
                else:
                    field["value"] = input_val
                
        for table in self.doc_data.get("tables", []):
            if table.get("enabled", True) and table["key"] in self.table_inputs:
                table_rows = []
                ui_rows = self.table_inputs[table["key"]]
                for row_vars in ui_rows:
                    row_data = {}
                    for col in table["columns"]:
                        val_widget = row_vars.get(col["key"])
                        val = val_widget.get() if hasattr(val_widget, 'get') else val_widget
                        
                        if col.get("type") == "int":
                            if str(val).strip() == "":
                                val = None
                            else:
                                try: val = int(val)
                                except ValueError: pass
                        elif col.get("type") == "decimal" or col.get("type") == "currency":
                            if str(val).strip() == "":
                                val = None
                            else:
                                try: val = float(val)
                                except ValueError: pass
                        elif col.get("type") == "bool":
                            val = bool(val)
                            
                        row_data[col["key"]] = val
                    table_rows.append(row_data)
                table["rows"] = table_rows

    def save_document(self):
        if not self.edit_mode:
            return
            
        self.collect_inputs_in_memory()
                
        try:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(self.doc_data, f, indent=2, ensure_ascii=False)
            self.status_bar.config(text="Record changes committed and written to disk successfully!")
            self.edit_mode = False
            self.render_document()
            self.root.after(3000, lambda: self.status_bar.config(text="Ready"))
        except Exception as err:
            messagebox.showerror("Save Error", f"Failed to commit changes back to disk:\n{str(err)}")

    def copy_to_clipboard(self, text):
        self.root.clipboard_clear()
        self.root.clipboard_append(text)
        self.status_bar.config(text=f"Copied to clipboard: {text[:40]}...")
        self.root.after(3000, lambda: self.status_bar.config(text="Ready"))

    def validate_current_document(self):
        if not self.doc_data:
            self.status_bar.config(text="No document loaded to validate.")
            return
            
        if self.edit_mode:
            self.collect_inputs_in_memory()
            
        errors = validate_structure(self.doc_data)
        
        if errors:
            err_msg = "\n".join(errors[:8])
            if len(errors) > 8:
                err_msg += f"\n... and {len(errors) - 8} more errors."
            messagebox.showerror("Validation Failed", f"Validation failed with errors:\n\n{err_msg}")
            self.status_bar.config(text="Validation failed.")
        else:
            messagebox.showinfo("Validation Passed", "OpenForm Standard compliance check passed! File is completely valid.")
            self.status_bar.config(text="Validation passed.")

    def export_to_pdf_action(self):
        if not self.file_path:
            messagebox.showerror("Error", "Save the file first before exporting to PDF.")
            return
            
        if self.edit_mode:
            self.collect_inputs_in_memory()
            
        success, message = export_to_pdf_internal(self.file_path)
        
        if success:
            messagebox.showinfo("PDF Exported", message)
            self.status_bar.config(text="PDF exported successfully!")
        else:
            messagebox.showerror("PDF Export Error", f"Failed to export to PDF:\n{message}")
            self.status_bar.config(text="PDF Export failed.")

if __name__ == "__main__":
    file_to_open = sys.argv[1] if len(sys.argv) > 1 else None
    root = tk.Tk()
    app = OpenFormDesktopViewer(root, file_to_open)
    root.mainloop()
