import React, { useEffect, useRef, useState } from 'react';
import {useConnect} from 'redux-bundler-hook';
import { fromLonLat, toLonLat } from 'ol/proj';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import 'ol/ol.css'; // {Link: Medium https://medium.com/random-gis-talks/create-openlayers-map-in-react-part-1-425f8481ea9d}
import Style from 'ol/style/Style';
import { Fill, Stroke } from 'ol/style';
import Circle from 'ol/style/Circle'
import MVT from 'ol/format/MVT';
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import Overlay from 'ol/Overlay';
//import Control from 'ol/control/Control.js';
import {defaults as defaultControls} from 'ol/control/defaults.js';
import IdentifyButton from './IdentifyButton.js'

export default function MapComponent() {
  const mapElement = useRef();
  const mapInstance = useRef(null);
  const popupRef = useRef();
  const vtLayerRef = useRef();
  const selectedRef = useRef(null);
  const [featureInfo, setFeatureInfo] = useState(null);
  const { selectedId, doUpdateMapReference } = useConnect('selectSelectedId','doUpdateMapReference');
  // useConnect takes a list of selectors and action creators as strings
  const { 
    mapCenter, 
    mapZoom, 
    doUpdateMapView 
  } = useConnect(
    'selectMapCenter',
    'selectMapZoom',
    'doUpdateMapView'
  );

  useEffect(() => {
      // Define highlight style
  let highlightStyle = new Style({
    image: new Circle({
      radius: 7, // Larger radius to highlight
      fill: new Fill({ color: '#E0FFFF' }),
      stroke: new Stroke({ color: '#00FFFF', width: 2 }),
      zIndex: 1000
    })
  });
    let stroke = new Stroke({
        color: "#000",
        width: 1,
      });
    
      let styleRes = new Style({
        image: new Circle({
          radius: 4,
          fill: new Fill({
            color: "#2d96ff"//blue
          }),
          stroke: stroke,
        }),
      })
    
      let stylecom = new Style({
        image: new Circle({
          radius: 4,
          fill: new Fill({
            color: "#AAA"//gray
          }),
          stroke: stroke,
        }),
      })
    
      let styleInd = new Style({
        image: new Circle({
          radius: 4,
          fill: new Fill({
            color: "#fa3232" //red
          }),
          stroke: stroke
        }),
      });
    
      let stylePub = new Style({
        image: new Circle({
          radius: 4,
          fill: new Fill({
            color: "#09e40f" //green
          }),
          stroke: stroke
        })
      })
      /*const overlay = new Overlay({
        element: popupRef.current,
        autoPan: false,
        positioning: 'top-right',
        stopEvent: false, // Allows mouse events to pass through to the map
        offset: [0, -10]
      });*/
      const vtLayer = new VectorTileLayer({
        declutter:true,
        style: function (feature) {
          //console.log(selectedId)
          //console.log(selectedRef.current)
          //console.log(feature.getId())
          if (feature.getId() === selectedRef.current){
            console.log("i choo choo choose you")
            return highlightStyle
          } 
          if (feature.properties_.st_damcat === "RES") return styleRes
          if (feature.properties_.st_damcat === "PUB")  return stylePub
          if (feature.properties_.st_damcat === "IND") return styleInd
          return stylecom
        },
        minZoom: 7,
        useInterimTilesOnError: true,
        source: new VectorTileSource({
          attributions: 'USACE',
          minZoom: 7,
          maxZoom: 15,
          format: new MVT({ idProperty: 'fd_id' }),//property is removed so if we want it in properties we need to select a different unique id or we need to solve highlighting in another way
          url: "https://ml-dev.sec.usace.army.mil/nsi-ml/tileservice/services/nsi-all-pub/tiles/{z}/{x}/{y}.pbf",
            })

    })
    // 1. Initialize Map Instance
    const map = new Map({
      target: mapElement.current,
      controls: defaultControls().extend([
        new IdentifyButton({ 
          setFeatureInfo: setFeatureInfo, // Pass the React state setter
          //overlay: overlay                // Pass the Overlay instance
        })
      ]),
      //overlays: [overlay],
      layers: [new TileLayer({ source: new OSM() }), vtLayer],
      view: new View({
        center: fromLonLat(mapCenter),
        zoom: mapZoom,
      }),
    });
    vtLayerRef.current = vtLayer;
    mapInstance.current = map;
    console.log("update map reference in store")
    doUpdateMapReference(map)/*
  map.on('singleclick', (evt) => {
    if (evt.dragging) return;
    const pixel = map.getEventPixel(evt.originalEvent);
    const feature = map.forEachFeatureAtPixel(pixel, (feat) => feat);
    if (feature) {
      const props = feature.getProperties();
      setFeatureInfo(props); // Store the whole object
      overlay.setPosition(evt.coordinate);
    } else {
      setFeatureInfo(null); // Clear state when not hovering
      overlay.setPosition(undefined);
    }
  },[selectedId])*/
    // 2. Sync Map -> Redux (on user interaction)
    map.on('moveend', () => {
      const view = map.getView();
      const newCenter = toLonLat(view.getCenter());
      const newZoom = Math.round(view.getZoom());

      // Only dispatch if the values actually changed to avoid loops
      if (newCenter[0] !== mapCenter[0] || newZoom !== mapZoom) {
        doUpdateMapView({
          center: newCenter,
          zoom: newZoom,
        });
      }
    });

    return () => map.setTarget(null);
  }, []); // Initialize once

  // 3. Sync Redux -> Map (on state changes from other components)
  useEffect(() => {
    if (mapInstance.current) {
      const view = mapInstance.current.getView();
      const currentCenter = toLonLat(view.getCenter());

      // Check if store state differs from current map view
      if (currentCenter[0] !== mapCenter[0] || view.getZoom() !== mapZoom) {
        view.animate({
          center: fromLonLat(mapCenter),
          zoom: mapZoom,
          duration: 300
        });
      }
    }
  }, [mapCenter, mapZoom]);
  useEffect(() => {
    selectedRef.current = selectedId
    if (vtLayerRef.current) {
      // This tells OpenLayers to re-run the style function for all features
      console.log('updating style')
      vtLayerRef.current.changed(); 
    }
  }, [selectedId]);

  return <div style={{ position: 'relative' }}>
  <div ref={mapElement} style={{ width: '100%', height: '83vh' }} />
  
  {/* 3. The Popup Element */}
  <div 
ref={popupRef} 
className='fixed-popup'
style={{
  display: featureInfo ? 'block' : 'none'}}
>
{featureInfo ? (
  <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
    {Object.entries(featureInfo)
      .filter(([key]) => key !== 'layer' && key !== 'geometry') // Filter internal OL keys
      .map(([key, value]) => (
        <li key={key} style={{ marginBottom: '4px' }}>
          <strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}:</strong> {String(value)}
        </li>
      ))}
  </ul>
) : null} </div>
</div>;;
}