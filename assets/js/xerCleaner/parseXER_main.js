//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// XER text parsing functions
//>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>



  // eslint-disable-next-line no-unused-vars
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
    
    const blnChkClearJunk = document.getElementById("chk-Clear-Junk").value;
    
    //if clear junk is checked, wipe the tables in the array
    if (blnChkClearJunk){
      const arrJunkTablesToClear = [`POBS`, `RISKTYPES`];

      for (let i = 0; i < arrJunkTablesToClear.length; i++)
        {
            clearTable(xerDictionary,arrJunkTablesToClear[i]);
        }
    }
    
    //if clear UDF is checked, wipe the tables in the array
    const blnChkClearUDF = document.getElementById("chk-Clear-UDF").value;
    if (blnChkClearUDF){
      const arrUDFTablesToClear = [`UDFVALUE`, `UDFTYPE`];

      for (let i = 0; i < arrUDFTablesToClear.length; i++)
        {
            clearTable(xerDictionary,arrUDFTablesToClear[i]);
        }
    }
    
    //if clear other tables is checked, wipe the tables in the array
    const blnChkClearOther = document.getElementById("chk-Clear-Other").value;
    if (blnChkClearOther){
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

      for (let i = 0; i < arrOtherTablesToClear.length; i++)
        {
            clearTable(xerDictionary,arrOtherTablesToClear[i]);
        }
    }

    //if Tag Tables is checked, add the tag
    const blnTagTables = document.getElementById("chk-Tag-Tables").value;
    if(blnTagTables){
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
        
        try{
            xerDictionary.set(tbl0,tagXERTable(xerDictionary.get(tbl0),tbl1,strTagValue));

        // eslint-disable-next-line no-empty
        }	catch(err){}
      }
    }
    
    
    var strNewXER = xerHeader;
    
    for (const v of xerDictionary.values()) {
      //console.log(v);
      strNewXER += v;
        }
    
    if (strNewXER.substring(strNewXER.length - 2, strNewXER.length) != '%E' ){
      strNewXER += '%E';
    }
    document.getElementById("inputTextToSave").value = strNewXER;
  } 
  

  //Sets string passed in from dictionary to empty
  function clearTable(dictionary, tableName) {
    //clear table
    try {
      dictionary.set(tableName, ``);
    // eslint-disable-next-line no-empty
    } catch (err) {}
  }
  
  
  
  // eslint-disable-next-line no-unused-vars
  function arrayTablesFromXER(xerText) {
    //passes XER in and creates a key/value Map with key as table name and value as the SQL of the table element from %T to last %R
    const loadedText = document.getElementById("inputTextToSave").value;
    const strTableDelimiter = `%T`;
    const arrXERTables = loadedText.split(strTableDelimiter);
    const dict = new Map(); //new Object();  //create `dictionary` object
  
    for (let i = 1; i < arrXERTables.length; i++) {
      let strTableName = arrXERTables[i]
        .substring(1, arrXERTables[i].search("%F"))
        .trim();
  
      let strTableData = strTableDelimiter + arrXERTables[i];
      dict.set(strTableName, strTableData);
    }
  
    return dict;
  }
  
  function tagXERTable(strTableData, strFieldToTag, strTagText) {
    //function which tags a field in a table (passed in as a string) with a string provided then returns the changed table string
  
    //vars for delimeter characters
    const newLine = "\n";
    const strTab = "\t";
  
    //create arrRows array by splitting table data by newline character
    const arrTableSplitIntoRows = strTableData.split(newLine);
  
    //create output string and populate it with top row of table (arrRows[0])
    let strOutput = arrTableSplitIntoRows[0];
  
    //create array for
    let arrTableRowsSplitIntoColumns = [];
  
    //loop through arrTableRows array and push each row onto array
    //arrTableColumns split by tab character
    //start at 1 as top row not required
    for (let l = 1; l < arrTableSplitIntoRows.length; l++) {
      arrTableRowsSplitIntoColumns.push(
        l,
        arrTableSplitIntoRows[l].split(strTab)
      );
    }
  
    //Start of return string - top two rows of table
    strOutput =
      strOutput +
      newLine +
      arrTableRowsSplitIntoColumns[1].join(strTab) +
      newLine;
  
    //Find Column to Tag in top row of arrTableColumns array
    const iColumnToTag = arrTableRowsSplitIntoColumns[1].indexOf(strFieldToTag);
  
    //loop through each of the split row arrays
    for (let l = 2; l < arrTableRowsSplitIntoColumns.length - 1; l++) {
      //assign current row to array
      let arrCurrentRowCellsArray = arrTableRowsSplitIntoColumns[l];
  
      //change the value in the column to tag
      arrCurrentRowCellsArray[iColumnToTag] =
        strTagText + "_" + arrCurrentRowCellsArray[iColumnToTag];
  
      //loop through row cells and add them to string separated by tabs
      //(can`t get array join to work)
      for (let x = 0; x < arrCurrentRowCellsArray.length; x++) {
        if (x + 1 == arrCurrentRowCellsArray.length) {
          strOutput = strOutput + arrCurrentRowCellsArray[x] + newLine;
        } else {
          strOutput = strOutput + arrCurrentRowCellsArray[x] + strTab;
        }
      }
  
      //strOutput = strOutput + strTab;
  
      //strOutput = strOutput  +  (arrCurrentRowCellsArray.join(strTab));
    }
  
    return strOutput;
  }
  