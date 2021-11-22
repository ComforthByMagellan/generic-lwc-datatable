import { LightningElement, track } from "lwc";
import { getSObjects  } from 'c/listUtils';
export default class listContainer extends LightningElement {
    @track error;
    sortBy;
    recordsFromBD = [];
    @track records;
    errorMsg;
    recordsInPageText = '100';
    recordsInPage = 100;
    currentPage = 1;
    numberOfPages = 1;
    @track columns;
    timeoutId;
    spinner = true;
    searchvalue;
    listView;
    lines = "Lignes";
    outOf = "sur";
    selectedRows;
    searchableColumns = [];
    refresh = false;
    disableRefresh = true;
    filteredRecords = [];

    get options() {
        return [
            { label: '50', value: '50' },
            { label: '100', value: '100' },
            { label: '200', value: '200' }
        ];
    }

    connectedCallback(){
        getSObjects('LWC_Accounts',null).then((result) => {
            this.columns = result.columns;
            this.recordsFromBD = result.recordsFromBD;
            this.searchableColumns = result.searchableColumns;
            this.dataTreatment(this.recordsFromBD);
            let myevent = {'detail':{'fieldName':'Name','sortDirection':'asc'}};
            this.handleSortdata(myevent);
        }).catch(error => {
            console.error('error : ' + error);
        });
    }
    disabledButton = true;

    enableButton() {
        const getselected = this.template.querySelector("lightning-datatable").getSelectedRows();
        this.selectedRows = this.template.querySelector("lightning-datatable").getSelectedRows();
        this.disabledButton = getselected.length == 0;
    }

    dataTreatment(records) {
        if (records !== undefined) {
            this.recordsLength = records.length;
            // reset numberOfPages to 1
            if (this.recordsInPage === 0 || this.recordsInPage === "") {
                this.numberOfPages = 1;
            } else if (this.recordsLength <= this.recordsInPage) {
                // reset numberOfPages & currentPage to 1
                this.numberOfPages = 1;
                this.currentPage = 1;
            } else if (this.recordsLength > this.recordsInPage) {
                //calculate number of all pages from the size of records
                this.numberOfPages = Math.ceil(this.recordsLength / this.recordsInPage);
                this.currentPage = 1;
            }
            //get the range  of records from  currentPage , recordsInPage
            this.records = records.slice(this.currentPage * this.recordsInPage - this.recordsInPage, this.currentPage * this.recordsInPage);
        }
        this.spinner = false;
    }
    handlrecordsInPage(event) {
        this.recordsInPage = event.detail.value;
        //Preparing data with the new value of lines to print
        if (this.recordsInPage !== "" && this.recordsFromBD !== undefined) {
            this.dataTreatment(this.recordsFromBD);
        }
        if (this.recordsInPage == "" || this.recordsInPage == "0") {
            this.numberOfPages = 1;
            this.currentPage = 1;
        }
    }

    handelPrevious() {
        if (this.currentPage !== 1) {
            this.currentPage -= 1;
            //get the range  of records from  currentPage , recordsInPage
            this.records = this.recordsFromBD.slice(this.currentPage * this.recordsInPage - this.recordsInPage, this.currentPage * this.recordsInPage);
        }
    }
    handelForward() {
        if (this.currentPage !== this.numberOfPages) {
            this.currentPage += 1;
            //get the range  of records from  currentPage , recordsInPage
            this.records = this.recordsFromBD.slice(this.currentPage * this.recordsInPage - this.recordsInPage, this.currentPage * this.recordsInPage);
        }
    }

    handleSortdata(event) {
        if (this.records !== undefined) {
            var fieldToUse;
            var colObject = this.columns.filter((a) => a.fieldName === event.detail.fieldName);
            if(colObject[0].type == 'url'){
                this.sortBy = event.detail.fieldName;
                fieldToUse = colObject[0].label;
            }else{
                this.sortBy = fieldToUse = event.detail.fieldName;
            }

            // sort direction
            this.sortDirection = event.detail.sortDirection;

            // calling sortdata function to sort the data based on direction and selected field
            this.sortData(fieldToUse, event.detail.sortDirection);
        }
    }

    sortData(fieldname, direction) {
        // serialize the data before calling sort function
        let parseData = JSON.parse(JSON.stringify(this.records));

        // Return the value stored in the field
        let keyValue = (a) => {
            return typeof a[fieldname] === "boolean" ? a[fieldname] : a[fieldname]?.toLowerCase();
        };

        // cheking reverse direction
        let isReverse = direction === "asc" ? 1 : -1;

        // sorting data
        parseData.sort((x, y) => {
            x = keyValue(x) ? keyValue(x) : ""; // handling null values
            y = keyValue(y) ? keyValue(y) : "";

            // sorting values based on direction
            return isReverse * ((x > y) - (y > x));
        });

        // set the sorted data to data table data
        this.records = parseData;
    }

    search() {
        if (this.searchvalue != "") {
            let regex = new RegExp(this.searchvalue, "gi");
            this.dataTreatment(
                this.recordsFromBD.filter((row) => {
                    let z = false;
                    this.columns.forEach((col) => {
                        z |= regex.test(col.typeAttributes ? row[col.typeAttributes.label.fieldName] : row[col.fieldName]);
                    });
                    return z;
                })
            );
        } else {
            this.dataTreatment(this.recordsFromBD);
        }
        this.stimeoutId = undefined;
    }

    handleFiltres(event){
        switch (event.target.name) {
            case 'search':this.searchvalue = event.target.value;break;
            case 'recordsInPage': this.recordsInPage = parseInt(event.detail.value);break;
            case 'refresh': this.refresh = true;break;
            default:
        }
            
        if(this.refresh){
            let regex = new RegExp(this.searchvalue, "gi");
            this.filteredRecords = this.recordsFromBD
                .filter((row) => {
                    let z = false;
                    this.searchableColumns.forEach((col) => {
                        z |= regex.test(col.typeAttributes ? row[col.typeAttributes.label.fieldName] : row[col.fieldName]);
                    });
                    return (z || !this.searchvalue);
                });
            this.dataTreatment(this.filteredRecords);
            this.refresh = false;
            this.disableRefresh = true;
        }else{
            this.disableRefresh = false;
        }
    }
}
