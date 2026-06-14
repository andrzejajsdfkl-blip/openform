"""OpenForm validation utility

Improved validate.py:
- argparse CLI with support for multiple files
- structured logging
- clear exit codes: 0 OK, 1 validation errors, 2 file/parse errors, 3 unexpected error
- optional --json output for machine-readable reports
- better messages and summary
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Exit codes
EXIT_OK = 0
EXIT_VALIDATION_ERROR = 1
EXIT_FILE_ERROR = 2
EXIT_UNEXPECTED = 3

LOG = logging.getLogger("openform.validate")

REQUIRED_ROOT_KEYS = ["format", "format_version", "document_id", "document_type", "fields", "tables"]
VALID_FIELD_TYPES = {"text", "date", "int", "decimal", "bool", "select"}


def configure_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=level, format="%(levelname)s: %(message)s")


def load_json_file(path: Path) -> Tuple[bool, Any, str]:
    """Load JSON from path. Returns (success, data_or_none, error_message)."""
    if not path.exists():
        return False, None, f"File does not exist: {path}"

    try:
        with path.open("r", encoding="utf-8") as fh:
            data = json.load(fh)
        return True, data, ""
    except json.JSONDecodeError as e:
        return False, None, f"Invalid JSON: {e.msg} (line {e.lineno} column {e.colno})"
    except Exception as e:
        return False, None, f"Failed to read file: {e}"


def validate_structure(data: Dict[str, Any]) -> List[str]:
    """Validate the OpenForm JSON structure and return list of error messages."""
    errors: List[str] = []

    # Root keys
    for key in REQUIRED_ROOT_KEYS:
        if key not in data:
            errors.append(f"Missing root key: '{key}'")

    # If root keys missing, skip deeper checks
    if errors:
        return errors

    # Format value
    if data.get("format") != "OpenFormFile":
        errors.append(f"Invalid format value: '{data.get('format')}' (expected 'OpenFormFile')")

    # document_type
    doc_type = data.get("document_type")
    if not isinstance(doc_type, dict) or "id" not in doc_type or "label" not in doc_type:
        errors.append("Invalid 'document_type': must be an object with 'id' and 'label'")

    # fields
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

    # tables
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


def summarize_report(path: Path, errors: List[str]) -> Dict[str, Any]:
    return {
        "file": str(path),
        "valid": len(errors) == 0,
        "errors": errors,
        "summary": {
            "error_count": len(errors),
        },
    }


def main(argv: List[str] | None = None) -> int:
    argv = argv if argv is not None else sys.argv[1:]

    parser = argparse.ArgumentParser(prog="validate", description="Validate OpenForm .off files")
    parser.add_argument("files", nargs="+", help="Path(s) to .off/.json file(s) to validate")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON report")

    args = parser.parse_args(argv)
    configure_logging(args.verbose)

    overall_errors = 0
    reports: List[Dict[str, Any]] = []

    for f in args.files:
        p = Path(f)
        LOG.info("Validating %s", p)
        ok, data, err = load_json_file(p)
        if not ok:
            LOG.error(err)
            reports.append(summarize_report(p, [err]))
            overall_errors += 1
            continue

        try:
            errors = validate_structure(data)
            if errors:
                for e in errors[:10]:
                    LOG.error(e)
                if len(errors) > 10:
                    LOG.error("... and %d more errors", len(errors) - 10)
                overall_errors += 1
            else:
                LOG.info("%s: OK", p.name)

            reports.append(summarize_report(p, errors))
        except Exception as exc:  # unexpected
            LOG.exception("Unexpected error while validating %s: %s", p, exc)
            reports.append(summarize_report(p, [f"Unexpected error: {exc}"]))
            overall_errors += 1

    if args.json:
        json.dump({"reports": reports}, sys.stdout, indent=2)
        print()

    if overall_errors == 0:
        LOG.info("All files passed validation.")
        return EXIT_OK
    else:
        LOG.error("Validation finished: %d file(s) with issues.", overall_errors)
        return EXIT_VALIDATION_ERROR


if __name__ == "__main__":
    try:
        rc = main()
        sys.exit(rc)
    except Exception as exc:
        LOG.exception("Fatal error: %s", exc)
        sys.exit(EXIT_UNEXPECTED)
