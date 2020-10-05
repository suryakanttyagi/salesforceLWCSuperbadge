import { LightningElement, api, track } from 'lwc';
import fivestar from '@salesforce/resourceUrl/fivestar';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

const ERROR_TITLE = 'Error loading five-star';
const ERROR_VARIANT = 'error';
const EDITABLE_CLASS = 'c-rating';
const READ_ONLY_CLASS = 'readonly c-rating';

export default class FiveStarRating extends LightningElement {
    @api value;
    @api readOnly = false;

    @track editedValue;
    @track isRendered = false;

    renderedCallback() {
        if (this.isRendered) {
          return;
        }
        this.loadScript();
        this.isRendered = true;
      }
    
    loadScript(){
        Promise.all([
            loadStyle(this, fivestar + '/rating.css'),
            loadScript(this, fivestar + '/rating.js')
        ]).then(res => {
            this.initializeRating();
        }).catch(error => {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: ERROR_TITLE,
                    message: error.body.message,
                    variant: ERROR_VARIANT
                })
            )
        })
    }

    initializeRating() {
        let domEl = this.template.querySelector('ul');
        let maxRating = 5;
        let self = this;
        let callback = function (rating) {
          self.editedValue = rating;
          self.ratingChanged(rating);
        };
        this.ratingObj = window.rating(
          domEl,
          this.value,
          maxRating,
          callback,
          this.readOnly
        );
      }

    get starClass(){
        return this.readOnly ? READ_ONLY_CLASS : EDITABLE_CLASS;
    }

    // Method to fire event called ratingchange with the following parameter:
    // {detail: { rating: CURRENT_RATING }}); when the user selects a rating
    ratingChanged(rating) {
        this.dispatchEvent(new CustomEvent('ratingchange', {detail: { rating: rating }}));
    }
}