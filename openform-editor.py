import sys
import os
import json
import uuid
from datetime import datetime
import tkinter as tk
from tkinter import ttk, messagebox, filedialog

def get_asset_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

class OpenFormDesktopEditor:
    def __init__(self, root, file_path=None):
        self.root = root
        self.root.title("OpenForm Desktop Editor")
        self.root.geometry("1000x800")
        
        try:
            ico_path = get_asset_path("openform.ico")
            if os.path.exists(ico_path):
                self.root.iconbitmap(ico_path)
        except Exception:
            pass
            
        self.file_path = file_path
        self.doc_data = None
        
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
        
        # Custom TCombobox styling to match dark theme
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
        
        # Custom Scrollbar styling
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
        
        # Bottom Status Bar (for non-disruptive notifications)
        self.status_bar = tk.Label(self.root, text="Ready", bd=1, relief=tk.SUNKEN, anchor=tk.W, 
                                   bg=self.card_bg, fg=self.fg_color, font=("Segoe UI", 9), padx=10, pady=4)
        self.status_bar.pack(side=tk.BOTTOM, fill=tk.X)
        
        # Main layout container
        self.main_container = ttk.Frame(self.root, padding=20)
        self.main_container.pack(fill=tk.BOTH, expand=True)
        
        # File menu
        self.menu_bar = tk.Menu(self.root)
        self.file_menu = tk.Menu(self.menu_bar, tearoff=0)
        self.file_menu.add_command(label="New Template", command=self.new_document)
        self.file_menu.add_command(label="Open File...", command=self.load_file_dialog)
        self.file_menu.add_command(label="Save", command=self.save_document)
        self.file_menu.add_command(label="Save As...", command=self.save_as_dialog)
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
        
        lbl = ttk.Label(welcome_frame, text="OpenForm Desktop Editor", font=("Segoe UI", 22, "bold"), foreground=self.primary_color)
        lbl.pack(pady=10)
        
        desc = ttk.Label(welcome_frame, text="Create, customize, and edit offline schemas and forms in .off format.", font=("Segoe UI", 11))
        desc.pack(pady=5)
        
        btn_new = tk.Button(welcome_frame, text="New Form Schema", command=self.new_document, 
                             bg=self.success_color, fg="#11111b", font=("Segoe UI", 11, "bold"), relief="flat", padx=15, pady=8, cursor="hand2")
        btn_new.pack(pady=10, fill=tk.X)
        self.bind_hover(btn_new, "#b4befe", self.success_color)
        
        btn_open = tk.Button(welcome_frame, text="Open Existing .off File", command=self.load_file_dialog, 
                              bg=self.primary_color, fg="#11111b", font=("Segoe UI", 11, "bold"), relief="flat", padx=15, pady=8, cursor="hand2")
        btn_open.pack(pady=10, fill=tk.X)
        self.bind_hover(btn_open, "#b4befe", self.primary_color)

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
            self.render_editor()
        except Exception as e:
            messagebox.showerror("Error", f"Failed to load file:\n{str(e)}")
            self.show_welcome()

    def new_document(self):
        self.file_path = None
        self.doc_data = {
            "format": "OpenFormFile",
            "format_version": "1.0",
            "document_id": str(uuid.uuid4()),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
            "document_type": {
                "id": "custom-form",
                "label": "Custom Form Title",
                "allow_file": False
            },
            "fields": [
                {
                    "key": "title_field",
                    "type": "text",
                    "enabled": True,
                    "label": "Document Name",
                    "order": 1,
                    "required": True,
                    "value": "My First Document"
                }
            ],
            "tables": []
        }
        self.render_editor()

    def render_editor(self):
        for w in self.main_container.winfo_children():
            w.destroy()
            
        doc = self.doc_data
        
        # Header Editor
        header_frame = ttk.Frame(self.main_container)
        header_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Meta Title & Save status
        title_lbl = ttk.Label(header_frame, text="OpenForm Editor Session", style="Header.TLabel")
        title_lbl.pack(side=tk.LEFT)
        
        btn_frame = ttk.Frame(header_frame)
        btn_frame.pack(side=tk.RIGHT)
        
        btn_validate = tk.Button(btn_frame, text="Validate Schema", 
                                  command=self.validate_current_document, bg=self.accent_color, fg="#11111b", 
                                  font=("Segoe UI", 9, "bold"), relief="flat", padx=12, pady=4, cursor="hand2")
        btn_validate.pack(side=tk.LEFT, padx=5)
        self.bind_hover(btn_validate, "#f5c2e7", self.accent_color)
        
        btn_pdf = tk.Button(btn_frame, text="Export PDF", 
                             command=self.export_to_pdf_action, bg=self.primary_color, fg="#11111b", 
                             font=("Segoe UI", 9, "bold"), relief="flat", padx=12, pady=4, cursor="hand2")
        btn_pdf.pack(side=tk.LEFT, padx=5)
        self.bind_hover(btn_pdf, "#b4befe", self.primary_color)
        
        btn_save = tk.Button(btn_frame, text="Save Form", command=self.save_document, 
                                  bg=self.success_color, fg="#11111b", font=("Segoe UI", 9, "bold"), 
                                  relief="flat", padx=12, pady=4, cursor="hand2")
        btn_save.pack(side=tk.LEFT, padx=5)
        self.bind_hover(btn_save, "#a6e3a1", self.success_color)

        btn_save_as = tk.Button(btn_frame, text="Save As...", command=self.save_as_dialog, 
                                     bg=self.primary_color, fg="#11111b", font=("Segoe UI", 9, "bold"), 
                                     relief="flat", padx=12, pady=4, cursor="hand2")
        btn_save_as.pack(side=tk.LEFT, padx=5)
        self.bind_hover(btn_save_as, "#b4befe", self.primary_color)
        
        # Layout notebooks/tabs
        self.notebook = ttk.Notebook(self.main_container)
        self.notebook.pack(fill=tk.BOTH, expand=True)
        
        # Tab 1: General settings
        self.render_general_tab()
        
        # Tab 2: Fields List
        self.render_fields_tab()
        
        # Tab 3: Tables Setup
        self.render_tables_tab()

    def render_general_tab(self):
        tab = ttk.Frame(self.notebook, padding=20)
        self.notebook.add(tab, text="General & Metadata")
        
        # Document Type Configuration
        card = tk.Frame(tab, bg=self.card_bg, highlightbackground=self.border_color, highlightthickness=1, bd=0)
        card.pack(fill=tk.X, pady=10, padx=5)
        
        tk.Label(card, text="SCHEMA METADATA", font=("Segoe UI", 10, "bold"), fg=self.accent_color, bg=self.card_bg).pack(anchor=tk.W, padx=15, pady=(15, 10))
        
        # Form Title
        tk.Label(card, text="Form Title / Label:", font=("Segoe UI", 10), fg=self.fg_color, bg=self.card_bg).pack(anchor=tk.W, padx=15)
        self.title_var = tk.StringVar(value=self.doc_data["document_type"].get("label", ""))
        self.title_ent = tk.Entry(card, textvariable=self.title_var, bg=self.bg_color, fg=self.fg_color,
                                   insertbackground=self.fg_color, relief="flat", font=("Segoe UI", 11),
                                   highlightbackground=self.border_color, highlightcolor=self.primary_color, highlightthickness=1)
        self.title_ent.pack(fill=tk.X, padx=15, pady=(2, 10), ipady=6, ipadx=4)
        
        # Form ID
        tk.Label(card, text="Form Type ID (Unique System Key):", font=("Segoe UI", 10), fg=self.fg_color, bg=self.card_bg).pack(anchor=tk.W, padx=15)
        self.id_var = tk.StringVar(value=self.doc_data["document_type"].get("id", ""))
        self.id_ent = tk.Entry(card, textvariable=self.id_var, bg=self.bg_color, fg=self.fg_color,
                                insertbackground=self.fg_color, relief="flat", font=("Segoe UI", 11),
                                highlightbackground=self.border_color, highlightcolor=self.primary_color, highlightthickness=1)
        self.id_ent.pack(fill=tk.X, padx=15, pady=(2, 10), ipady=6, ipadx=4)
        
        # Allow File
        self.allow_file_var = tk.BooleanVar(value=bool(self.doc_data["document_type"].get("allow_file", False)))
        self.chk_file = tk.Checkbutton(card, text="Allow File Attachments", variable=self.allow_file_var,
                                       bg=self.card_bg, fg=self.fg_color, selectcolor=self.bg_color,
                                       activebackground=self.card_bg, activeforeground=self.fg_color,
                                       font=("Segoe UI", 10, "bold"))
        self.chk_file.pack(anchor=tk.W, padx=15, pady=10)

    def render_fields_tab(self):
        tab = ttk.Frame(self.notebook, padding=15)
        self.notebook.add(tab, text="Fields Schema")
        
        # Toolbar for Fields
        tbar = ttk.Frame(tab)
        tbar.pack(fill=tk.X, pady=(0, 10))
        
        btn_add = tk.Button(tbar, text="+ Add Field", command=self.add_field_prompt,
                            bg=self.primary_color, fg="#11111b", font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=4, cursor="hand2")
        btn_add.pack(side=tk.LEFT)
        self.bind_hover(btn_add, "#b4befe", self.primary_color)
        
        # Scrollable area for list
        scroll_canvas = tk.Canvas(tab, bg=self.bg_color, highlightthickness=0)
        self.fields_list_frame = ttk.Frame(scroll_canvas, padding=5)
        scrollbar = ttk.Scrollbar(tab, orient="vertical", command=scroll_canvas.yview, style="Custom.TScrollbar")
        scroll_canvas.configure(yscrollcommand=scrollbar.set)
        
        scroll_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        scroll_canvas.create_window((0, 0), window=self.fields_list_frame, anchor="nw")
        
        def on_configure(event):
            scroll_canvas.configure(scrollregion=scroll_canvas.bbox("all"))
        self.fields_list_frame.bind("<Configure>", on_configure)
        
        # Bind mousewheel to canvas scroll
        def _on_mousewheel(event):
            scroll_canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
        scroll_canvas.bind("<Enter>", lambda e: scroll_canvas.bind_all("<MouseWheel>", _on_mousewheel))
        scroll_canvas.bind("<Leave>", lambda e: scroll_canvas.unbind_all("<MouseWheel>"))
        
        self.refresh_fields_list()

    def refresh_fields_list(self):
        for w in self.fields_list_frame.winfo_children():
            w.destroy()
            
        fields = sorted(self.doc_data["fields"], key=lambda x: x.get("order", 0))
        
        for idx, field in enumerate(fields):
            card = tk.Frame(self.fields_list_frame, bg=self.card_bg, highlightbackground=self.border_color, highlightthickness=1, bd=0)
            card.pack(fill=tk.X, pady=5, padx=5)
            
            lbl_info = f"{field['label']} ({field['key']}) — Type: {field['type'].upper()} {' [Required]' if field.get('required') else ''}"
            lbl = tk.Label(card, text=lbl_info, font=("Segoe UI", 10, "bold"), fg=self.fg_color, bg=self.card_bg)
            lbl.pack(side=tk.LEFT, padx=15, pady=10)
            
            # Action buttons
            btn_del = tk.Button(card, text="Delete", command=lambda f_key=field['key']: self.delete_field(f_key),
                                bg=self.danger_color, fg="#11111b", font=("Segoe UI", 8, "bold"), relief="flat", padx=6, pady=2, cursor="hand2")
            btn_del.pack(side=tk.RIGHT, padx=10)
            self.bind_hover(btn_del, "#f38ba8", self.danger_color)
            
            btn_edit = tk.Button(card, text="Edit", command=lambda f=field: self.edit_field_prompt(f),
                                 bg=self.accent_color, fg="#11111b", font=("Segoe UI", 8, "bold"), relief="flat", padx=8, pady=2, cursor="hand2")
            btn_edit.pack(side=tk.RIGHT, padx=5)
            self.bind_hover(btn_edit, "#f5c2e7", self.accent_color)

    def add_field_prompt(self):
        self.field_dialog(None)
        
    def edit_field_prompt(self, field):
        self.field_dialog(field)

    def field_dialog(self, field=None):
        win = tk.Toplevel(self.root)
        win.title("Field Editor" if field else "Add Field")
        win.geometry("450x450")
        win.configure(bg=self.bg_color)
        win.grab_set()
        
        # Labels and inputs
        tk.Label(win, text="Field Details", font=("Segoe UI", 12, "bold"), fg=self.primary_color, bg=self.bg_color).pack(pady=10)
        
        tk.Label(win, text="Unique Key:", bg=self.bg_color).pack(anchor=tk.W, padx=20)
        key_var = tk.StringVar(value=field["key"] if field else "")
        key_ent = tk.Entry(win, textvariable=key_var, bg=self.card_bg, fg=self.fg_color, insertbackground=self.fg_color, relief="flat", highlightbackground=self.border_color, highlightthickness=1)
        key_ent.pack(fill=tk.X, padx=20, pady=2, ipady=2)
        if field:
            key_ent.config(state="readonly")
            
        tk.Label(win, text="Label (Display Name):", bg=self.bg_color).pack(anchor=tk.W, padx=20)
        label_var = tk.StringVar(value=field["label"] if field else "")
        tk.Entry(win, textvariable=label_var, bg=self.card_bg, fg=self.fg_color, insertbackground=self.fg_color, relief="flat", highlightbackground=self.border_color, highlightthickness=1).pack(fill=tk.X, padx=20, pady=2, ipady=2)
        
        tk.Label(win, text="Type:", bg=self.bg_color).pack(anchor=tk.W, padx=20)
        type_var = tk.StringVar(value=field["type"] if field else "text")
        cb_type = ttk.Combobox(win, textvariable=type_var, values=["text", "date", "int", "decimal", "bool", "select"], state="readonly")
        cb_type.pack(fill=tk.X, padx=20, pady=2)
        
        tk.Label(win, text="Default Value (Optional):", bg=self.bg_color).pack(anchor=tk.W, padx=20)
        val_var = tk.StringVar(value=str(field.get("value", "")) if field and field.get("value") is not None else "")
        tk.Entry(win, textvariable=val_var, bg=self.card_bg, fg=self.fg_color, insertbackground=self.fg_color, relief="flat", highlightbackground=self.border_color, highlightthickness=1).pack(fill=tk.X, padx=20, pady=2, ipady=2)
        
        tk.Label(win, text="Select Options (Comma separated for 'select' type):", bg=self.bg_color).pack(anchor=tk.W, padx=20)
        opt_var = tk.StringVar(value=",".join(field.get("options", [])) if field and field.get("options") else "")
        tk.Entry(win, textvariable=opt_var, bg=self.card_bg, fg=self.fg_color, insertbackground=self.fg_color, relief="flat", highlightbackground=self.border_color, highlightthickness=1).pack(fill=tk.X, padx=20, pady=2, ipady=2)
        
        req_var = tk.BooleanVar(value=bool(field.get("required", False)) if field else False)
        tk.Checkbutton(win, text="Required", variable=req_var, bg=self.bg_color, fg=self.fg_color, selectcolor=self.bg_color, activebackground=self.bg_color, activeforeground=self.fg_color).pack(anchor=tk.W, padx=20, pady=10)
        
        def save():
            k = key_var.get().strip()
            lbl = label_var.get().strip()
            t = type_var.get()
            val = val_var.get().strip()
            opts = [o.strip() for o in opt_var.get().split(",") if o.strip()] if t == "select" else []
            
            if not k or not lbl:
                messagebox.showerror("Validation Error", "Key and Label cannot be empty.")
                return
                
            # Cast default value
            casted_val = val
            if t == "bool":
                casted_val = val.lower() in ["true", "1", "yes"]
            elif t == "int" and val:
                try: casted_val = int(val)
                except ValueError: pass
            elif t == "decimal" and val:
                try: casted_val = float(val)
                except ValueError: pass

            if field:
                # Update existing
                field["label"] = lbl
                field["type"] = t
                field["value"] = casted_val
                field["options"] = opts
                field["required"] = req_var.get()
            else:
                # Append new
                if any(f["key"] == k for f in self.doc_data["fields"]):
                    messagebox.showerror("Error", f"Field with key '{k}' already exists.")
                    return
                order_num = len(self.doc_data["fields"]) + 1
                self.doc_data["fields"].append({
                    "key": k,
                    "type": t,
                    "enabled": True,
                    "label": lbl,
                    "order": order_num,
                    "required": req_var.get(),
                    "value": casted_val,
                    "options": opts
                })
            
            self.refresh_fields_list()
            win.destroy()
            
        btn_save_f = tk.Button(win, text="Save Field", command=save, bg=self.success_color, fg="#11111b", font=("Segoe UI", 10, "bold"), relief="flat", cursor="hand2", padx=12, pady=5)
        btn_save_f.pack(pady=10)
        self.bind_hover(btn_save_f, "#b4befe", self.success_color)

    def delete_field(self, key):
        self.doc_data["fields"] = [f for f in self.doc_data["fields"] if f["key"] != key]
        self.refresh_fields_list()

    def render_tables_tab(self):
        tab = ttk.Frame(self.notebook, padding=15)
        self.notebook.add(tab, text="Tables Schema")
        
        tbar = ttk.Frame(tab)
        tbar.pack(fill=tk.X, pady=(0, 10))
        
        btn_add = tk.Button(tbar, text="+ Add Table", command=self.add_table_prompt,
                            bg=self.primary_color, fg="#11111b", font=("Segoe UI", 9, "bold"), relief="flat", padx=10, pady=4, cursor="hand2")
        btn_add.pack(side=tk.LEFT)
        self.bind_hover(btn_add, "#b4befe", self.primary_color)
        
        scroll_canvas = tk.Canvas(tab, bg=self.bg_color, highlightthickness=0)
        self.tables_list_frame = ttk.Frame(scroll_canvas, padding=5)
        scrollbar = ttk.Scrollbar(tab, orient="vertical", command=scroll_canvas.yview, style="Custom.TScrollbar")
        scroll_canvas.configure(yscrollcommand=scrollbar.set)
        
        scroll_canvas.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        scroll_canvas.create_window((0, 0), window=self.tables_list_frame, anchor="nw")
        
        def on_configure(event):
            scroll_canvas.configure(scrollregion=scroll_canvas.bbox("all"))
        self.tables_list_frame.bind("<Configure>", on_configure)
        
        # Bind mousewheel to canvas scroll
        def _on_mousewheel_tables(event):
            scroll_canvas.yview_scroll(int(-1 * (event.delta / 120)), "units")
        scroll_canvas.bind("<Enter>", lambda e: scroll_canvas.bind_all("<MouseWheel>", _on_mousewheel_tables))
        scroll_canvas.bind("<Leave>", lambda e: scroll_canvas.unbind_all("<MouseWheel>"))
        
        self.refresh_tables_list()

    def refresh_tables_list(self):
        for w in self.tables_list_frame.winfo_children():
            w.destroy()
            
        tables = self.doc_data.get("tables", [])
        for table in tables:
            card = tk.Frame(self.tables_list_frame, bg=self.card_bg, highlightbackground=self.border_color, highlightthickness=1, bd=0)
            card.pack(fill=tk.X, pady=8, padx=5)
            
            col_list = [c["key"] for c in table.get("columns", [])]
            lbl_info = f"{table['label']} ({table['key']}) — Columns: {', '.join(col_list)}"
            lbl = tk.Label(card, text=lbl_info, font=("Segoe UI", 10, "bold"), fg=self.fg_color, bg=self.card_bg)
            lbl.pack(side=tk.LEFT, padx=15, pady=15)
            
            btn_del = tk.Button(card, text="Delete", command=lambda t_key=table['key']: self.delete_table(t_key),
                                bg=self.danger_color, fg="#11111b", font=("Segoe UI", 8, "bold"), relief="flat", padx=6, pady=2, cursor="hand2")
            btn_del.pack(side=tk.RIGHT, padx=10)
            self.bind_hover(btn_del, "#f38ba8", self.danger_color)
            
            btn_cols = tk.Button(card, text="Columns Editor", command=lambda t=table: self.edit_table_cols_dialog(t),
                                 bg=self.accent_color, fg="#11111b", font=("Segoe UI", 8, "bold"), relief="flat", padx=8, pady=2, cursor="hand2")
            btn_cols.pack(side=tk.RIGHT, padx=5)
            self.bind_hover(btn_cols, "#f5c2e7", self.accent_color)

    def add_table_prompt(self):
        win = tk.Toplevel(self.root)
        win.title("Add Table")
        win.geometry("350x250")
        win.configure(bg=self.bg_color)
        win.grab_set()
        
        tk.Label(win, text="Unique Key:", bg=self.bg_color).pack(anchor=tk.W, padx=20, pady=(15, 2))
        key_var = tk.StringVar()
        tk.Entry(win, textvariable=key_var, bg=self.card_bg, fg=self.fg_color, insertbackground=self.fg_color, relief="flat", highlightbackground=self.border_color, highlightthickness=1).pack(fill=tk.X, padx=20, pady=2, ipady=2)
        
        tk.Label(win, text="Label / Name:", bg=self.bg_color).pack(anchor=tk.W, padx=20, pady=(10, 2))
        label_var = tk.StringVar()
        tk.Entry(win, textvariable=label_var, bg=self.card_bg, fg=self.fg_color, insertbackground=self.fg_color, relief="flat", highlightbackground=self.border_color, highlightthickness=1).pack(fill=tk.X, padx=20, pady=2, ipady=2)
        
        def save():
            k = key_var.get().strip()
            lbl = label_var.get().strip()
            if not k or not lbl:
                messagebox.showerror("Error", "All fields are required")
                return
                
            if any(t["key"] == k for t in self.doc_data.get("tables", [])):
                messagebox.showerror("Error", f"Table with key '{k}' already exists.")
                return
                
            self.doc_data.setdefault("tables", []).append({
                "key": k,
                "label": lbl,
                "enabled": True,
                "order": len(self.doc_data.get("tables", [])) + 1,
                "columns": [],
                "rows": []
            })
            self.refresh_tables_list()
            win.destroy()
            
        btn_save_t = tk.Button(win, text="Create Table", command=save, bg=self.success_color, fg="#11111b", font=("Segoe UI", 10, "bold"), relief="flat", cursor="hand2", padx=12, pady=5)
        btn_save_t.pack(pady=20)
        self.bind_hover(btn_save_t, "#b4befe", self.success_color)

    def delete_table(self, key):
        self.doc_data["tables"] = [t for t in self.doc_data["tables"] if t["key"] != key]
        self.refresh_tables_list()

    def edit_table_cols_dialog(self, table):
        win = tk.Toplevel(self.root)
        win.title(f"Columns Editor — {table['label']}")
        win.geometry("500x500")
        win.configure(bg=self.bg_color)
        win.grab_set()
        
        # Upper container to add column
        add_frame = tk.Frame(win, bg=self.card_bg, highlightbackground=self.border_color, highlightthickness=1, bd=0)
        add_frame.pack(fill=tk.X, padx=15, pady=15)
        
        tk.Label(add_frame, text="ADD NEW COLUMN", font=("Segoe UI", 9, "bold"), fg=self.accent_color, bg=self.card_bg).grid(row=0, column=0, columnspan=2, padx=10, pady=5, sticky=tk.W)
        
        tk.Label(add_frame, text="Key:", bg=self.card_bg).grid(row=1, column=0, padx=10, pady=2, sticky=tk.W)
        c_key_var = tk.StringVar()
        tk.Entry(add_frame, textvariable=c_key_var, bg=self.bg_color, fg=self.fg_color, relief="flat", highlightbackground=self.border_color, highlightthickness=1, width=15).grid(row=1, column=1, padx=10, pady=2)
        
        tk.Label(add_frame, text="Label:", bg=self.card_bg).grid(row=2, column=0, padx=10, pady=2, sticky=tk.W)
        c_label_var = tk.StringVar()
        tk.Entry(add_frame, textvariable=c_label_var, bg=self.bg_color, fg=self.fg_color, relief="flat", highlightbackground=self.border_color, highlightthickness=1, width=15).grid(row=2, column=1, padx=10, pady=2)
        
        tk.Label(add_frame, text="Type:", bg=self.card_bg).grid(row=3, column=0, padx=10, pady=2, sticky=tk.W)
        c_type_var = tk.StringVar(value="text")
        cb = ttk.Combobox(add_frame, textvariable=c_type_var, values=["text", "date", "int", "decimal", "bool"], state="readonly", width=13)
        cb.grid(row=3, column=1, padx=10, pady=2)
        
        list_frame = tk.Frame(win, bg=self.bg_color)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=15)
        
        def refresh_cols():
            for w in list_frame.winfo_children():
                w.destroy()
                
            cols = table.get("columns", [])
            for c in cols:
                cf = tk.Frame(list_frame, bg=self.card_bg, highlightbackground=self.border_color, highlightthickness=1, bd=0)
                cf.pack(fill=tk.X, pady=3)
                
                tk.Label(cf, text=f"{c['label']} ({c['key']}) — {c['type']}", font=("Segoe UI", 9), bg=self.card_bg).pack(side=tk.LEFT, padx=10, pady=5)
                
                def make_del_fn(col_key):
                    return lambda: delete_col(col_key)
                    
                tk.Button(cf, text="X", command=make_del_fn(c['key']), bg=self.danger_color, fg="#11111b", font=("Segoe UI", 8, "bold"), relief="flat", cursor="hand2").pack(side=tk.RIGHT, padx=10)
                
        def add_col():
            ck = c_key_var.get().strip()
            cl = c_label_var.get().strip()
            ct = c_type_var.get()
            
            if not ck or not cl:
                messagebox.showerror("Error", "Key and Label required.")
                return
                
            if any(c["key"] == ck for c in table["columns"]):
                messagebox.showerror("Error", "Column already exists.")
                return
                
            table["columns"].append({
                "key": ck,
                "type": ct,
                "enabled": True,
                "label": cl,
                "order": len(table["columns"]) + 1,
                "required": False,
                "default_value": False if ct == "bool" else ""
            })
            c_key_var.set("")
            c_label_var.set("")
            refresh_cols()
            self.refresh_tables_list()
            
        def delete_col(col_key):
            table["columns"] = [c for c in table["columns"] if c["key"] != col_key]
            refresh_cols()
            self.refresh_tables_list()
            
        btn_add_c = tk.Button(add_frame, text="Add Column", command=add_col, bg=self.primary_color, fg="#11111b", font=("Segoe UI", 9, "bold"), relief="flat", cursor="hand2", padx=10, pady=4)
        btn_add_c.grid(row=4, column=0, columnspan=2, pady=10)
        self.bind_hover(btn_add_c, "#b4befe", self.primary_color)
        
        refresh_cols()

    def collect_inputs(self):
        # Update metadata
        self.doc_data["document_type"]["label"] = self.title_var.get().strip()
        self.doc_data["document_type"]["id"] = self.id_var.get().strip()
        self.doc_data["document_type"]["allow_file"] = self.allow_file_var.get()
        self.doc_data["updated_at"] = datetime.now().isoformat()

    def save_document(self):
        if not self.file_path:
            self.save_as_dialog()
            return
            
        self.collect_inputs()
        try:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(self.doc_data, f, indent=2, ensure_ascii=False)
            self.status_bar.config(text=f"File saved successfully to {os.path.basename(self.file_path)}")
            self.root.after(3000, lambda: self.status_bar.config(text="Ready"))
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save:\n{str(e)}")

    def save_as_dialog(self):
        self.collect_inputs()
        path = filedialog.asksaveasfilename(defaultextension=".off", filetypes=[("OpenForm Files", "*.off")])
        if path:
            self.file_path = path
            self.save_document()

    def validate_current_document(self):
        if not self.doc_data:
            self.status_bar.config(text="No document loaded to validate.")
            return
            
        self.collect_inputs()
        data = self.doc_data
        errors = []
        
        required_keys = ["format", "format_version", "document_id", "document_type", "fields", "tables"]
        for key in required_keys:
            if key not in data:
                errors.append(f"Missing root key: '{key}'")
                
        if data.get("format") != "OpenFormFile":
            errors.append(f"Invalid format: '{data.get('format')}' (expected 'OpenFormFile')")
            
        doc_type = data.get("document_type", {})
        if not isinstance(doc_type, dict) or "id" not in doc_type or "label" not in doc_type:
            errors.append("Invalid 'document_type': must be an object with 'id' and 'label'")
            
        fields = data.get("fields", [])
        if not isinstance(fields, list):
            errors.append("'fields' must be a list")
        else:
            field_keys = set()
            for idx, field in enumerate(fields):
                if not isinstance(field, dict):
                    errors.append(f"Field at index {idx} is invalid")
                    continue
                k = field.get("key")
                if not k:
                    errors.append(f"Field at index {idx} is missing 'key'")
                    continue
                if k in field_keys:
                    errors.append(f"Duplicate field key: '{k}'")
                else:
                    field_keys.add(k)
                if "type" not in field:
                    errors.append(f"Field '{k}' is missing 'type'")
                elif field["type"] not in ["text", "date", "int", "decimal", "bool", "select"]:
                    errors.append(f"Field '{k}' has invalid type: '{field['type']}'")
                if "label" not in field:
                    errors.append(f"Field '{k}' is missing 'label'")
                    
        tables = data.get("tables", [])
        if not isinstance(tables, list):
            errors.append("'tables' must be a list")
        else:
            table_keys = set()
            for idx, table in enumerate(tables):
                if not isinstance(table, dict):
                    errors.append(f"Table at index {idx} is invalid")
                    continue
                tk_key = table.get("key")
                if not tk_key:
                    errors.append(f"Table at index {idx} is missing 'key'")
                    continue
                if tk_key in table_keys:
                    errors.append(f"Duplicate table key: '{tk_key}'")
                else:
                    table_keys.add(tk_key)
                if "columns" not in table or not isinstance(table["columns"], list):
                    errors.append(f"Table '{tk_key}' is missing 'columns' list")
                    continue
                col_keys = set()
                for col in table["columns"]:
                    ck = col.get("key")
                    if not ck:
                        errors.append(f"A column in table '{tk_key}' is missing 'key'")
                        continue
                    if ck in col_keys:
                        errors.append(f"Duplicate column key '{ck}' in table '{tk_key}'")
                    else:
                        col_keys.add(ck)
                        
        if errors:
            err_msg = "\n".join(errors[:8])
            if len(errors) > 8:
                err_msg += f"\n... and {len(errors) - 8} more errors."
            messagebox.showerror("Validation Failed", f"Schema validation failed with errors:\n\n{err_msg}")
            self.status_bar.config(text="Validation failed.")
        else:
            messagebox.showinfo("Validation Passed", "Schema is compliant and standard-compatible!")
            self.status_bar.config(text="Validation passed.")

    def export_to_pdf_action(self):
        if not self.file_path:
            messagebox.showerror("Error", "Save the file first before exporting to PDF.")
            return
            
        self.collect_inputs()
        import subprocess
        from pathlib import Path
        if getattr(sys, 'frozen', False):
            exporter = os.path.join(os.path.dirname(sys.executable), "OpenFormPdfExporter.exe")
        else:
            exporter = os.path.join(os.path.dirname(os.path.abspath(__file__)), "export-pdf.py")
            
        cmd = []
        if exporter.endswith(".py"):
            cmd = [sys.executable, exporter, self.file_path]
        else:
            cmd = [exporter, self.file_path]
            
        try:
            self.status_bar.config(text="Exporting to PDF...")
            self.root.update_idletasks()
            
            subprocess.run(cmd, capture_output=True, text=True, check=True)
            pdf_path = str(Path(self.file_path).with_suffix(".pdf"))
            messagebox.showinfo("PDF Exported", f"Successfully exported schema design to PDF:\n{pdf_path}")
            self.status_bar.config(text=f"Exported PDF to {os.path.basename(pdf_path)}")
        except Exception as e:
            messagebox.showerror("PDF Export Error", f"Failed to export to PDF:\n{str(e)}")
            self.status_bar.config(text="PDF Export failed.")

if __name__ == "__main__":
    file_to_open = sys.argv[1] if len(sys.argv) > 1 else None
    root = tk.Tk()
    app = OpenFormDesktopEditor(root, file_to_open)
    root.mainloop()
