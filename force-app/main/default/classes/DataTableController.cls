@SuppressWarnings('PMD.IfElseStmtsMustUseBraces,PMD.IfStmtsMustUseBraces')
public with sharing class DataTableController {
    public class DataTableWrapper {
        @AuraEnabled
        public List<DataTableColumns> columnWrapper { get; set; }
        @AuraEnabled
        public List<SObject> data { get; set; }
        @AuraEnabled
        public Map<String,Map<String,String>> mapPicklistValuesByField;
    }
    
    public class DataTableColumns {
        @AuraEnabled
        public String label {get;set;}
        @AuraEnabled       
        public String fieldName {get;set;}
        @AuraEnabled
        public String type {get;set;}
        @AuraEnabled
        public Boolean sortable {get;set;}
        @AuraEnabled
        public Boolean searchable {get;set;}
        @AuraEnabled
        public Boolean isVisible {get;set;}
        @AuraEnabled
        public String urlObject {get;set;}
        @AuraEnabled
        public String urlField {get;set;}
    }

    /**
     * @param listLWCName : The Name of the custom metadata list
     * The two custom metadata used are : LWC List and LWC List Columns
     * @param filteringList : to filter soql returned data with an input list (of ids for example)
     * @return A DataTableWrapper class to pass inputs in a lightning-datatable in lwc (columns + data)
     */
    @AuraEnabled
    public static DataTableWrapper retrieveSObjectList(String listLWCname, List<String> filteringList) {
        //Leave filteringList null if you don't have to filter the data with a input list (of ids for example).
        DataTableWrapper wrapper = new DataTableWrapper();
        Map<String,Map<String,String>> mapPicklistValuesByField = new Map<String,Map<String,String>>();
        List<String> listPicklistFields = new List<String>();
        String query;
        List<DataTableColumns> columns = new List<DataTableColumns>();
        LWCList__mdt lwcListParam = [SELECT Id, Limit__c, SObject__c, WhereClause__c, (SELECT id, ApiName__c, Label__c,Searchable__c, Sortable__c, Type__c, Order__c, UrlObject__c, UrlField__c, DataTableColumn__c   FROM TBR_LWCListColumns__r ORDER BY Order__c ASC NULLS FIRST) FROM LWCList__mdt WHERE DeveloperName =: listLWCname];
        try{
            if(lwcListParam != null){
                query = 'SELECT ';
                for(LWCListColumn__mdt field : lwcListParam.TBR_LWCListColumns__r){
                    if(field.Type__c == 'picklist') listPicklistFields.add(field.ApiName__c);
                    //Renseigner les colonnes du datatable (paramétrage fait depuis le custom metadata)
                    DataTableColumns col = new DataTableColumns();
                    col.label = field.Label__c;
                    col.fieldName = field.ApiName__c;
                    col.type = field.Type__c;
                    col.sortable = field.Sortable__c;
                    col.searchable = field.Searchable__c;
                    col.isVisible = field.DataTableColumn__c;
                    if(field.Type__c == 'url'){
                        col.urlObject = field.UrlObject__c;
                        col.urlField = field.UrlField__c;
                    }
                    //If it's a non visible column, add it at the begining (index 0) because we need to access to it on other functional columns.
                    columns.add(col);
                    
                    //Préparer le datatable avec une query dynamique dont les paramètres sont stockés dans un custom Metadata
                    query += field.ApiName__c + ', ';
                }
                query = query.removeEnd(', '); //remove last two chars.
                query += ' FROM ' + lwcListParam.SObject__c;
                query += (lwcListParam.WhereClause__c != null) ? ' WHERE ' + lwcListParam.WhereClause__c : '';
                query += (lwcListParam.Limit__c != null) ? ' LIMIT ' + lwcListParam.Limit__c : ''; 
            }
            List<SObject> listSobjects = Database.query(String.escapeSingleQuotes(query));

            //Retrieve the label values of picklist fields (we can't use tolabel() in the soql query becaue we need the apiname to perform actions in lwcs)
            String strObjectName = lwcListParam.SObject__c;
            Schema.SObjectType objSobjectType = Schema.getGlobalDescribe().get(strObjectName);
            Schema.DescribeSObjectResult objDescribeSobject = objSobjectType.getDescribe();
            Map<String, Schema.SObjectField> mapFields = objDescribeSobject.fields.getMap();
            for(String picklistField : listPicklistFields){
                List<Schema.PicklistEntry> lstPickListValues = mapFields.get(picklistField).getDescribe().getPickListValues();
                Map<String, String> mapPicklistLabelByValue = new Map<String, String>();
                for (Schema.PicklistEntry objPickList : lstPickListValues) {
                    mapPicklistLabelByValue.put(objPickList.getValue(),objPickList.getLabel());
                }
                mapPicklistValuesByField.put(picklistField,mapPicklistLabelByValue);
            }

            wrapper.columnWrapper = columns;
            wrapper.data = listSobjects;
            wrapper.mapPicklistValuesByField = mapPicklistValuesByField;


            return wrapper;

        } catch (System.DMLException e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
