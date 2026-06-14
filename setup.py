import os
import sys
import shutil
import winreg
import ctypes

def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin()
    except:
        return False

# Dynamically set installation directory
if is_admin():
    INSTALL_DIR = r"C:\Program Files\OpenForm"
else:
    INSTALL_DIR = os.path.join(os.environ["LOCALAPPDATA"], "Programs", "OpenForm")

def get_reg_keys():
    # Detect if we have uninstall executable, otherwise use setup.py
    if os.path.exists("dist/setup/setup.exe") or os.path.exists(os.path.join(INSTALL_DIR, "setup.exe")):
        uninstall_cmd = f'"{os.path.join(INSTALL_DIR, "setup.exe")}" --uninstall'
    else:
        uninstall_cmd = f'python "{os.path.join(INSTALL_DIR, "setup.py")}" --uninstall'

    reg_keys = [
        # .off file association
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\.off", "", winreg.REG_SZ, "OpenForm.Document"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\.off", "Content Type", winreg.REG_SZ, "application/x-openform"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\.off", "PerceivedType", winreg.REG_SZ, "document"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\.off\ShellNew", "FileName", winreg.REG_SZ, os.path.join(INSTALL_DIR, r"templates\blank.off")),
        
        # MIME type
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\MIME\Database\Content Type\application/x-openform", "Extension", winreg.REG_SZ, ".off"),
        
        # Open With integration
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\Applications\OpenForm.exe", "FriendlyAppName", winreg.REG_SZ, "OpenForm"),
        
        # Document type properties
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document", "", winreg.REG_SZ, "OpenForm Document"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document", "FriendlyTypeName", winreg.REG_SZ, "OpenForm Document"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document", "InfoTip", winreg.REG_SZ, "OpenForm structured form"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document", "FormatVersion", winreg.REG_SZ, "1.0"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document", "Vendor", winreg.REG_SZ, "OpenForm"),
        
        # Default Icon
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\DefaultIcon", "", winreg.REG_SZ, f'"{os.path.join(INSTALL_DIR, "icons\\openform.ico")}",0'),
        
        # Cascading Submenu
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm", "MUIVerb", winreg.REG_SZ, "OpenForm"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm", "SubCommands", winreg.REG_SZ, ""),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm", "Icon", winreg.REG_SZ, f'"{os.path.join(INSTALL_DIR, "icons\\openform.ico")}"'),
        
        # Cascading open
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\open", "", winreg.REG_SZ, "Otwórz"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\open\command", "", winreg.REG_SZ, f'"{os.path.join(INSTALL_DIR, "OpenForm.exe")}" "%1"'),
        
        # Cascading edit
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\edit", "", winreg.REG_SZ, "Edytuj"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\edit\command", "", winreg.REG_SZ, f'"{os.path.join(INSTALL_DIR, "OpenFormEditor.exe")}" "%1"'),
        
        # Cascading validate
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\validate", "", winreg.REG_SZ, "Waliduj"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\validate\command", "", winreg.REG_SZ, f'"{os.path.join(INSTALL_DIR, "OpenFormValidator.exe")}" "%1"'),
        
        # Cascading export
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\export", "", winreg.REG_SZ, "Eksportuj do PDF"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\export\command", "", winreg.REG_SZ, f'"{os.path.join(INSTALL_DIR, "OpenFormPdfExporter.exe")}" "%1"'),
        
        # Cascading import
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\import", "", winreg.REG_SZ, "Importuj do serwera"),
        (winreg.HKEY_CURRENT_USER, r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\import\command", "", winreg.REG_SZ, f'"{os.path.join(INSTALL_DIR, "openform-handler.bat")}" "%1"'),
    ]

    uninstall_keys = [
        (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenForm", "DisplayName", winreg.REG_SZ, "OpenForm File Suite"),
        (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenForm", "DisplayVersion", winreg.REG_SZ, "1.0.0"),
        (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenForm", "Publisher", winreg.REG_SZ, "OpenForm"),
        (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenForm", "DisplayIcon", winreg.REG_SZ, os.path.join(INSTALL_DIR, "icons\\openform.ico")),
        (winreg.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenForm", "UninstallString", winreg.REG_SZ, uninstall_cmd),
    ]
    return reg_keys, uninstall_keys

def install():
    print(f"Installing OpenForm to: {INSTALL_DIR}")
    
    # Step 1: Copy files
    dist_src = os.path.abspath("dist/OpenForm")
    if not os.path.exists(dist_src):
        print("Error: Compiled files not found. Run build.py first.")
        sys.exit(1)
        
    if os.path.exists(INSTALL_DIR):
        print("Cleaning previous installation...")
        try:
            shutil.rmtree(INSTALL_DIR)
        except Exception as e:
            print(f"Error cleaning installation directory: {e}")
            sys.exit(1)
            
    print(f"Copying files...")
    shutil.copytree(dist_src, INSTALL_DIR)
    
    # Copy setup.py as uninstall entry point
    shutil.copy(__file__, os.path.join(INSTALL_DIR, "setup.py"))
    
    # Copy handler bat
    shutil.copy("openform-handler.bat", os.path.join(INSTALL_DIR, "openform-handler.bat"))
    
    # Create ProgramData update folder
    os.makedirs(r"C:\ProgramData\OpenForm", exist_ok=True)
    
    # Step 2: Register Keys
    print("Writing registry associations...")
    reg_keys, uninstall_keys = get_reg_keys()
    for root, path, key, rtype, val in reg_keys + uninstall_keys:
        try:
            reg_key = winreg.CreateKeyEx(root, path, 0, winreg.KEY_SET_VALUE)
            winreg.SetValueEx(reg_key, key, 0, rtype, val)
            winreg.CloseKey(reg_key)
        except Exception as err:
            print(f"Failed to write registry key: {path} -> {err}")
            
    print("\n[OK] Installation completed successfully!")

def uninstall():
    print(f"Uninstalling OpenForm from: {INSTALL_DIR}")
    
    # Step 1: Remove Registry Keys
    print("Removing registry associations...")
    keys_to_delete = [
        r"Software\Classes\.off\ShellNew",
        r"Software\Classes\.off",
        r"Software\Classes\MIME\Database\Content Type\application/x-openform",
        r"Software\Classes\Applications\OpenForm.exe",
        r"Software\Classes\OpenForm.Document\DefaultIcon",
        r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\open\command",
        r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\open",
        r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\edit\command",
        r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\edit",
        r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\validate\command",
        r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\validate",
        r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\export\command",
        r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\export",
        r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\import\command",
        r"Software\Classes\OpenForm.Document\shell\OpenForm\shell\import",
        r"Software\Classes\OpenForm.Document\shell\OpenForm\shell",
        r"Software\Classes\OpenForm.Document\shell\OpenForm",
        r"Software\Classes\OpenForm.Document\shell",
        r"Software\Classes\OpenForm.Document",
        r"Software\Microsoft\Windows\CurrentVersion\Uninstall\OpenForm",
    ]
    
    for path in keys_to_delete:
        try:
            winreg.DeleteKey(winreg.HKEY_CURRENT_USER, path)
        except WindowsError:
            pass

    # Step 2: Delete files
    # Create batch file to delete installation folder after script exits (to prevent locking)
    cleanup_bat = r"C:\Windows\Temp\openform_cleanup.bat"
    with open(cleanup_bat, 'w') as f:
        f.write(f'@echo off\n')
        f.write(f'timeout /t 2 /nobreak > nul\n')
        f.write(f'rmdir /s /q "{INSTALL_DIR}"\n')
        f.write(f'rmdir /s /q "C:\\ProgramData\\OpenForm"\n')
        f.write(f'del "%~f0"\n')
        
    print(f"Removing files...")
    os.startfile(cleanup_bat)
    print("\n[OK] Uninstallation complete.")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--uninstall":
        uninstall()
    else:
        install()
