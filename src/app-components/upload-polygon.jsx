import { useConnect } from "redux-bundler-hook";
import { useState } from "react";

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

  const handleFileUpload = (e) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target.result;
        const parsed = JSON.parse(text);
        if (!parsed || !parsed.type) {
          setError("File is not valid GeoJSON.");
          return;
        }
        if (!crsIs4326(parsed)) {
          setError("Polygon must be in EPSG:4326 (WGS84).");
          return;
        }
        const geometry = toGeometry(parsed);
        if (!geometry) {
          setError("File must contain a Polygon or MultiPolygon geometry.");
          return;
        }
        setFileName(file.name);
        doUpdateSurvey({
          ...survey,
          perimeterGeometry: JSON.stringify(geometry),
        });
      } catch (err) {
        setError("Could not parse GeoJSON file." + err);
      }
    };
    reader.readAsText(file);
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
            Drag and drop your <b>.geojson</b> here or{" "}
            <span className="gw-text-blue-600 gw-font-semibold">
              browse files
            </span>
          </p>
          <p className="gw-text-xs gw-text-slate-400 gw-mt-1">
            Required: GeoJSON polygon in EPSG:4326 (WGS84)
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
          <input
            type="file"
            accept=".geojson,application/geo+json,application/json"
            className="gw-absolute gw-inset-0 gw-opacity-0 gw-cursor-pointer"
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </div>
  );
}
