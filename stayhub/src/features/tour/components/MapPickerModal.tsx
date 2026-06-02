import React from "react";
import { Search, X, Navigation, MapPin } from "lucide-react";
import { ActionButton } from "../../../components/dashboard/ActionButton";
import { useMapPicker, type MapPickerMode } from "../hooks/useMapPicker";

interface MapPickerModalProps {
  isOpen: boolean;
  mode?: MapPickerMode;
  initialData?: { 
    start?: { lat?: number, lng?: number, address?: string }, 
    end?: { lat?: number, lng?: number, address?: string }, 
    single?: { lat?: number, lng?: number, address?: string } 
  };
  onClose: () => void;
  onConfirm: (data: any) => void;
}

export const MapPickerModal: React.FC<MapPickerModalProps> = ({ isOpen, mode = 'single', initialData, onClose, onConfirm }) => {
  const {
    mapRef,
    queries,
    isSearching,
    locations,
    activePin,
    handleSearchLocation,
    handleLocateMe,
    predictions,
    handleInputChange,
    handleSelectPrediction,
    handleFocusPin
  } = useMapPicker(isOpen, mode, initialData);

  if (!isOpen) return null;

  const extractLocation = (loc: any) => {
    if (!loc) return null;
    let country = "";
    let city = "";
    loc.address_components?.forEach((component: any) => {
      if (component.types.includes("country")) {
        country = component.long_name;
      }
      if (
        component.types.includes("administrative_area_level_1") ||
        component.types.includes("locality")
      ) {
        if (!city) city = component.long_name;
      }
    });

    return {
      country,
      city,
      address: loc.formatted_address,
      lat: loc.geometry?.location?.lat?.(),
      lng: loc.geometry?.location?.lng?.(),
      locationName: loc.name || loc.formatted_address.split(',')[0],
    };
  };

  const confirmLocation = () => {
    if (mode === 'single') {
      if (!locations.single) return;
      onConfirm(extractLocation(locations.single));
    } else {
      if (!locations.start && !locations.end) return;
      onConfirm({ start: extractLocation(locations.start), end: extractLocation(locations.end) });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <h3 className="text-[15px] font-bold text-slate-800">
            Pick Location on Map
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative z-20 border-b border-slate-100 bg-white p-4 shadow-sm">
          {mode === 'single' ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={queries.single}
                onFocus={() => handleFocusPin('single')}
                onChange={(e) => handleInputChange(e.target.value, 'single')}
                onKeyDown={(e) => e.key === "Enter" && handleSearchLocation('single')}
                placeholder="Search for a place or click on the map..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-brand focus:bg-white"
              />
              <ActionButton variant="secondary" onClick={handleLocateMe} disabled={isSearching} className="shrink-0 px-4 py-2.5" title="Use Current Location">
                <Navigation className="h-4 w-4 text-indigo-600" />
              </ActionButton>
              <ActionButton variant="primary" onClick={() => handleSearchLocation('single')} disabled={isSearching} className="shrink-0 px-4 py-2.5">
                <Search className="h-4 w-4" />
              </ActionButton>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <div onClick={() => handleFocusPin('start')} className={`flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-xl font-bold text-white transition-all ${activePin === 'start' ? 'bg-emerald-500 shadow-md ring-2 ring-emerald-200 ring-offset-1' : 'bg-slate-300'}`}>A</div>
                <input type="text" value={queries.start} onFocus={() => handleFocusPin('start')} onChange={(e) => handleInputChange(e.target.value, 'start')} onKeyDown={(e) => e.key === "Enter" && handleSearchLocation('start')} placeholder="Start location..." className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white" />
                <ActionButton variant="secondary" onClick={handleLocateMe} disabled={isSearching} className="shrink-0 px-3" title="Use Current Location"><Navigation className="h-4 w-4 text-indigo-600" /></ActionButton>
                <ActionButton variant="primary" onClick={() => handleSearchLocation('start')} disabled={isSearching} className="shrink-0 px-3"><Search className="h-4 w-4" /></ActionButton>
              </div>
              <div className="flex gap-2">
                <div onClick={() => handleFocusPin('end')} className={`flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-xl font-bold text-white transition-all ${activePin === 'end' ? 'bg-rose-500 shadow-md ring-2 ring-rose-200 ring-offset-1' : 'bg-slate-300'}`}>B</div>
                <input type="text" value={queries.end} onFocus={() => handleFocusPin('end')} onChange={(e) => handleInputChange(e.target.value, 'end')} onKeyDown={(e) => e.key === "Enter" && handleSearchLocation('end')} placeholder="End location..." className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-rose-400 focus:bg-white" />
                <ActionButton variant="primary" onClick={() => handleSearchLocation('end')} disabled={isSearching} className="shrink-0 px-3"><Search className="h-4 w-4" /></ActionButton>
              </div>
            </div>
          )}

          {/* Danh sách gợi ý Autocomplete thả xuống */}
          {predictions.length > 0 && (
            <div className="absolute left-4 right-4 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-lg">
              {predictions.map((p: any, idx: number) => (
                <button
                  key={idx}
                  className="flex w-full items-start gap-3 px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
                  onClick={() => handleSelectPrediction(p.place_id, p.description, activePin)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700">{p.structured_formatting?.main_text || p.description}</span>
                    <span className="text-xs text-slate-500">{p.structured_formatting?.secondary_text || ''}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 flex-1 bg-slate-100">
          <div ref={mapRef} className="absolute inset-0" />
          {isSearching && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#4880ff]"></div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 p-4">
          <div className="line-clamp-1 flex-1 pr-4 text-sm font-medium text-slate-600">
            {mode === 'single' 
              ? (locations.single ? locations.single.formatted_address : "Click on the map to drop a pin") 
              : (
                <div className="flex gap-4">
                  <span className="text-emerald-600"><span className="font-bold">A:</span> {locations.start ? locations.start.formatted_address.split(',')[0] : '...'}</span>
                  <span className="text-rose-600"><span className="font-bold">B:</span> {locations.end ? locations.end.formatted_address.split(',')[0] : '...'}</span>
                </div>
              )}
          </div>
          <ActionButton variant="primary" onClick={confirmLocation} disabled={mode === 'single' ? !locations.single : (!locations.start && !locations.end)} className="px-6 py-2.5 shadow-sm">
            {mode === 'single' ? "Confirm Location" : "Confirm Route"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};