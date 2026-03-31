import Control from 'ol/control/Control.js';
import { renderToStaticMarkup } from 'react-dom/server';
import { NotListedLocation as NotListedLocationIcon } from '@mui/icons-material';
import React from 'react';


export default class IdentifyButton extends Control {
    constructor(opt_options) {
      const options = opt_options || {};
      super({ element: document.createElement('div'), target: options.target });
  
      this.active = false;
      this.setFeatureInfo = options.setFeatureInfo;
      this.overlay = options.overlay;
      this.listener = null; // Store the click listener reference
  
      // UI Setup
      //const button = document.createElement('button');
      //button.innerHTML = '🎯'; // Target icon for "Identify Mode"
      
      const button = document.createElement('button');
      button.title = 'Identify Feature';
      // Render the MUI icon to an SVG string
// Instead of <NotListedLocationIcon style={{...}} />
const iconElement = React.createElement(NotListedLocationIcon, { 
    style: { fontSize: '20px', verticalAlign: 'middle' } 
  });
  
  button.innerHTML = renderToStaticMarkup(iconElement);
      
      this.element.className = 'identify-button ol-unselectable ol-control';
      this.element.appendChild(button);
  
      button.addEventListener('click', this.toggleIdentify.bind(this), false);
    }
  
    toggleIdentify() {
        this.active = !this.active;
        const map = this.getMap();
        const viewport = map.getViewport();
    
        if (this.active) {
          // Activate Mode
          this.element.classList.add('active-control');
          viewport.style.cursor = 'crosshair';
          
          this.listener = (evt) => {
            const feature = map.forEachFeatureAtPixel(evt.pixel, (feat) => feat);
            if (feature) {
              this.setFeatureInfo(feature.getProperties());
              this.overlay.setPosition(evt.coordinate);
            } else {
              // If they click empty space while tool is active, clear it
              this.setFeatureInfo(null);
              this.overlay.setPosition(undefined);
            }
          };
          map.on('singleclick', this.listener);
        } else {
          // Deactivate Mode
          this.element.classList.remove('active-control');
          viewport.style.cursor = '';
          
          // 1. Remove the listener
          map.un('singleclick', this.listener);
          this.listener = null;
    
          // 2. CLEAR THE POPUP AND STATE
          if (this.setFeatureInfo) this.setFeatureInfo(null);
          //if (this.overlay) this.overlay.setPosition(undefined);
        }
      }
  }