import { LightningElement, api, track, wire } from 'lwc';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import { updateRecord } from 'lightning/uiRecordApi';
import { refreshApex } from '@salesforce/apex';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import { MessageContext, publish } from 'lightning/messageService';

const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';

export default class BoatSearchResults extends LightningElement {
    @track selectedBoatId;
    @track columns = [
        { label: 'Name', fieldName: 'Name', editable: true },
        { label: 'Length', fieldName: 'Length__c', editable: true },
        { label: 'Price', fieldName: 'Price__c', type:"currency", editable: true },
        { label: 'Description', fieldName: 'Description__c', editable: true },
    ];
    boatTypeId = '';
    @track boats = {data:[]};
    @track isLoading = false;
    @track draftValues = [];
  
    // wired message context
    @wire(MessageContext)
        messageContext;

    @track data = undefined;
    @track error = undefined;
    
    @api
    searchBoats(boatTypeId){
        this.isLoading = true;
        this.notifyLoading(this.isLoading);
        this.boatTypeId = boatTypeId;
    }

    @wire(getBoats, {boatTypeId: '$boatTypeId'})
    wiredBoats({data, error}){   
        if(data){
            this.boats = {data: data}
            this.error = undefined;
        }else if(error){
            this.data = undefined;
            this.error = error;
        }
        this.isLoading = false;
        this.notifyLoading(this.isLoading);        
    }

    // this public function must refresh the boats asynchronously
  // uses notifyLoading
  @api
  async refresh() { 
    this.isLoading = true;
    this.notifyLoading(this.isLoading);      
    await refreshApex(this.boats);
    this.isLoading = false;
    this.notifyLoading(this.isLoading);  
  }

  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) { 
      this.selectedBoatId = event.detail.boatId;
      this.sendMessageService(this.selectedBoatId);
  }
  
  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) { 
    // explicitly pass boatId to the parameter recordId
    const message = {recordId: boatId};
    publish(this.messageContext, BOATMC, message);
  }
  
  // This method must save the changes in the Boat Editor
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
    const recordInputs = event.detail.draftValues.slice().map(draft => {
        const fields = Object.assign({}, draft);        
        return { fields };
    });
    
    const promises = recordInputs.map((recordInput) => {
        updateRecord(recordInput);
    });

    Promise.all(promises)
        .then(boats=>{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: SUCCESS_TITLE,
                    message: MESSAGE_SHIP_IT,
                    variant: SUCCESS_VARIANT
                })
            );
            // Clear all draft values
            this.draftValues = [];
        })
        .catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: error.body.message,
                    variant: ERROR_VARIANT
                })
            );
        })
        .finally(() => {
            this.refresh();
        });
  }
  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) {
      if(!isLoading){
        this.dispatchEvent(new CustomEvent('doneloading', {}));
      }
      else{
        this.dispatchEvent(new CustomEvent('loading', {}));
      }
  }
}