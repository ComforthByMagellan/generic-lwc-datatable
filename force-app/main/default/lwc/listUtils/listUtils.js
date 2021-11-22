
import getSobjectList from "@salesforce/apex/DataTableController.retrieveSObjectList";
const SITE_URL = "/lightning/r/"; // TODO upgrade this JS to retrieve the url of the logged user.

//We nee to user an async function, which allow using the "await" keyword on the function that call the apex controller in order to wait for his response
export async function getSObjects(arg1, arg2) {
    var returnedObject;
    await getSobjectList({listLWCname: arg1, filteringList: arg2}).then((result) => {
        var recordsFromBD;
        var columns;
        var searchableColumns = [];
        columns = result.columnWrapper;
        columns = columns.map((item) => {
            var temp = Object.assign({}, item);
            if (temp.type === 'url') {
                temp.typeAttributes = {
                    label: { fieldName: item.label},
                    target: "_blank"
                };
            }
            return temp;
        });
        recordsFromBD = result.data.map((x) => {
            const row = {};
            columns.forEach((z) => {
                const path = z.fieldName;
                //On split le nom du field au niveau du . Exemple ServiceResource.Name et on parcours  la table des données json (x)  avec les valeurs splitées : 
                // example : x[ServiceResource][Name] ou x.ServiceResource.Name
                var fieldValue = path.split(".").reduce((acc, part) => acc && acc[part], x);
                row[z.fieldName] = fieldValue != null ? fieldValue : null;
                
                //If condition to store the date in local format for the download part.
                if(z.type == 'date' && fieldValue != null){
                    var d = new Date(fieldValue);
                    const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour:'2-digit', minute: '2-digit' };
                    let dateformatted = d.toLocaleDateString('fr-FR', options);
                    row[z.label] = dateformatted;
                }
                if(z.type == 'picklist' && fieldValue != null){
                    //Column with api name of picklist (will be hidden) keep this value for database action : updateOh, transfertTerritory.
                    row[z.fieldName] = fieldValue;
                    //Create a new column with picklist label for display and download.
                    row[z.label] = result.mapPicklistValuesByField[z.fieldName][fieldValue];
                }
                if(z.type == 'url' && fieldValue != null){
                    row[z.fieldName] = SITE_URL + z.urlObject + '/' + row[z.urlField] + '/view';
                    row[z.label] = fieldValue;
                }
            });
            return row;
        });

        //Parse columns and use the column with "label" suffixe to display the label values of picklist fields.
        columns = columns
        .filter((x) => {
            return x.isVisible;
        })
        .map((item) => {
            var temp = Object.assign({}, item);
            //As date fields have their label formated column, we can display it as text. 
            // Change the field name of columns of type Picklist and Date to display the row[label] which is human readable.
            if (temp.type === 'picklist' || temp.type === 'date') {
                temp.fieldName = temp.label;
                temp.type = "text";
            }
            return temp;
        });

        columns.forEach((z) => {
            if(z.searchable) searchableColumns.push(z);
        });

        returnedObject = {"columns":columns,"recordsFromBD": recordsFromBD, "searchableColumns":searchableColumns};
    });
    return returnedObject;
        
}