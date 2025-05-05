# transformations_code.py
import pandas as pd

# Existing transformations (if any)...

def drop_column(df, column):
    return df.drop(columns=[column])

def rename_column(df, column, new_name):
    return df.rename(columns={column: new_name})

def drop_duplicates(df):
    return df.drop_duplicates()

def fill_missing(df, column, method):
    if method == "zero":
        df[column] = df[column].fillna(0)
    elif method == "mean":
        df[column] = df[column].fillna(df[column].mean())
    elif method == "mode":
        df[column] = df[column].fillna(df[column].mode()[0])
    return df

def drop_rows_with_missing(df, column):
    return df[df[column].notna()]

def convert_dtype(df, column, dtype):
    try:
        df[column] = df[column].astype(dtype)
    except:
        df[column] = pd.to_datetime(df[column], errors='coerce')
    return df

def trim_spaces(df, column):
    df[column] = df[column].str.strip()
    return df

def lowercase_text(df, column):
    df[column] = df[column].str.lower()
    return df

def uppercase_text(df, column):
    df[column] = df[column].str.upper()
    return df

def replace_string(df, column, to_replace, replacement):
    df[column] = df[column].str.replace(to_replace, replacement, regex=False)
    return df

def remove_character(df, column, character):
    df[column] = df[column].str.replace(character, '', regex=False)
    return df

def extract_year(df, column, new_col):
    df[new_col] = pd.to_datetime(df[column], errors='coerce').dt.year
    return df

def extract_month(df, column, new_col):
    df[new_col] = pd.to_datetime(df[column], errors='coerce').dt.month
    return df

def sort_by_column(df, column, ascending=True):
    return df.sort_values(by=column, ascending=ascending)

def filter_rows(df, column, condition, value):
    if condition == "equals":
        return df[df[column] == value]
    elif condition == "contains":
        return df[df[column].astype(str).str.contains(value)]
    elif condition == "starts_with":
        return df[df[column].astype(str).str.startswith(value)]
    return df

def group_by_aggregate(df, group_col, agg_col, agg_func):
    return df.groupby(group_col)[agg_col].agg(agg_func).reset_index()

def add_new_column(df, col1, col2, operation, new_col):
    if operation == "add":
        df[new_col] = df[col1] + df[col2]
    elif operation == "subtract":
        df[new_col] = df[col1] - df[col2]
    elif operation == "multiply":
        df[new_col] = df[col1] * df[col2]
    elif operation == "divide":
        df[new_col] = df[col1] / df[col2]
    return df

# -------------------- NEW TRANSFORMATIONS --------------------

def filter_by_values(df, column, values):
    return df[df[column].isin(values)]

def drop_rows_by_values(df, column, values):
    return df[~df[column].isin(values)]

def filter_by_numeric_range(df, column, min_val, max_val):
    return df[(df[column] >= min_val) & (df[column] <= max_val)]

def filter_by_date_range(df, column, start_date, end_date):
    df[column] = pd.to_datetime(df[column], errors='coerce')
    return df[(df[column] >= pd.to_datetime(start_date)) & (df[column] <= pd.to_datetime(end_date))]

def map_values(df, column, mapping_dict):
    return df.replace({column: mapping_dict})

def count_distinct_values(df, column):
    return pd.DataFrame({column: [df[column].nunique()]})

def filter_by_boolean(df, column, value):
    bool_val = True if str(value).lower() in ["true", "1"] else False
    return df[df[column] == bool_val]
