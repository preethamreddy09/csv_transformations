// script.js
let columns = []
const session_id = crypto.randomUUID();
let currentPage = 0;
let totalRows = 0;

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0 fade show mb-2`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function renderTable(data) {
    if (data.length === 0) return;
    let html = '<table class="table table-dark table-bordered table-sm fade-in"><thead><tr>';
    Object.keys(data[0]).forEach(col => html += `<th>${col}</th>`);
    html += '</tr></thead><tbody>';
    data.forEach(row => {
        html += '<tr>';
        Object.values(row).forEach(val => html += `<td>${val}</td>`);
        html += '</tr>';
    });
    html += '</tbody></table>';
    document.getElementById('preview').innerHTML = html;
    document.getElementById('prevBtn').disabled = currentPage === 0;
    document.getElementById('nextBtn').disabled = ((currentPage + 1) * 100 >= totalRows);
}

function fetchPreview(page = 0) {
    fetch('/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id, page })
    })
    .then(res => {
        if (!res.ok) throw new Error('Failed to fetch preview');
        return res.json();
    })
    .then(data => {
        currentPage = data.page;
        totalRows = data.total;
        renderTable(data.data);
    })
    //.catch(() => showToast('Failed to load preview', 'danger'));
}

function changePage(direction) {
    const nextPage = currentPage + direction;
    if (nextPage >= 0) {
        fetchPreview(nextPage);
    }
}

function generateExtraFields(op) {
    const extra = document.getElementById('extra-fields');
    extra.innerHTML = '';
    const inputs = {
        "Rename Column": '<input class="form-control my-2" placeholder="New Column Name" id="new_name">',
        "Fill Missing Values": `<select class="form-select my-2" id="method">
                                    <option>zero</option><option>mean</option><option>mode</option>
                                </select>`,
        "Convert Data Type": `<select class="form-select my-2" id="dtype">
                                    <option>int</option><option>float</option><option>str</option><option>datetime</option>
                               </select>`,
        "Replace String": '<input class="form-control my-2" placeholder="Text to replace" id="to_replace">' +
                          '<input class="form-control my-2" placeholder="Replacement" id="replacement">',
        "Remove Character": '<input class="form-control my-2" placeholder="Character to remove" id="character">',
        "Extract Year from Date": '<input class="form-control my-2" placeholder="New Column Name" id="new_col_name">',
        "Extract Month from Date": '<input class="form-control my-2" placeholder="New Column Name" id="new_col_name">',
        "Sort by Column": `<select class="form-select my-2" id="ascending">
                                <option value="true">Ascending</option>
                                <option value="false">Descending</option>
                            </select>`,
        "Filter Rows": '<input class="form-control my-2" placeholder="Condition (equals/contains/starts_with)" id="condition">' +
                       '<input class="form-control my-2" placeholder="Value" id="value">',
        "Group By + Aggregate": `<input class="form-control my-2" placeholder="Group Column" id="group_column">` +
                                 `<input class="form-control my-2" placeholder="Aggregate Column" id="agg_column">` +
                                 `<select class="form-select my-2" id="agg_func">
                                      <option>sum</option><option>avg</option><option>count</option>
                                  </select>`,
        "Create New Column": `<input class="form-control my-2" placeholder="First Column" id="col1">` +
                              `<input class="form-control my-2" placeholder="Second Column" id="col2">` +
                              `<select class="form-select my-2" id="math_op">
                                  <option>add</option><option>subtract</option><option>multiply</option><option>divide</option>
                              </select>` +
                              `<input class="form-control my-2" placeholder="New Column Name" id="new_col_name">`,
        "Filter by Values": '<input class="form-control my-2" placeholder="Comma-separated values" id="values">',
        "Drop Rows by Values": '<input class="form-control my-2" placeholder="Comma-separated values" id="values">',
        "Numeric Range Filter": '<input class="form-control my-2" placeholder="Min Value" id="min">' +
                                '<input class="form-control my-2" placeholder="Max Value" id="max">',
        "Date Range Filter": '<input class="form-control my-2" placeholder="Start Date (YYYY-MM-DD)" id="start_date">' +
                              '<input class="form-control my-2" placeholder="End Date (YYYY-MM-DD)" id="end_date">',
        "Map Values": '<textarea class="form-control my-2" placeholder="JSON map e.g. {\"old\": \"new\"}" id="mapping"></textarea>',
        "Filter by Boolean": '<select class="form-select my-2" id="value">' +
                              '<option value="true">True</option><option value="false">False</option></select>'
    };
    extra.innerHTML = inputs[op] || '';
}

function applyTransformation() {
    const column = document.getElementById('columnSelect').value;
    const operation = document.getElementById('operationSelect').value;
    const args = {};

    if (document.getElementById('new_name')) args.new_name = document.getElementById('new_name').value;
    if (document.getElementById('method')) args.method = document.getElementById('method').value;
    if (document.getElementById('dtype')) args.dtype = document.getElementById('dtype').value;
    if (document.getElementById('to_replace')) args.to_replace = document.getElementById('to_replace').value;
    if (document.getElementById('replacement')) args.replacement = document.getElementById('replacement').value;
    if (document.getElementById('character')) args.character = document.getElementById('character').value;
    if (document.getElementById('new_col_name')) args.new_col_name = document.getElementById('new_col_name').value;
    if (document.getElementById('ascending')) args.ascending = document.getElementById('ascending').value === "true";
    if (document.getElementById('condition')) args.condition = document.getElementById('condition').value;
    if (document.getElementById('value')) args.value = document.getElementById('value').value;
    if (document.getElementById('group_column')) args.group_column = document.getElementById('group_column').value;
    if (document.getElementById('agg_column')) args.agg_column = document.getElementById('agg_column').value;
    if (document.getElementById('agg_func')) args.agg_func = document.getElementById('agg_func').value;
    if (document.getElementById('col1')) args.col1 = document.getElementById('col1').value;
    if (document.getElementById('col2')) args.col2 = document.getElementById('col2').value;
    if (document.getElementById('math_op')) args.operation = document.getElementById('math_op').value;
    if (document.getElementById('values')) args.values = document.getElementById('values').value.split(',').map(s => s.trim());
    if (document.getElementById('min')) args.min = document.getElementById('min').value;
    if (document.getElementById('max')) args.max = document.getElementById('max').value;
    if (document.getElementById('start_date')) args.start_date = document.getElementById('start_date').value;
    if (document.getElementById('end_date')) args.end_date = document.getElementById('end_date').value;
    if (document.getElementById('mapping')) {
        try {
            args.mapping = JSON.parse(document.getElementById('mapping').value);
        } catch (e) {
            showToast('Invalid JSON in mapping field', 'danger');
            return;
        }
    }

    fetch('/transform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id, column, operation, args })
    })
    .then(res => res.json())
    .then(() => {
        showToast('Transformation applied', 'success');
        fetchPreview(currentPage);
    })
    .catch(() => showToast('Error applying transformation', 'danger'));
}

function revertLastChange() {
    fetch('/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
    })
    .then(res => res.json())
    .then(() => {
        showToast('Last change reverted', 'warning');
        fetchPreview(currentPage);
    })
    .catch(() => showToast('Unable to revert', 'danger'));
}

csvFile.onchange = () => {
    if (csvFile.files[0].size > 20 * 1024 * 1024) {
        showToast('File too large. Max 20MB allowed.', 'danger');
        csvFile.value = '';
        return;
    }
    const formData = new FormData();
    formData.append('file', csvFile.files[0]);
    formData.append('session_id', session_id);
    fetch('/upload', { method: 'POST', body: formData })
    .then(res => res.json())
    .then(data => {
        columns = data.columns;
        document.getElementById('transformation-form').style.display = 'block';
        document.getElementById('downloadBtn').classList.remove('d-none');
        document.getElementById('revertBtn').classList.remove('d-none');

        const columnSelect = document.getElementById('columnSelect');
        columnSelect.innerHTML = columns.map(col => `<option>${col}</option>`).join('');

        fetch('/operations')
        .then(res => res.json())
        .then(ops => {
            const opSelect = document.getElementById('operationSelect');
            opSelect.innerHTML = ops.map(op => `<option>${op}</option>`).join('');
        });

        fetchPreview(0);
        showToast('CSV uploaded successfully', 'success');
    })
    .catch(() => showToast('Failed to upload CSV', 'danger'));
};

operationSelect.onchange = () => {
    generateExtraFields(operationSelect.value);
};

downloadBtn.onclick = () => {
    fetch('/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id })
    })
    .then(response => response.blob())
    .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transformed.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
    })
    .catch(() => showToast('Download failed', 'danger'));
};

const transformationHelp = [
    {
        name: "drop_column",
        desc: "Removes the specified column from the DataFrame.",
        example: "drop_column(df, 'age') → removes the 'age' column."
    },
    {
        name: "rename_column",
        desc: "Renames the specified column to a new name.",
        example: "rename_column(df, 'old', 'new') → renames 'old' to 'new'."
    },
    {
        name: "drop_duplicates",
        desc: "Removes duplicate rows from the DataFrame.",
        example: "drop_duplicates(df) → drops duplicate rows."
    },
    {
        name: "fill_missing",
        desc: "Fills missing values using a specified method like zero, mean, or mode.",
        example: "fill_missing(df, 'salary', 'mean') → fills NaNs with column mean."
    },
    {
        name: "drop_rows_with_missing",
        desc: "Drops rows where the specified column has missing values.",
        example: "drop_rows_with_missing(df, 'name') → drops rows with null 'name'."
    },
    {
        name: "convert_dtype",
        desc: "Converts the data type of a column.",
        example: "convert_dtype(df, 'date', 'datetime64[ns]')"
    },
    {
        name: "trim_spaces",
        desc: "Removes leading/trailing spaces from strings in a column.",
        example: "trim_spaces(df, 'city')"
    },
    {
        name: "lowercase_text",
        desc: "Converts all text in the column to lowercase.",
        example: "lowercase_text(df, 'name')"
    },
    {
        name: "uppercase_text",
        desc: "Converts all text in the column to uppercase.",
        example: "uppercase_text(df, 'name')"
    },
    {
        name: "replace_string",
        desc: "Replaces a specific substring in a column with another string.",
        example: "replace_string(df, 'address', 'St.', 'Street')"
    },
    {
        name: "remove_character",
        desc: "Removes a specific character from the strings in a column.",
        example: "remove_character(df, 'phone', '-')"
    },
    {
        name: "extract_year",
        desc: "Extracts the year from a date column into a new column.",
        example: "extract_year(df, 'dob', 'year')"
    },
    {
        name: "extract_month",
        desc: "Extracts the month from a date column into a new column.",
        example: "extract_month(df, 'dob', 'month')"
    },
    {
        name: "sort_by_column",
        desc: "Sorts the DataFrame based on a column.",
        example: "sort_by_column(df, 'score', ascending=False)"
    },
    {
        name: "filter_rows",
        desc: "Filters rows based on condition (equals, contains, starts_with).",
        example: "filter_rows(df, 'status', 'equals', 'active')"
    },
    {
        name: "group_by_aggregate",
        desc: "Groups by one column and aggregates another.",
        example: "group_by_aggregate(df, 'department', 'salary', 'mean')"
    },
    {
        name: "add_new_column",
        desc: "Creates a new column by performing arithmetic operations on two columns.",
        example: "add_new_column(df, 'price', 'tax', 'add', 'total_price')"
    },
    {
        name: "filter_by_values",
        desc: "Keeps rows where column matches any value in the list.",
        example: "filter_by_values(df, 'role', ['admin', 'user'])"
    },
    {
        name: "drop_rows_by_values",
        desc: "Drops rows where column matches any value in the list.",
        example: "drop_rows_by_values(df, 'status', ['inactive'])"
    },
    {
        name: "filter_by_numeric_range",
        desc: "Keeps rows where column is within a numeric range.",
        example: "filter_by_numeric_range(df, 'age', 18, 30)"
    },
    {
        name: "filter_by_date_range",
        desc: "Keeps rows where date column is within a date range.",
        example: "filter_by_date_range(df, 'created_at', '2023-01-01', '2023-12-31')"
    },
    {
        name: "map_values",
        desc: "Maps specific values in a column using a dictionary.",
        example: "map_values(df, 'gender', {'M': 'Male', 'F': 'Female'})"
    },
    {
        name: "count_distinct_values",
        desc: "Counts number of unique values in a column.",
        example: "count_distinct_values(df, 'email')"
    },
    {
        name: "filter_by_boolean",
        desc: "Filters rows by boolean values (True/False).",
        example: "filter_by_boolean(df, 'is_active', true)"
    }
];

window.addEventListener("DOMContentLoaded", () => {
    const helpContent = document.getElementById("helpContent");
    transformationHelp.forEach(trans => {
        const block = document.createElement("div");
        block.classList.add("mb-3");
        block.innerHTML = `
            <h6><strong>${trans.name}</strong></h6>
            <p>${trans.desc}</p>
            <pre><code>${trans.example}</code></pre>
        `;
        helpContent.appendChild(block);
    });
});
