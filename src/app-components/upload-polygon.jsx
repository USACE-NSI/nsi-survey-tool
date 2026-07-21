import { useConnect } from "redux-bundler-hook";
import { useState } from "react";
import shp from "shpjs";

// Shared polygon upload sub-component used by both stratified and CSV survey
// creation flows. Accepts a GeoJSON file assumed to be in EPSG:4326 and stores
// the parsed geometry as a string on survey.perimeterGeometry so it can be
// posted as perimeter_geom on the server Survey struct.
export default function UploadPolygon() {
  const { survey, doUpdateSurvey } = useConnect(
    "selectSurvey",
    "doUpdateSurvey",
  );

  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // GeoJSON per RFC 7946 is WGS84. If a legacy `crs` member is present and
  // names anything other than 4326/CRS84, reject so we don't silently store
  // coordinates in the wrong reference system.
  const crsIs4326 = (geo) => {
    if (!geo || !geo.crs) return true;
    const name = geo.crs && geo.crs.properties && geo.crs.properties.name;
    if (!name) return true;
    return /(4326|CRS84)/i.test(name);
  };

  // PostGIS ST_GeomFromGeoJSON only accepts a bare geometry — Feature and
  // FeatureCollection wrappers fail with "invalid GeoJson representation".
  // Unwrap to a Polygon/MultiPolygon geometry; combine multiple features into
  // a single MultiPolygon so the user can ship a layer with multiple parts.
  const toGeometry = (geo) => {
    if (!geo || !geo.type) return null;
    if (geo.type === "Feature") return toGeometry(geo.geometry);
    if (geo.type === "FeatureCollection") {
      const geoms = (geo.features || [])
        .map((f) => f && f.geometry)
        .filter(Boolean);
      if (geoms.length === 0) return null;
      if (geoms.length === 1) return toGeometry(geoms[0]);
      const polys = [];
      for (const g of geoms) {
        if (g.type === "Polygon") polys.push(g.coordinates);
        else if (g.type === "MultiPolygon") polys.push(...g.coordinates);
        else return null;
      }
      return { type: "MultiPolygon", coordinates: polys };
    }
    if (geo.type === "Polygon" || geo.type === "MultiPolygon") return geo;
    return null;
  };
  // Validate and store the resulting GeoJSON through the shared pipeline.
  const processGeoJSON = (geo, name) => {
    if (!geo || !geo.type) {
      setError("File is not valid GeoJSON.");
      return;
    }
    if (!crsIs4326(geo)) {
      setError("Polygon must be in EPSG:4326 (WGS84).");
      return;
    }
    const geometry = toGeometry(geo);
    if (!geometry) {
      setError("File must contain a Polygon or MultiPolygon geometry.");
      return;
    }
    setFileName(name);
    doUpdateSurvey({
      ...survey,
      perimeterGeometry: JSON.stringify(geometry),
    });
  };
  const handleFileUpload = async (e) => {
    setError("");
    setLoading(true);
    const file = e.target.files[0];
    if (!file) {
      setLoading(false);
      return;
    }

    try {
      const ext = file.name.split(".").pop().toLowerCase();

      if (ext === "zip") {
        // Shapefile in a .zip — convert to GeoJSON via shpjs.
        const arrayBuffer = await file.arrayBuffer();
        const geo = await shp(arrayBuffer);
        // shpjs always returns a FeatureCollection.
        processGeoJSON(geo, file.name);
      } else {
        // GeoJSON — read as text and parse.
        const text = await file.text();
        const parsed = JSON.parse(text);
        processGeoJSON(parsed, file.name);
      }
    } catch (err) {
      if (file.name.endsWith(".zip")) {
        setError(
          "Could not parse shapefile. Make sure the .zip contains a valid .shp, .shx, and .dbf.",
        );
      } else {
        setError("Could not parse GeoJSON file: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const hasPolygon = !!survey.perimeterGeometry;

  return (
    <div className="gw-space-y-2">
      <label className="gw-font-semibold gw-text-sm gw-text-slate-700">
        Survey Perimeter Polygon
      </label>
      <div className="gw-relative gw-group">
        <div className="gw-border-2 gw-border-dashed gw-border-slate-300 gw-rounded-lg gw-p-8 gw-text-center hover:gw-border-blue-400 hover:gw-bg-blue-50 gw-transition-all">
          <i className="mdi mdi-map-marker-outline gw-text-3xl gw-text-slate-400 gw-mb-2" />
          <p className="gw-text-sm gw-text-slate-600">
            Drag and drop your <b>.geojson</b> or <b>.zip</b> (shapefile) here
            or{" "}
            <span className="gw-text-blue-600 gw-font-semibold">
              browse files
            </span>
          </p>
          <p className="gw-text-xs gw-text-slate-400 gw-mt-1">
            Required: GeoJSON polygon or shape zip in EPSG:4326 (WGS84)
          </p>
          {hasPolygon && (
            <p className="gw-text-xs gw-text-green-600 gw-mt-2 gw-font-medium">
              <i className="mdi mdi-check-circle-outline" />{" "}
              {fileName || "Polygon loaded"}
            </p>
          )}
          {error && (
            <p className="gw-text-xs gw-text-red-600 gw-mt-2 gw-font-medium">
              {error}
            </p>
          )}
          {loading && (
            <p className="gw-text-xs gw-text-blue-600 gw-mt-2 gw-font-medium">
              <i className="mdi mdi-loading mdi-spin" /> Processing…
            </p>
          )}
          <input
            type="file"
            accept=".geojson,.zip,application/geo+json,application/json,application/zip"
            className="gw-absolute gw-inset-0 gw-opacity-0 gw-cursor-pointer"
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </div>
  );
}
