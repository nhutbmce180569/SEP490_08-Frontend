import React, { useEffect } from "react";
import Map, { Marker } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Search, Navigation, MapPin } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { extractLocationFromPlace } from "../../tour/services/mapGeocoding.service";
import { useMapPicker } from "../../tour/hooks/useMapPicker";
import { useTranslation } from "../../../contexts/LocaleContext";

interface InlineMapPickerProps {
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onLocationSelect: (location: ReturnType<typeof extractLocationFromPlace> | null) => void;
}

export const InlineMapPicker: React.FC<InlineMapPickerProps> = ({
  initialLat,
  initialLng,
  initialAddress,
  onLocationSelect,
}) => {
  const { t } = useTranslation();
  const {
    mapRef,
    queries,
    isSearching,
    locations,
    markerCoordinates,
    searchError,
    handleMapClick,
    handleMarkerDragEnd,
    handleSearchLocation,
    handleLocateMe,
    predictions,
    handleInputChange,
    handleSelectPrediction,
    handleFocusPin,
  } = useMapPicker(true, "single", {
    single: {
      lat: initialLat,
      lng: initialLng,
      address: initialAddress,
    },
  });
  
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

  const onLocationSelectRef = React.useRef(onLocationSelect);
  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    if (locations.single) {
      onLocationSelectRef.current(extractLocationFromPlace(locations.single));
    }
  }, [locations.single]);

  return (
    <div className="flex h-[450px] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm mt-3">
      <div className="relative z-20 border-b border-slate-100 bg-white p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={queries.single}
            onFocus={() => handleFocusPin("single")}
            onChange={(e) => handleInputChange(e.target.value, "single")}
            onKeyDown={(e) => e.key === "Enter" && handleSearchLocation("single")}
            placeholder={t("tour.mapSearchPlaceholder") || "Tìm kiếm địa điểm..."}
            className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white"
          />
          <ActionButton
            variant="secondary"
            onClick={handleLocateMe}
            disabled={isSearching}
            className="shrink-0 px-3 py-2"
            title={t("tour.mapUseCurrentLocation") || "Vị trí hiện tại"}
          >
            <Navigation className="h-4 w-4 text-indigo-600" />
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={() => handleSearchLocation("single")}
            disabled={isSearching}
            className="shrink-0 px-3 py-2"
          >
            <Search className="h-4 w-4" />
          </ActionButton>
        </div>

        {searchError && (
          <p className="mt-2 text-xs font-medium text-amber-600">{searchError}</p>
        )}

        {predictions.length > 0 && (
          <div className="absolute left-3 right-3 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                className="flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50"
                onClick={() =>
                  handleSelectPrediction(
                    prediction.place_id,
                    prediction.description,
                    "single",
                  )
                }
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
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
              latitude: markerCoordinates.single?.lat ?? 10.762622,
              longitude: markerCoordinates.single?.lng ?? 106.660172,
              zoom: 13,
            }}
            mapboxAccessToken={mapboxToken}
            mapStyle="mapbox://styles/mapbox/streets-v12"
            language="en"
            style={{ width: "100%", height: "100%" }}
            attributionControl={false}
            onLoad={() => {
              if (markerCoordinates.single) {
                mapRef.current?.jumpTo({
                  center: [markerCoordinates.single.lng, markerCoordinates.single.lat],
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
            {markerCoordinates.single && (
              <Marker
                latitude={markerCoordinates.single.lat}
                longitude={markerCoordinates.single.lng}
                draggable
                anchor="center"
                onDragEnd={(event) =>
                  handleMarkerDragEnd("single", {
                    lat: event.lngLat.lat,
                    lng: event.lngLat.lng,
                  })
                }
              >
                <div className="flex h-8 w-8 cursor-grab items-center justify-center rounded-full border-[3px] border-white bg-indigo-600 shadow-lg active:cursor-grabbing">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
              </Marker>
            )}
          </Map>
        ) : (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-amber-700">
            VITE_MAPBOX_TOKEN is missing.
          </div>
        )}
        {isSearching && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};
