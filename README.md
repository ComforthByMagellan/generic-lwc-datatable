# Overview

When you use the standard lightning-datatable on a LWC you need you configure the columns in your javascript file, like this : 
<p align="center">
  <img src="/img/hardColumns.PNG" alt="Account Data" width="738">
</p>

And then you have to use a method to retrieve your data with different solutions.
The proposition here is to configure the columns in a custom metadata, and then to create a dynamic SOQL request based on the column created with the metadatatable to retrieve the datas.


Technical components :

- Apex Class controller - DataTableController.cls 
- Generic Lwc javascript controller : listUtils
- Custom metadata types : LWCList__mdt and LWCListColumn__mdt
- An example of a LWC component that display an AccountDatatable : lwtAccountDataTable

## Custom metadata types configuration

When you want to create a new custom list of Salesforce Objects with a lightning web component, you can configure it with these two metadatatypes.
- The LWCList_mdt allow you to configure which object you want to display and other parameters explained here :

Field | Description
--- | ---
Limit | Optional parameter if you want to add a limit to the number of records returned.
SObject | The Sobject on which you want to perform a retrieve.
WhereClause | The where clause condition to add to the query.

- Then you need to configure the differents columns of your table with the LWCListColumns__mdt custom metadata types, using these fields : 

Field | Description
--- | ---
Label | A label to the custom metadata input
TBR LWC List Field Name | The API name of the custom metadata input, you can use this convention : SOBJECT_TheNameOfTheColumn
TBR LWC List | A lookup field to the parent custom metadata (TBR_LWC_List) 
Label | The label of the column in the lwc component
ApiName | The apiname of the field you want to query
Type | The type of the field you want to retrieve, the possible values are (text, boolean, hyperlink, date, picklist, url)
Url Object | If you select the value "url" in the type field, you must configure this field, to tell on which object you want to redirect
Url field | If you select the value "url" in the type field, you must configure this field, to tell on which field of the object you want to redirect
Sortable | Boolean to configure whether the column is sortable or not
Searchable | Boolean to configure whether the column is searchable or not
DataTable Column | Boolean to configure whether the column is visible or not in the lwc component. Use it to configure columns for backend manipulation purposes (exemple Salesforce Ids).
Ordre | Use it to choose the order of the differents columns. If you configure a technical columns (Datatable Column = false) you have to leave this field empty.


## Test the generic component

In vscode, connect to one of your sandbox and launch this command : 
sfdx force:source:deploy -x ./manifest/manifest.xml -u <yoursandboxalias>

Then in your sandbox, add the lwc 'lwcAccountDataTable' wherever you want on your app, default record home page for example.
You should see your account data, with the two columns configured in the LWCList_Column__mdt table : 
<p align="center">
  <img src="/img/example.PNG" alt="Account Data" width="738">
</p>
