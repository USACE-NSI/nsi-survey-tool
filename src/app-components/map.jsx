import React, { useEffect, useRef, useState } from "react";
import { useConnect } from "redux-bundler-hook";
import { fromLonLat, toLonLat } from "ol/proj";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import TileArcGISRest from "ol/source/TileArcGISRest";
import "ol/ol.css"; // {Link: Medium https://medium.com/random-gis-talks/create-openlayers-map-in-react-part-1-425f8481ea9d}
import Style from "ol/style/Style";
import { Fill, Stroke } from "ol/style";
import Circle from "ol/style/Circle";
import Icon from "ol/style/Icon";
import MVT from "ol/format/MVT";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from "ol/source/VectorTile";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Overlay from "ol/Overlay";
//import Control from 'ol/control/Control.js';
import { defaults as defaultControls } from "ol/control/defaults.js";
import IdentifyButton from "./IdentifyButton.js";
import BasemapSwitcher from "./basemap-switcher.jsx";
import { BASEMAP_CONFIG } from "../app-bundles/map-bundle";

// Google-style yellow drop pin used to mark the active survey assignment.
// Inlined as a data URL so no asset file is required; the path is the
// Material location_on icon (24x24 viewBox, tip at ~(12,22)) with a white
// inner circle and a dark outline for contrast on any basemap.
const SELECTED_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="36" height="36"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#FFD700" stroke="#222" stroke-width="0.75"/><circle cx="12" cy="9" r="2.75" fill="#FFFFFF" stroke="#222" stroke-width="0.5"/></svg>`;
const SELECTED_PIN_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SELECTED_PIN_SVG)}`;

// Build an OpenLayers Source from a BASEMAP_CONFIG entry. Keeping this here
// (next to the OL imports) means the bundle never has to import OL.
function createBasemapSource(cfg) {
  switch (cfg.type) {
    case "osm":
      return new OSM();
    case "xyz":
      return new XYZ({
        url: cfg.url,
        attributions: cfg.attributions,
        maxZoom: cfg.maxZoom,
        crossOrigin: "anonymous",
      });
    case "arcgisrest":
      return new TileArcGISRest({
        url: cfg.url,
        attributions: cfg.attributions,
        crossOrigin: "anonymous",
      });
    default:
      throw new Error(`Unknown basemap source type: ${cfg.type}`);
  }
}

export default function MapComponent() {
  const mapElement = useRef();
  const mapInstance = useRef(null);
  const popupRef = useRef();
  const vtLayerRef = useRef();
  const perimeterLayerRef = useRef();
  const perimeterSourceRef = useRef();
  const selectedSourceRef = useRef();
  const basemapLayerRefs = useRef({});
  const selectedRef = useRef(null);
  const [featureInfo, setFeatureInfo] = useState(null);
  const { selectedId, surveyElement, doUpdateMapReference } = useConnect(
    "selectSelectedId",
    "selectSurveyElement",
    "doUpdateMapReference",
  );
  // useConnect takes a list of selectors and action creators as strings
  const { mapCenter, mapZoom, mapPerimeter, mapBasemap, doUpdateMapView } =
    useConnect(
      "selectMapCenter",
      "selectMapZoom",
      "selectMapPerimeter",
      "selectMapBasemap",
      "doUpdateMapView",
    );

  useEffect(() => {
    // Define highlight style
    let highlightStyle = new Style({
      image: new Circle({
        radius: 7, // Larger radius to highlight
        fill: new Fill({ color: "#E0FFFF" }),
        stroke: new Stroke({ color: "#00FFFF", width: 2 }),
        zIndex: 1000,
      }),
    });
    let stroke = new Stroke({
      color: "#000",
      width: 1,
    });

    let styleRes = new Style({
      image: new Circle({
        radius: 4,
        fill: new Fill({
          color: "#2d96ff", //blue
        }),
        stroke: stroke,
      }),
    });

    let stylecom = new Style({
      image: new Circle({
        radius: 4,
        fill: new Fill({
          color: "#AAA", //gray
        }),
        stroke: stroke,
      }),
    });

    let styleInd = new Style({
      image: new Circle({
        radius: 4,
        fill: new Fill({
          color: "#fa3232", //red
        }),
        stroke: stroke,
      }),
    });

    let stylePub = new Style({
      image: new Circle({
        radius: 4,
        fill: new Fill({
          color: "#09e40f", //green
        }),
        stroke: stroke,
      }),
    });
    /*const overlay = new Overlay({
        element: popupRef.current,
        autoPan: false,
        positioning: 'top-right',
        stopEvent: false, // Allows mouse events to pass through to the map
        offset: [0, -10]
      });*/
    // Perimeter layer: survey perimeter_geom drawn over the basemap but
    // below the NSI vector-tile layer so the identify tool still hits NSI
    // features through the perimeter fill.
    const perimeterSource = new VectorSource();
    const perimeterLayer = new VectorLayer({
      source: perimeterSource,
      zIndex: 1,
      style: new Style({
        stroke: new Stroke({ color: "#ff7800", width: 2 }),
        fill: new Fill({ color: "rgba(255, 120, 0, 0.1)" }),
      }),
    });

    // Selected-structure layer: a single Point feature is dropped here at the
    // current surveyElement.x/y so the active assignment is visually marked
    // independently of the NSI vector-tile feature (which can be decluttered
    // or absent at the over-zoomed display levels we use). Rendered as a
    // yellow Google-style drop pin anchored at the tip.
    const selectedSource = new VectorSource();
    const selectedLayer = new VectorLayer({
      source: selectedSource,
      zIndex: 3,
      style: new Style({
        image: new Icon({
          src: SELECTED_PIN_DATA_URL,
          anchor: [0.5, 22 / 24],
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
        }),
      }),
    });

    const vtLayer = new VectorTileLayer({
      declutter: true,
      zIndex: 2,
      style: function (feature) {
        //console.log(selectedId)
        //console.log(selectedRef.current)
        //console.log(feature.getId())
        if (feature.getId() === selectedRef.current) {
          console.log("i choo choo choose you");
          return highlightStyle;
        }
        if (feature.properties_.st_damcat === "RES") return styleRes;
        if (feature.properties_.st_damcat === "PUB") return stylePub;
        if (feature.properties_.st_damcat === "IND") return styleInd;
        return stylecom;
      },
      minZoom: 7,
      useInterimTilesOnError: true,
      source: new VectorTileSource({
        attributions: "USACE",
        minZoom: 7,
        maxZoom: 15,
        format: new MVT(),
        url: "https://ml-dev.sec.usace.army.mil/nsi-ml/tileservice/services/nsi-all-pub/tiles/{z}/{x}/{y}.pbf",
      }),
    });
    // Basemap layers, built from BASEMAP_CONFIG so the bundle owns URLs/labels
    // and this component owns OL construction. Each layer is created up front
    // and toggled via setVisible so switching is instant. Imagery layers get
    // preload + useInterimTilesOnError so out-of-range tiles fall back to a
    // scaled parent tile instead of leaving white squares.
    const basemapLayers = Object.fromEntries(
      Object.entries(BASEMAP_CONFIG).map(([key, cfg]) => {
        const layer = new TileLayer({
          source: createBasemapSource(cfg),
          visible: key === mapBasemap,
          preload: cfg.type === "osm" ? 0 : Infinity,
          useInterimTilesOnError: cfg.type !== "osm",
        });
        return [key, layer];
      }),
    );

    // 1. Initialize Map Instance
    const map = new Map({
      target: mapElement.current,
      controls: defaultControls().extend([
        new IdentifyButton({
          setFeatureInfo: setFeatureInfo, // Pass the React state setter
          //overlay: overlay                // Pass the Overlay instance
        }),
      ]),
      //overlays: [overlay],
      layers: [...Object.values(basemapLayers), perimeterLayer, vtLayer, selectedLayer],
      view: new View({
        center: fromLonLat(mapCenter),
        zoom: mapZoom,
      }),
    });
    vtLayerRef.current = vtLayer;
    perimeterLayerRef.current = perimeterLayer;
    perimeterSourceRef.current = perimeterSource;
    selectedSourceRef.current = selectedSource;
    basemapLayerRefs.current = basemapLayers;
    mapInstance.current = map;
    console.log("update map reference in store");
    doUpdateMapReference(map); /*
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
    map.on("moveend", () => {
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
          duration: 300,
        });
      }
    }
  }, [mapCenter, mapZoom]);
  useEffect(() => {
    selectedRef.current = selectedId;
    if (vtLayerRef.current) {
      // This tells OpenLayers to re-run the style function for all features
      console.log("updating style");
      vtLayerRef.current.changed();
    }
  }, [selectedId]);

  // Toggle basemap layer visibility when the bundle's basemap selection changes.
  useEffect(() => {
    const layers = basemapLayerRefs.current;
    if (!layers || !Object.keys(layers).length) return;
    Object.entries(layers).forEach(([key, layer]) => {
      layer.setVisible(key === mapBasemap);
    });
  }, [mapBasemap]);

  // Render the survey perimeter as a layer and fit the view to its extent
  // whenever the map bundle's perimeterGeometry changes. The geometry is a
  // stringified GeoJSON in EPSG:4326; the map's view projection is EPSG:3857,
  // so the GeoJSON reader is asked to reproject features on read.
  useEffect(() => {
    const source = perimeterSourceRef.current;
    const map = mapInstance.current;
    if (!source || !map) return;
    source.clear();
    if (!mapPerimeter) return;
    let geometry;
    try {
      geometry =
        typeof mapPerimeter === "string"
          ? JSON.parse(mapPerimeter)
          : mapPerimeter;
    } catch (err) {
      console.error("Failed to parse perimeter GeoJSON:", err);
      return;
    }
    if (!geometry || !geometry.type) return;
    const wrapped =
      geometry.type === "Feature" || geometry.type === "FeatureCollection"
        ? geometry
        : { type: "Feature", geometry, properties: {} };
    let features;
    try {
      features = new GeoJSON().readFeatures(wrapped, {
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:3857",
      });
    } catch (err) {
      console.error("Failed to read perimeter features:", err);
      return;
    }
    if (!features.length) return;
    source.addFeatures(features);
    const extent = source.getExtent();
    if (!extent || extent.some((v) => !Number.isFinite(v))) return;
    // fit is animated; the existing moveend handler syncs center/zoom back into the map bundle when the animation completes.
    map.getView().fit(extent, {
      size: map.getSize(),
      padding: [40, 40, 40, 40],
      duration: 300,
      maxZoom: 18,
    });
  }, [mapPerimeter]);

  // Mark the active survey assignment with a Point on the dedicated
  // selectedLayer whenever surveyElement.x/y is a finite lon/lat pair.
  // Cleared when fdId resets to the default (-1) or coordinates are missing,
  // so the marker doesn't linger past "completed" state.
  useEffect(() => {
    const source = selectedSourceRef.current;
    if (!source) return;
    source.clear();
    const x = surveyElement && Number(surveyElement.x);
    const y = surveyElement && Number(surveyElement.y);
    const fdId = surveyElement && surveyElement.fdId;
    if (!Number.isFinite(x) || !Number.isFinite(y) || fdId == null || fdId === -1) return;
    const feature = new Feature({ geometry: new Point(fromLonLat([x, y])) });
    source.addFeature(feature);
  }, [surveyElement?.x, surveyElement?.y, surveyElement?.fdId]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={mapElement} style={{ width: "100%", height: "83vh" }} />

      <BasemapSwitcher />

      {/* 3. The Popup Element */}
      <div
        ref={popupRef}
        className="fixed-popup"
        style={{
          display: featureInfo ? "block" : "none",
        }}
      >
        {featureInfo ? (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {Object.entries(featureInfo)
              .filter(([key]) => key !== "layer" && key !== "geometry") // Filter internal OL keys
              .map(([key, value]) => (
                <li key={key} style={{ marginBottom: "4px" }}>
                  <strong style={{ textTransform: "capitalize" }}>
                    {key.replace(/_/g, " ")}:
                  </strong>{" "}
                  {String(value)}
                </li>
              ))}
          </ul>
        ) : null}{" "}
      </div>
    </div>
  );
}
