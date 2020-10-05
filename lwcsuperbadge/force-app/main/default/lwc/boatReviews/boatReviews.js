import { LightningElement, wire, track, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import getAllReviews from '@salesforce/apex/BoatDataService.getAllReviews';

export default class BoatReviews extends NavigationMixin(LightningElement) {
    // Private
    @track boatId;
    error;
    @track boatReviews = [];
    isLoading;

    readOnly = true;
    
    // Getter and Setter to allow for logic to run on recordId change
    @api
    get recordId() {
      return this.boatId;
    }
    set recordId(value) {
      //sets boatId attribute
      this.setAttribute('boatId', value);
      //sets boatId assignment
      this.boatId = value;
      //get reviews associated with boatId      
      this.getReviews();

    }
    
    // Getter to determine if there are reviews to display
    @api
    get reviewsToShow() {
      return this.boatReviews && this.boatReviews.length > 0 ? true : false;
    }
    
    // Public method to force a refresh of the reviews invoking getReviews
    @api
    refresh() {
      refreshApex(this.getReviews());
    }
    
    // Imperative Apex call to get reviews for given boat
    // returns immediately if boatId is empty or null
    // sets isLoading to true during the process and false when it’s completed
    // Gets all the boatReviews from the result, checking for errors.
    getReviews() {
      if(this.boatId == null  || this.boatId == '') {
        return;
      }
      this.isLoading = true;
      getAllReviews({boatId: this.boatId}).then(result => {
        console.log('result', result);
        this.boatReviews = result;
        this.error = undefined;

        this.isLoading = false;
      }).catch(error => {
        this.boatReviews = [];
        this.error = error.body.message;

        this.isLoading = false;
      }).finally(() => {
        this.isLoading = false;
     });
    }
    
    // Helper method to use NavigationMixin to navigate to a given record on click
    navigateToRecord(event) {
      this[NavigationMixin.Navigate]({
        type: "standard__recordPage",
        attributes: {
            recordId: event.target.dataset.recordId,
            actionName: "view"
        }
      });
    }
  }