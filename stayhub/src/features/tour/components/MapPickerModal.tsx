import React from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Search, X, Navigation, MapPin } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { extractLocationFromPlace } from "../services/mapGeocoding.service";
import { useMapPicker, type MapPickerMode } from "../hooks/useMapPicker";
import { useTranslation } from "../../../contexts/LocaleContext";

interface MapPickerModalProps {
  isOpen: boolean;
  mode?: MapPickerMode;
  initialData?: {
    start?: { lat?: number; lng?: number; address?: string };
    end?: { lat?: number; lng?: number; address?: string };
    single?: { lat?: number; lng?: number; address?: string };
  };
  onClose: () => void;
  onConfirm: (data: ReturnType<typeof extractLocationFromPlace>) => void;
}

export const MapPickerModal: React.FC<MapPickerModalProps> = ({
  isOpen,
  mode = "single",
  initialData,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();
  const {
    mapRef,
    queries,
    isSearching,
    locations,
    markerCoordinates,
    routeCoordinates,
    isRouteFallback,
    activePin,
    searchError,
    handleMapClick,
    handleMarkerDragEnd,
    handleSearchLocation,
    handleLocateMe,
    predictions,
    handleInputChange,
    handleSelectPrediction,
    handleFocusPin,
  } = useMapPicker(isOpen, mode, initialData);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  if (!isOpen) return null;

  const confirmLocation = () => {
    if (mode === "single") {
      if (!locations.single) return;
      onConfirm(extractLocationFromPlace(locations.single));
    } else {
      if (!locations.start && !locations.end) return;
      onConfirm({
        start: extractLocationFromPlace(locations.start),
        end: extractLocationFromPlace(locations.end),
      } as never);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-bold text-slate-800">{t("tour.mapPickerTitle")}</h3>
            <p className="mt-0.5 text-xs text-slate-500">{t("tour.mapPickerSubtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-20 border-b border-slate-100 bg-white p-4 shadow-sm">
          {mode === "single" ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={queries.single}
                onFocus={() => handleFocusPin("single")}
                onChange={(e) => handleInputChange(e.target.value, "single")}
                onKeyDown={(e) => e.key === "Enter" && handleSearchLocation("single")}
                placeholder={t("tour.mapSearchPlaceholder")}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
              />
              <ActionButton
                variant="secondary"
                onClick={handleLocateMe}
                disabled={isSearching}
                className="shrink-0 px-4 py-2.5"
                title={t("tour.mapUseCurrentLocation")}
              >
                <Navigation className="h-4 w-4 text-indigo-600" />
              </ActionButton>
              <ActionButton
                variant="primary"
                onClick={() => handleSearchLocation("single")}
                disabled={isSearching}
                className="shrink-0 px-4 py-2.5"
              >
                <Search className="h-4 w-4" />
              </ActionButton>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div
                  onClick={() => handleFocusPin("start")}
                  className={`flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-xl font-bold text-white transition-all ${activePin === "start" ? "bg-emerald-500 shadow-md ring-2 ring-emerald-200 ring-offset-1" : "bg-slate-300"}`}
                >
                  A
                </div>
                <input
                  type="text"
                  value={queries.start}
                  onFocus={() => handleFocusPin("start")}
                  onChange={(e) => handleInputChange(e.target.value, "start")}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchLocation("start")}
                  placeholder={t("tour.mapStartPlaceholder")}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                />
                <ActionButton
                  variant="secondary"
                  onClick={handleLocateMe}
                  disabled={isSearching}
                  className="shrink-0 px-3"
                  title={t("tour.mapUseCurrentLocation")}
                >
                  <Navigation className="h-4 w-4 text-indigo-600" />
                </ActionButton>
                <ActionButton
                  variant="primary"
                  onClick={() => handleSearchLocation("start")}
                  disabled={isSearching}
                  className="shrink-0 px-3"
                >
                  <Search className="h-4 w-4" />
                </ActionButton>
              </div>
              <div className="flex gap-2">
                <div
                  onClick={() => handleFocusPin("end")}
                  className={`flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-xl font-bold text-white transition-all ${activePin === "end" ? "bg-rose-500 shadow-md ring-2 ring-rose-200 ring-offset-1" : "bg-slate-300"}`}
                >
                  B
                </div>
                <input
                  type="text"
                  value={queries.end}
                  onFocus={() => handleFocusPin("end")}
                  onChange={(e) => handleInputChange(e.target.value, "end")}
                  onKeyDown={(e) => e.key === "Enter" && handleSearchLocation("end")}
                  placeholder={t("tour.mapEndPlaceholder")}
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:bg-white"
                />
                <ActionButton
                  variant="primary"
                  onClick={() => handleSearchLocation("end")}
                  disabled={isSearching}
                  className="shrink-0 px-3"
                >
                  <Search className="h-4 w-4" />
                </ActionButton>
              </div>
            </div>
          )}

          {searchError && (
            <p className="mt-2 text-xs font-medium text-amber-600">{searchError}</p>
          )}

          {predictions.length > 0 && (
            <div className="absolute left-4 right-4 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
              {predictions.map((prediction) => (
                <button
                  key={prediction.place_id}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                  onClick={() =>
                    handleSelectPrediction(
                      prediction.place_id,
                      prediction.description,
                      activePin,
                    )
                  }
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium text-slate-700">
                      {prediction.structured_formatting?.main_text || prediction.description}
                    </span>
                    <span className="truncate text-xs text-slate-500">
                      {prediction.structured_formatting?.secondary_text || ""}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 flex-1 bg-slate-100">
          {mapboxToken ? (
            <Map
              ref={mapRef}
              initialViewState={{
                latitude:
                  markerCoordinates[mode === "route" ? "start" : "single"]?.lat ??
                  10.762622,
                longitude:
                  markerCoordinates[mode === "route" ? "start" : "single"]?.lng ??
                  106.660172,
                zoom: 13,
              }}
              mapboxAccessToken={mapboxToken}
              mapStyle="mapbox://styles/mapbox/streets-v12"
              language="en"
              style={{ width: "100%", height: "100%" }}
              attributionControl={false}
              onLoad={() => {
                const coordinates =
                  markerCoordinates[mode === "route" ? "start" : "single"];
                if (coordinates) {
                  mapRef.current?.jumpTo({
                    center: [coordinates.lng, coordinates.lat],
                    zoom: 13,
                  });
                }
              }}
              onClick={(event) =>
                handleMapClick({
                  lat: event.lngLat.lat,
                  lng: event.lngLat.lng,
                })
              }
            >
              {routeCoordinates.length > 0 && (
                <Source
                  id="tour-picker-route"
                  type="geojson"
                  data={{
                    type: "Feature",
                    properties: {},
                    geometry: {
                      type: "LineString",
                      coordinates: routeCoordinates,
                    },
                  }}
                >
                  <Layer
                    id="tour-picker-route-line"
                    type="line"
                    paint={{
                      "line-color": "#4f46e5",
                      "line-width": isRouteFallback ? 3 : 4,
                      "line-opacity": isRouteFallback ? 0.7 : 0.85,
                      ...(isRouteFallback
                        ? { "line-dasharray": [2, 2.5] }
                        : {}),
                    }}
                    layout={{
                      "line-cap": "round",
                      "line-join": "round",
                    }}
                  />
                </Source>
              )}

              {(["single", "start", "end"] as const).map((pin) => {
                const coordinates = markerCoordinates[pin];
                const shouldRender =
                  coordinates &&
                  (mode === "route"
                    ? pin === "start" || pin === "end"
                    : pin === "single");

                if (!shouldRender) return null;

                const color =
                  pin === "start"
                    ? "bg-emerald-500"
                    : pin === "end"
                      ? "bg-rose-500"
                      : "bg-indigo-600";
                const label = pin === "start" ? "A" : pin === "end" ? "B" : "";

                return (
                  <Marker
                    key={pin}
                    latitude={coordinates.lat}
                    longitude={coordinates.lng}
                    draggable
                    anchor="center"
                    onDragEnd={(event) =>
                      handleMarkerDragEnd(pin, {
                        lat: event.lngLat.lat,
                        lng: event.lngLat.lng,
                      })
                    }
                  >
                    <div
                      className={`flex h-8 w-8 cursor-grab items-center justify-center rounded-full border-[3px] border-white text-xs font-extrabold text-white shadow-lg active:cursor-grabbing ${color}`}
                    >
                      {label || <MapPin className="h-4 w-4" />}
                    </div>
                  </Marker>
                );
              })}
            </Map>
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-amber-700">
              VITE_MAPBOX_TOKEN is missing. Add it to the environment to load the map.
            </div>
          )}
          {isSearching && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#4880ff]"></div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-4">
          <div className="line-clamp-2 flex-1 pr-4 text-sm font-medium text-slate-600">
            {mode === "single"
              ? locations.single
                ? locations.single.formatted_address
                : t("tour.mapClickToDropPin")
              : (
                <div className="flex gap-4">
                  <span className="text-emerald-600">
                    <span className="font-bold">A:</span>{" "}
                    {locations.start ? locations.start.formatted_address.split(",")[0] : "..."}
                  </span>
                  <span className="text-rose-600">
                    <span className="font-bold">B:</span>{" "}
                    {locations.end ? locations.end.formatted_address.split(",")[0] : "..."}
                  </span>
                </div>
              )}
          </div>
          <ActionButton
            variant="primary"
            onClick={confirmLocation}
            disabled={mode === "single" ? !locations.single : !locations.start && !locations.end}
            className="px-6 py-2.5 shadow-sm"
          >
            {mode === "single" ? t("tour.mapConfirmLocation") : t("tour.mapConfirmRoute")}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};
