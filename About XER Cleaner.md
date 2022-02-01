# About the Primavera XER Cleaner

## What is Primavera P6?

> Primavera is an enterprise project portfolio management software. It
> includes project management, scheduling, risk analysis, opportunity
> management, resource management, collaboration and control
> capabilities, and integrates with other enterprise software such as
> Oracle and SAP’s ERP systems. Primavera was launched in 1983 by
> Primavera Systems Inc., which was acquired by Oracle Corporation in
> 2008.
-Wikipedia
 

## What is an XER?
If you export project schedules from the Primavera P6 database they are created in a file format called an XER.
  
If you open an XER in a text editor such as notepad you will see it is a structured text file containing the data within each of the database tables.

The first row of the XER contains metadata about the XER itself, then following rows of the text file represent the elements of the database tables.  A row beginning with %T represents a table name then beneath it a row beginning with %F represents all the fields in that table.  All the rows of the tables start with %R.

The data in the XER is delimited by tabs and line breaks.
## Why do I need to *clean* an XER?
If you import a schedule into your database you may find that you end up importing data that you don't require.  This commonly occurs when a subcontractor sends a schedule to a contractor, or when a contractor sends a schedule to a client.

From a general housekeeping point of view it is good to be in control of the data in your database.  Uncontrolled importing will fill a P6 database with duplicate codes, unneeded data and junk records.  Ultimately, uncontrolled importing will affect the stability of a database and cause performance issues or worse.

## How does the tool clean?
The XER cleaner v1.0 does two things, wiping and tagging.
  
**Wiping** clears whole tables.  An earlier version of the tool has been widely tested and all tables that are wiped are safe to delete without losing important schedule information or compromising the integrity of the database.
  
**Tagging** adds a short string of characters to the beginning of certain fields.  This allows the imported information to be filtered and sorted whilst preventing duplication.
An example might be a contract schedule with a Monday to Friday calendar called `5 day working` .  You may already have a calendar in your database with this name but it describes a Wednesday to Sunday calendar.  By tagging the import to to something like `AAAA_5 day working` you can easily see which calendar is used.  
There is a five character limit on the tag string.

## And what does the tool clean?

**1. Junk data**
XERs created in some versions of P6 contain junk data that is of no use at all.  There are already tools available that erase the POBS table from XERs but the RISKTYPES table is also known for being populated with junk.

By default the POBS and RISKTYPES tables are **wiped**.

**2. User specific information**
XERs will contain user defined fields (UDF) and their values.  These fields are designed for Planners to do their jobs more easily but are usually not required by clients reviewing schedules.  Importing UDFs from multiple contractors can quickly fill your database with unwanted data.

The default option is to **wipe** UDFs but there is also the option to retain them and **tag** them.
 
**3. Unnecessary tables**
When reviewing a supplier's schedule a Planner will look at dates, sequences and durations.  They will review the scope and the logic.  They are probably not concerned with most of the data that can be stored in an XER even if the supplier is using it in the first place.

**Wiping** these tables is optional but recommended.  If they are retained they are not tagged.

**4. Remaining tables**
The remaining tables are the essential tables for retaining functionality and schedule integrity.  They include the tables of tasks, WBS elements, calendars, roles and resources and activity codes.  These are either left as they are or otherwise **tagged**.  Project specific fields like activity IDs and task names don't need tags so aren't touched.  Roles, codes, resources and calendars are tagged.

For a view of the tables that are wiped and tagged, please review the workflow document.

## Software Architecture
The XER cleaner is a browser based tool created in javascript.  All the operations are done in the browser window on the user's computer.  No XER data is uploaded to any servers.  This was a conscious decision at design stage to enable as many people to use the tool as possible.

The tool is released as open source under the MIT license.  There are options for supporting the developer (if you'd like to) on the tools homepage.



> Written with [StackEdit](https://stackedit.io/).

