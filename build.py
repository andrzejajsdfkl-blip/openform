import subprocess
import sys
import os
import json
import hashlib
import shutil
from pathlib import Path

APP_VERSION = "1.0.0"
VERSION_TUPLE = ",".join(APP_VERSION.split('.')) + ",0"
DIST_DIR = Path("dist/OpenForm")
BUILD_CACHE = Path(".build_cache")

TARGETS = [
    ("openform-viewer.py", "OpenForm", True),        # noconsole = True
    ("openform-editor.py", "OpenFormEditor", True),  # noconsole = True
    ("validate.py", "OpenFormValidator", False),     # noconsole = False
    ("export-pdf.py", "OpenFormPdfExporter", False), # noconsole = False
]

# Define metadata text template for version resources
VERSION_INFO_TEMPLATE = """
# UTF-8
#
VSVersionInfo(
  ffi=FixedFileInfo(
    filevers=({version_tuple}),
    prodvers=({version_tuple}),
    mask=0x3f,
    flags=0x0,
    OS=0x40004,
    fileType=0x1,
    subtype=0x0,
    date=(0, 0)
    ),
  kids=[
    StringFileInfo(
      [
      StringTable(
        '040904B0',
        [StringStruct('CompanyName', '{company}'),
        StringStruct('FileDescription', '{description}'),
        StringStruct('FileVersion', '{version}'),
        StringStruct('InternalName', '{name}'),
        StringStruct('LegalCopyright', 'Copyright (c) 2026 {company}'),
        StringStruct('OriginalFilename', '{filename}'),
        StringStruct('ProductName', '{product}'),
        StringStruct('ProductVersion', '{version}')])
      ]
    ),
    VarFileInfo([VarStruct('Translation', [1033, 1200])])
  ]
)
"""

# ----------------------------
# UTILS
# ----------------------------

def run(cmd):
    subprocess.check_call(cmd)

def file_hash(path):
    return hashlib.md5(Path(path).read_bytes()).hexdigest()

def cache_key(script):
    return BUILD_CACHE / f"{Path(script).stem}.hash"

def needs_build(script):
    h = file_hash(script)
    key = cache_key(script)

    if not key.exists():
        key.write_text(h)
        return True

    old = key.read_text()
    if old != h:
        key.write_text(h)
        return True

    return False

def write_version_file(filename, name, description):
    content = VERSION_INFO_TEMPLATE.format(
        version_tuple=VERSION_TUPLE,
        version=APP_VERSION,
        company="OpenForm",
        product="OpenForm",
        name=name,
        filename=f"{name}.exe",
        description=description
    )
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(content)

# ----------------------------
# PYINSTALLER CHECK
# ----------------------------

def ensure_pyinstaller():
    try:
        run([sys.executable, "-m", "PyInstaller", "--version"])
    except:
        run([sys.executable, "-m", "pip", "install", "pyinstaller"])

# ----------------------------
# BUILD SINGLE EXE
# ----------------------------

def build_one(script, name, noconsole):
    print(f"[BUILD] {name}")
    
    os.makedirs("build_resources", exist_ok=True)
    ver_file = f"build_resources/ver_{name}.txt"
    desc = f"OpenForm {name} Utility"
    if name == "OpenForm":
        desc = "OpenForm Viewer Application"
    elif name == "OpenFormEditor":
        desc = "OpenForm Editor Application"
        
    write_version_file(ver_file, name, desc)

    cmd = [
        sys.executable,
        "-m",
        "PyInstaller",

        "--onefile",
        "--clean",
        "--noconfirm",

        "--name", name,
        "--distpath", str(DIST_DIR),
        "--version-file", ver_file,

        "--add-data", "openform.ico;.",
        "--icon", "openform.ico",
        script
    ]

    if noconsole:
        cmd.append("--noconsole")

    run(cmd)

# ----------------------------
# ASSETS (FAST COPY ONLY ONCE)
# ----------------------------

def write_assets():
    DIST_DIR.mkdir(parents=True, exist_ok=True)

    ico = DIST_DIR / "openform.ico"
    if not ico.exists():
        ico.write_bytes(Path("openform.ico").read_bytes())

    templates = DIST_DIR / "templates"
    templates.mkdir(exist_ok=True)

    blank = templates / "blank.off"
    if not blank.exists():
        blank.write_text(json.dumps({
            "format": "OpenFormFile",
            "format_version": "1.0",
            "document_id": "",
            "created_at": "",
            "updated_at": "",
            "document_type": {
                "id": "new-document",
                "label": "Blank Document",
                "allow_file": False
            },
            "fields": [],
            "tables": []
        }, indent=2, ensure_ascii=False), encoding="utf-8")

    examples = DIST_DIR / "examples"
    examples.mkdir(exist_ok=True)

    sample = examples / "sample.off"
    if not sample.exists():
        sample.write_text(json.dumps({
            "format": "OpenFormFile",
            "format_version": "1.0",
            "document_id": "sample-doc-uuid",
            "created_at": "2026-06-14T00:00:00Z",
            "updated_at": "2026-06-14T00:00:00Z",
            "document_type": {
                "id": "sample-form",
                "label": "Przykładowy Formularz",
                "allow_file": True
            },
            "fields": [
                {
                    "key": "title",
                    "type": "text",
                    "enabled": True,
                    "label": "Tytuł Dokumentu",
                    "order": 1,
                    "required": True,
                    "value": "Wzór Dokumentu OpenForm"
                }
            ],
            "tables": []
        }, indent=2, ensure_ascii=False), encoding="utf-8")

    docs = DIST_DIR / "docs"
    docs.mkdir(exist_ok=True)

    spec = docs / "specification.md"
    if not spec.exists() and Path("docs/blueprint.md").exists():
        spec.write_bytes(Path("docs/blueprint.md").read_bytes())

# ----------------------------
# MAIN BUILD
# ----------------------------

def main():
    print(f"OpenForm FAST BUILD v{APP_VERSION}")

    ensure_pyinstaller()

    BUILD_CACHE.mkdir(exist_ok=True)

    write_assets()

    built_any = False

    for script, name, noconsole in TARGETS:
        if not Path(script).exists():
            print(f"[SKIP] missing {script}")
            continue

        if needs_build(script):
            build_one(script, name, noconsole)
            built_any = True
        else:
            print(f"[SKIP] {name} (cached)")

    # Cleanup temporary resources
    print("Cleaning build caches...")
    if os.path.exists("build_resources"):
        shutil.rmtree("build_resources")
    if os.path.exists("build"):
        shutil.rmtree("build")
        
    # Remove spec files
    for _, name, _ in TARGETS:
        spec_file = f"{name}.spec"
        if os.path.exists(spec_file):
            os.remove(spec_file)

    if not built_any:
        print("\n[OK] No changes detected -> build finished in ~1s")
    else:
        print("\n[OK] Build complete")

if __name__ == "__main__":
    main()
