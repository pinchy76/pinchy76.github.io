//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// XER text parsing functions
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

function xerParser() {
  // create dictionary from XER with key values of table names and table contents
  const xerHeader = document
    .getElementById("inputTextToSave")
    .value.substring(
      1,
      document.getElementById("inputTextToSave").value.search(`%T`)
    );

  const xerDictionary = arrayTablesFromXER(
    document.getElementById("inputTextToSave").value
  );

  const optChkClearJunk = document.querySelector(
    'input[name="junkOption"]:checked'
  ).value;

  if (optChkClearJunk == "Remove") {
    const arrJunkTablesToClear = [`POBS`, `RISKTYPES`];

    for (let i = 0; i < arrJunkTablesToClear.length; i++) {
      clearTable(xerDictionary, arrJunkTablesToClear[i]);
    }
  }

  const optChkClearUDF = document.querySelector(
    'input[name="udfOption"]:checked'
  ).value;

  if (optChkClearUDF == "Remove") {
    const arrUDFTablesToClear = [`UDFVALUE`, `UDFTYPE`];

    for (let i = 0; i < arrUDFTablesToClear.length; i++) {
      clearTable(xerDictionary, arrUDFTablesToClear[i]);
    }
  }

  const optChkClearNon = document.querySelector(
    'input[name="nonCodeOption"]:checked'
  ).value;

  if (optChkClearNon == "Remove") {
    const arrOtherTablesToClear = [
      `APPLYACTOPTIONS`,
      `DOCCATG`,
      `DOCUMENT`,
      `LOCATION`,
      `MEMOTYPE`,
      `NONWORK`,
      `PCATTYPE`,
      `PCATVAL`,
      `PHASE`,
      `PROJTHRS`,
      `PROJPCAT`,
      `PROJISSU`,
      `ROLERATE`,
      `TASKDOC`,
      `TASKMEMO`,
      `TASKNOTE`,
      `WBSBUDG`,
      `WBSMEMO`,
      `WBSSTEP`
    ];

    for (let i = 0; i < arrOtherTablesToClear.length; i++) {
      clearTable(xerDictionary, arrOtherTablesToClear[i]);
    }
  }

  const optChkClearTag = document.querySelector(
    'input[name="taggingOption"]:checked'
  ).value;

  if (optChkClearTag == "Tag") {
    const strTagValue = document.getElementById("inputTagValue").value;
    const arrTagTables = [
      [`CALENDAR`, `clndr_name`],
      [`ROLES`, `role_short_name`],
      [`RSRC`, `rsrc_short_name`],
      [`RSRCCURVDATA`, `curv_name`],
      [`RSRCROLE`, `rsrc_short_name`],
      [`PROJECT`, `proj_short_name`],
      [`RCATVAL`, `rsrc_catg_short_name`],
      [`ACTVTYPE`, `actv_code_type`]
    ];

    for (let i = 0; i < arrTagTables.length; i++) {
      let tbl0 = arrTagTables[i][0];
      let tbl1 = arrTagTables[i][1];

      try {
        xerDictionary.set(
          tbl0,
          tagXERTable(xerDictionary.get(tbl0), tbl1, strTagValue)
        );
      } catch (err) {}
    }
  }

  var strNewXER = xerHeader;

  for (const v of xerDictionary.values()) {
    strNewXER += v;
  }

  if (strNewXER.substring(strNewXER.length - 2, strNewXER.length) != "%E") {
    strNewXER += "%E";
  }
  document.getElementById("inputTextToSave").value = strNewXER;
}

// Clears table contents in the dictionary.
function clearTable(dictionary, tableName) {
  try {
    dictionary.set(tableName, ``);
  } catch (err) {}
}

function arrayTablesFromXER(xerText) {
  const loadedText = document.getElementById("inputTextToSave").value;
  const strTableDelimiter = `%T`;
  const arrXERTables = loadedText.split(strTableDelimiter);

  const dict = new Map();

  for (let i = 1; i < arrXERTables.length; i++) {
    let strTableName = arrXERTables[i]
      .substring(1, arrXERTables[i].search("%F"))
      .trim();

    let strTableData = strTableDelimiter + arrXERTables[i];
    dict.set(strTableName, strTableData);
  }

  return dict;
}

// REVISED tagXERTable function using parseRowIgnoringTabsInQuotes()
function tagXERTable(strTableData, strFieldToTag, strTagText) {
  const newLine = "\n";
  // Split the table data into rows.
  const arrRows = strTableData.split(newLine);

  // Build the output, starting with the first two rows (table header and field names)
  let strOutput = "";
  if (arrRows.length > 0) {
    strOutput += arrRows[0] + newLine;
  }
  if (arrRows.length > 1) {
    strOutput += arrRows[1] + newLine;
  }

  // Use the new helper function to parse the header row
  const headerColumns = parseRowIgnoringTabsInQuotes(arrRows[1]);
  const iColumnToTag = headerColumns.indexOf(strFieldToTag);

  // Process the remaining rows, starting at index 2.
  for (let i = 2; i < arrRows.length; i++) {
    if (!arrRows[i].trim()) continue; // Skip empty lines.
    // **** CHANGED: Instead of using split("\t"), we now use parseRowIgnoringTabsInQuotes() ****
    let rowColumns = parseRowIgnoringTabsInQuotes(arrRows[i]);
    if (iColumnToTag !== -1 && iColumnToTag < rowColumns.length) {
      rowColumns[iColumnToTag] = strTagText + "_" + rowColumns[iColumnToTag];
    }
    strOutput += rowColumns.join("\t") + newLine;
  }

  return strOutput;
}

/**
 * Parses a tab-delimited row while ignoring tab characters that appear inside double quotes.
 * When a tab is found inside quoted text, it is replaced with a space.
 *
 * @param {string} row - A single line from the XER file.
 * @returns {string[]} An array of fields from the row.
 */
function parseRowIgnoringTabsInQuotes(row) {
  const result = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      // Check for escaped quotes (e.g., double double-quotes inside a quoted field)
      if (inQuotes && row[i + 1] === '"') {
        currentField += '"';
        i++; // Skip the next quote.
      } else {
        inQuotes = !inQuotes;
        currentField += char; // Optionally omit this if you don’t want quotes in the output.
      }
    } else if (char === "\t") {
      if (inQuotes) {
        // Replace tab inside quotes with a space.
        currentField += " ";
      } else {
        result.push(currentField);
        currentField = "";
      }
    } else {
      currentField += char;
    }
  }
  result.push(currentField);
  return result;
}