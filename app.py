# app.py
from flask import Flask, request, jsonify, send_file, render_template
from flask_cors import CORS
import pandas as pd
import io
import time
from transformations_code import *

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024  # Limit file size to 20MB
CORS(app)

# In-memory user sessions: session_id -> { df, last_df, timestamp }
USER_SESSIONS = {}
SESSION_TIMEOUT = 1800  # 1 hour

AVAILABLE_OPERATIONS = [
    "Drop Column", "Rename Column", "Drop Duplicates",
    "Fill Missing Values", "Drop Rows with Missing Values",
    "Convert Data Type", "Trim Spaces", "Lowercase Text", "Uppercase Text",
    "Replace String", "Remove Character", "Extract Year from Date",
    "Extract Month from Date", "Sort by Column", "Filter Rows",
    "Group By + Aggregate", "Create New Column",
    "Filter by Values", "Drop Rows by Values",
    "Numeric Range Filter", "Date Range Filter",
    "Map Values", "Count Distinct Values", "Filter by Boolean"
]

@app.route('/')
def home():
    return render_template('index.html')

@app.route("/operations", methods=["GET"])
def get_operations():
    return jsonify(AVAILABLE_OPERATIONS)

@app.route("/upload", methods=["POST"])
def upload():
    session_id = request.form.get("session_id")
    if not session_id:
        return jsonify({"error": "Missing session_id"}), 400

    file = request.files['file']
    df = pd.read_csv(file)
    USER_SESSIONS[session_id] = {
        "df": df,
        "last_df": df.copy(),
        "timestamp": time.time()
    }
    return jsonify({"columns": df.columns.tolist()})

@app.route("/preview", methods=["POST"])
def preview():
    data = request.json
    session_id = data.get("session_id")
    page = data.get("page", 0)

    if session_id not in USER_SESSIONS:
        return jsonify({"error": "Invalid session_id"}), 400

    df = USER_SESSIONS[session_id]["df"]
    start = page * 100
    end = start + 100
    preview_data = df.iloc[start:end].to_dict(orient="records")
    total_rows = len(df)

    return jsonify({"data": preview_data, "page": page, "total": total_rows})

@app.route("/transform", methods=["POST"])
def transform():
    data = request.json
    session_id = data.get("session_id")
    if not session_id or session_id not in USER_SESSIONS:
        return jsonify({"error": "Invalid or missing session_id"}), 400

    session = USER_SESSIONS[session_id]
    df = session["df"]
    session["last_df"] = df.copy()
    col = data.get("column")
    op = data.get("operation")
    args = data.get("args", {})

    if op == "Drop Column":
        df = drop_column(df, col)
    elif op == "Rename Column":
        df = rename_column(df, col, args.get("new_name"))
    elif op == "Drop Duplicates":
        df = drop_duplicates(df)
    elif op == "Fill Missing Values":
        df = fill_missing(df, col, args.get("method"))
    elif op == "Drop Rows with Missing Values":
        df = drop_rows_with_missing(df, col)
    elif op == "Convert Data Type":
        df = convert_dtype(df, col, args.get("dtype"))
    elif op == "Trim Spaces":
        df = trim_spaces(df, col)
    elif op == "Lowercase Text":
        df = lowercase_text(df, col)
    elif op == "Uppercase Text":
        df = uppercase_text(df, col)
    elif op == "Replace String":
        df = replace_string(df, col, args.get("to_replace"), args.get("replacement"))
    elif op == "Remove Character":
        df = remove_character(df, col, args.get("character"))
    elif op == "Extract Year from Date":
        df = extract_year(df, col, args.get("new_col_name"))
    elif op == "Extract Month from Date":
        df = extract_month(df, col, args.get("new_col_name"))
    elif op == "Sort by Column":
        df = sort_by_column(df, col, ascending=args.get("ascending", True))
    elif op == "Filter Rows":
        df = filter_rows(df, col, args.get("condition"), args.get("value"))
    elif op == "Group By + Aggregate":
        df = group_by_aggregate(df, args.get("group_column"), args.get("agg_column"), args.get("agg_func"))
    elif op == "Create New Column":
        df = add_new_column(df, args.get("col1"), args.get("col2"), args.get("operation"), args.get("new_col_name"))
    elif op == "Filter by Values":
        df = filter_by_values(df, col, args.get("values", []))
    elif op == "Drop Rows by Values":
        df = drop_rows_by_values(df, col, args.get("values", []))
    elif op == "Numeric Range Filter":
        df = filter_by_numeric_range(df, col, float(args.get("min")), float(args.get("max")))
    elif op == "Date Range Filter":
        df = filter_by_date_range(df, col, args.get("start_date"), args.get("end_date"))
    elif op == "Map Values":
        df = map_values(df, col, args.get("mapping", {}))
    elif op == "Count Distinct Values":
        df = count_distinct_values(df, col)
    elif op == "Filter by Boolean":
        df = filter_by_boolean(df, col, args.get("value"))

    session["df"] = df
    return jsonify({"success": True})

@app.route("/revert", methods=["POST"])
def revert():
    data = request.json
    session_id = data.get("session_id")
    if not session_id or session_id not in USER_SESSIONS:
        return jsonify({"error": "Invalid or missing session_id"}), 400

    session = USER_SESSIONS[session_id]
    session["df"] = session["last_df"].copy()
    return jsonify({"success": True})

@app.route("/download", methods=["POST"])
def download():
    session_id = request.json.get("session_id")
    if not session_id or session_id not in USER_SESSIONS:
        return jsonify({"error": "Invalid or missing session_id"}), 400

    df = USER_SESSIONS[session_id]["df"]
    csv_data = df.to_csv(index=False)
    return send_file(
        io.BytesIO(csv_data.encode()),
        mimetype='text/csv',
        download_name='transformed.csv',
        as_attachment=True
    )

if __name__ == "__main__":
    app.run(debug=True)
