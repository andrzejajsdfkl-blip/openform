import sys
import os
import json

def print_result(success, message):
    if success:
        print(f"\033[92m[OK] {message}\033[0m")
    else:
        print(f"\033[91m[FAIL] {message}\033[0m")

def validate_off_file(file_path):
    if not os.path.exists(file_path):
        print_result(False, f"File does not exist: {file_path}")
        return 2  # Exit code 2 for corrupted/missing file

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print_result(False, f"Invalid JSON format (corrupted file): {str(e)}")
        return 2  # Exit code 2 for corrupted file

    is_valid = True

    # Check root keys
    required_keys = ["format", "format_version", "document_id", "document_type", "fields", "tables"]
    for key in required_keys:
        if key not in data:
            print_result(False, f"Missing root key: \"{key}\"")
            is_valid = False

    if not is_valid:
        return 1  # Schema validation failure

    # Check format
    if data.get("format") != "OpenFormFile":
        print_result(False, f"Invalid format value: \"{data.get('format')}\" (expected \"OpenFormFile\")")
        is_valid = False

    # Validate document_type
    doc_type = data.get("document_type", {})
    if not isinstance(doc_type, dict) or "id" not in doc_type or "label" not in doc_type:
        print_result(False, "Invalid \"document_type\": must be an object with \"id\" and \"label\"")
        is_valid = False

    # Validate fields
    fields = data.get("fields", [])
    if not isinstance(fields, list):
        print_result(False, "\"fields\" must be a list")
        is_valid = False
    else:
        field_keys = set()
        for idx, field in enumerate(fields):
            if not isinstance(field, dict):
                print_result(False, f"Field at index {idx} is not a valid object")
                is_valid = False
                continue
            
            key = field.get("key")
            if not key:
                print_result(False, f"Field at index {idx} is missing a \"key\"")
                is_valid = False
                continue

            if key in field_keys:
                print_result(False, f"Duplicate field key: \"{key}\"")
                is_valid = False
            else:
                field_keys.add(key)

            # Check core attributes
            if "type" not in field:
                print_result(False, f"Field \"{key}\" is missing \"type\"")
                is_valid = False
            elif field["type"] not in ["text", "date", "int", "decimal", "bool", "select"]:
                print_result(False, f"Field \"{key}\" has invalid type: \"{field['type']}\"")
                is_valid = False

            if "label" not in field:
                print_result(False, f"Field \"{key}\" is missing \"label\"")
                is_valid = False

    # Validate tables
    tables = data.get("tables", [])
    if not isinstance(tables, list):
        print_result(False, "\"tables\" must be a list")
        is_valid = False
    else:
        table_keys = set()
        for idx, table in enumerate(tables):
            if not isinstance(table, dict):
                print_result(False, f"Table at index {idx} is not a valid object")
                is_valid = False
                continue

            t_key = table.get("key")
            if not t_key:
                print_result(False, f"Table at index {idx} is missing a \"key\"")
                is_valid = False
                continue

            if t_key in table_keys:
                print_result(False, f"Duplicate table key: \"{t_key}\"")
                is_valid = False
            else:
                table_keys.add(t_key)

            if "columns" not in table or not isinstance(table["columns"], list):
                print_result(False, f"Table \"{t_key}\" is missing \"columns\" list")
                is_valid = False
                continue

            col_keys = set()
            for col in table["columns"]:
                c_key = col.get("key")
                if not c_key:
                    print_result(False, f"A column in table \"{t_key}\" is missing \"key\"")
                    is_valid = False
                    continue
                if c_key in col_keys:
                    print_result(False, f"Duplicate column key \"{c_key}\" in table \"{t_key}\"")
                    is_valid = False
                else:
                    col_keys.add(c_key)

    if is_valid:
        print_result(True, f"File \"{os.path.basename(file_path)}\" is valid according to OpenForm specification.")
        return 0  # OK
    else:
        return 1  # Validation error

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate.py <path-to-file.off>")
        sys.exit(2)
    
    exit_code = validate_off_file(sys.argv[1])
    sys.exit(exit_code)
