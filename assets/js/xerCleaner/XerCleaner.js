// ===== Global Variables =====

// Maximum allowed file size (in MB)
const MAX_FILE_SIZE_MB = 49;
// Keep a reference to the selected file
let selectedFile = null;

// ===== Event Listeners =====

document.getElementById("filePicker").addEventListener("change", (e) => {
  selectedFile = e.target.files[0];
  if (selectedFile) {
    document.getElementById("inputTextToSave").value =
      "File selected: " + selectedFile.name;
  }
});

document.getElementById("runCleaner").addEventListener("click", () => {
  // Gather options from the UI
  const deletePOBS = document.getElementById("deletePOBS").checked;
  const deleteRiskTypes = document.getElementById("deleteRiskTypes").checked;
  const taggingOption = document.querySelector(
    'input[name="taggingOption"]:checked'
  ).value;
  const tagValue = document.getElementById("inputTagValue").value;

  const options = { deletePOBS, deleteRiskTypes, taggingOption, tagValue };

  processXERFile(options).catch((err) =>
    console.error("Error processing file:", err)
  );
});

document.getElementById("saveXERFile").addEventListener("click", saveTextAsFile);

// ===== Main Processing Function =====

/**
 * Processes the XER file using a streaming approach.
 * Reads the file line by line and builds the cleaned output.
 *
 * @param {Object} options - The cleaning options.
 *   options.deletePOBS: boolean – whether to delete table "POBS"
 *   options.deleteRiskTypes: boolean – whether to delete table "RISKTYPES"
 *   options.taggingOption: string – if "Tag", then tagging is applied
 *   options.tagValue: string – the tag value to use
 *
 * @returns {Promise<string>} The cleaned XER data (also output in the UI)
 */
async function processXERFile(options) {
  if (!selectedFile) {
    alert("Please select a file first.");
    return;
  }

  // Check file size (MB)
  const fileSizeMB = selectedFile.size / (1024 * 1024);
  if (fileSizeMB > MAX_FILE_SIZE_MB) {
    alert(
      `File is too large! Maximum allowed size is ${MAX_FILE_SIZE_MB} MB. Your file is ${fileSizeMB.toFixed(
        2
      )} MB.`
    );
    return;
  }

  // We’ll build the cleaned output in this variable.
  // (For very large files you might consider streaming the output to avoid building one huge string.)
  let cleanedOutput = "";

  // Create a reader for the file’s stream
  const reader = selectedFile.stream().getReader();
  const decoder = new TextDecoder("utf-8");

  // A buffer to hold incomplete lines
  let buffer = "";

  // The XER file is organized into sections: a header (before the first table marker),
  // then a series of tables (starting with lines beginning with "%T").
  // We use a simple state machine:
  let state = "header"; // "header" or "table"
  let currentTableName = "";
  let currentTableLines = []; // accumulate lines for the current table

  // Process the stream chunk by chunk
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    // Split the buffer into lines (a line is assumed to be terminated by "\n")
    let lines = buffer.split("\n");
    // The last element may be an incomplete line; keep it in the buffer.
    buffer = lines.pop();

    for (let line of lines) {
      // Process each line according to our state
      if (state === "header") {
        if (line.startsWith("%T")) {
          // We've reached the first table. Write out the header we’ve accumulated.
          // (The header may include the %X header and any text before the first %T.)
          // Then begin a new table.
          state = "table";
          currentTableLines = [];
          currentTableLines.push(line);
          currentTableName = extractTableName(line);
        } else {
          // Still in header; pass through
          cleanedOutput += line + "\n";
        }
      } else if (state === "table") {
        if (line.startsWith("%T")) {
          // A new table is starting.
          // Process (clean) the current table and append it to the output:
          cleanedOutput += processTableData(currentTableName, currentTableLines, options);
          // Reset for the new table:
          currentTableLines = [line];
          currentTableName = extractTableName(line);
        } else {
          // Still in the current table – accumulate the line.
          currentTableLines.push(line);
        }
      }
    }

    if (done) break;
  }

  // Process any remaining text in the buffer
  if (buffer) {
    if (state === "header") {
      cleanedOutput += buffer + "\n";
    } else if (state === "table") {
      currentTableLines.push(buffer);
    }
  }

  // Flush the last table if one is being processed.
  if (state === "table" && currentTableLines.length > 0) {
    cleanedOutput += processTableData(currentTableName, currentTableLines, options);
  }

  // Ensure the final output ends with the end marker ("%E")
  if (!cleanedOutput.trim().endsWith("%E")) {
    cleanedOutput += "\n%E";
  }

  // Output the cleaned XER to the UI
  document.getElementById("inputTextToSave").value = cleanedOutput;
  return cleanedOutput;
}

/**
 * Extracts the table name from a "%T" line.
 * Assumes the line is tab-separated and that the table name is the second element.
 *
 * @param {string} line - The line beginning with "%T".
 * @returns {string} The table name (or empty string if not found).
 */
function extractTableName(line) {
  const parts = line.split("\t");
  return parts.length > 1 ? parts[1].trim() : "";
}

/**
 * Processes an entire table’s lines according to the cleaning options.
 *
 * @param {string} tableName - The name of the table.
 * @param {string[]} tableLines - The lines that make up this table.
 * @param {Object} options - The cleaning options.
 * @returns {string} The (possibly modified) table text.
 */
function processTableData(tableName, tableLines, options) {
  // If the table is to be deleted (for example, POBS or RISKTYPES)
  if (
    (options.deletePOBS && tableName === "POBS") ||
    (options.deleteRiskTypes && tableName === "RISKTYPES")
  ) {
    // Return an empty string to effectively remove this table.
    return "";
  }

  // If tagging is enabled and this table is one of those that require tagging,
  // process the tagging.
  const tablesToTag = ["CALENDAR", "ROLES", "RSRC", "PROJECT"];
  if (options.taggingOption === "Tag" && options.tagValue && tablesToTag.includes(tableName)) {
    // Map over the table lines.
    return tableLines
      .map((line) => {
        // Only change row data lines – typically these start with "%R"
        if (line.startsWith("%R")) {
          const columns = line.split("\t");
          // For example, modify the second column. (Adjust the index as needed.)
          if (columns.length > 1) {
            columns[1] = `${options.tagValue}_${columns[1]}`;
          }
          return columns.join("\t");
        }
        return line;
      })
      .join("\n") + "\n";
  }

  // Otherwise, return the table unchanged.
  return tableLines.join("\n") + "\n";
}

// ===== Save File Function =====

function saveTextAsFile() {
  const textToSave = document.getElementById("inputTextToSave").value;
  const blob = new Blob([textToSave], { type: "text/plain" });
  const downloadLink = document.createElement("a");
  downloadLink.download = "Cleaned_XER.xer";
  downloadLink.href = window.URL.createObjectURL(blob);
  downloadLink.click();
}