import { useState, useRef, useEffect, useCallback } from "react";

export type MapPickerMode = 'single' | 'route';
export type ActivePin = 'single' | 'start' | 'end';

export const useMapPicker = (
  isOpen: boolean, 
  mode: MapPickerMode = 'single',
  initialData?: { 
    start?: { lat?: number, lng?: number, address?: string }, 
    end?: { lat?: number, lng?: number, address?: string }, 
    single?: { lat?: number, lng?: number, address?: string } 
  }
) => {
  const [activePin, setActivePin] = useState<ActivePin>(mode === 'route' ? 'start' : 'single');
  const activePinRef = useRef<ActivePin>(activePin);
  const [queries, setQueries] = useState({ single: "", start: "", end: "" });
  const [locations, setLocations] = useState<any>({ single: null, start: null, end: null });
  const [isSearching, setIsSearching] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null); // Dùng cho single/start
  const endMarkerRef = useRef<any>(null); // Dùng cho end
  const dirRendererRef = useRef<any>(null); // Vẽ đường đi

  const initialDataRef = useRef(initialData);

  useEffect(() => {
    initialDataRef.current = initialData;
  }, [initialData]);

  useEffect(() => {
    activePinRef.current = activePin;
  }, [activePin]);

  // Hàm tiện ích: Tìm theo tên địa điểm hoặc địa chỉ bằng Places API (Tốt hơn Geocoder)
  const searchPlaceByNameOrAddress = useCallback((query: string, callback: (place: any) => void) => {
    const service = new (window as any).google.maps.places.PlacesService(mapInstanceRef.current);
    service.findPlaceFromQuery({
      query: query,
      fields: ['name', 'geometry', 'formatted_address', 'address_components', 'place_id'],
    }, (results: any, status: any) => {
      if (status === "OK" && results && results[0]) {
        service.getDetails({
          placeId: results[0].place_id,
          fields: ['name', 'geometry', 'formatted_address', 'address_components']
        }, (detailPlace: any, detailStatus: any) => {
          callback(detailStatus === "OK" && detailPlace ? detailPlace : results[0]);
        });
      } else {
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ 
          address: query,
          componentRestrictions: { country: 'vn' } // THU HẸP: Ưu tiên tìm ở VN khi fallback
        }, (geoResults: any, geoStatus: any) => {
          callback(geoStatus === "OK" && geoResults && geoResults[0] ? geoResults[0] : null);
        });
      }
    });
  }, []);

  const initMap = useCallback(() => {
    if (!mapRef.current || !(window as any).google) return;
    const initial = initialDataRef.current;

    const defaultLoc = { lat: 10.762622, lng: 106.660172 }; // Default: HCM City

    const startLoc = (initial?.start?.lat && initial?.start?.lng) ? { lat: Number(initial.start.lat), lng: Number(initial.start.lng) } : defaultLoc;
    const endLoc = (initial?.end?.lat && initial?.end?.lng) ? { lat: Number(initial.end.lat), lng: Number(initial.end.lng) } : { lat: defaultLoc.lat, lng: defaultLoc.lng + 0.045 };
    const singleLoc = (initial?.single?.lat && initial?.single?.lng) ? { lat: Number(initial.single.lat), lng: Number(initial.single.lng) } : defaultLoc;

    const mapCenter = mode === 'route' ? startLoc : singleLoc;

    const map = new (window as any).google.maps.Map(mapRef.current, {
      center: mapCenter,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
    });

    const marker = new (window as any).google.maps.Marker({
      map: map, // Luôn vẽ ghim
      position: mode === 'route' ? startLoc : singleLoc,
      draggable: true,
      animation: (window as any).google.maps.Animation.DROP,
      icon: mode === 'route' ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : null
    });
    
    const endMarker = new (window as any).google.maps.Marker({
      map: mode === 'route' ? map : null, // Ghim B chỉ có ở Route Mode
      position: endLoc,
      draggable: true,
      animation: (window as any).google.maps.Animation.DROP,
      icon: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
    });

    const dirRenderer = new (window as any).google.maps.DirectionsRenderer({
      map,
      suppressMarkers: true, 
      preserveViewport: true,
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;
    endMarkerRef.current = endMarker;
    dirRendererRef.current = dirRenderer;

    if (mode === 'route') {
      const hasStart = Boolean(initial?.start?.lat && initial?.start?.lng);
      const hasEnd = Boolean(initial?.end?.lat && initial?.end?.lng);

      if (hasStart) {
        reverseGeocode(startLoc, 'start');
      } else if (initial?.start?.address) {
        searchPlaceByNameOrAddress(initial.start.address, (place) => {
          if (place) {
            marker.setPosition(place.geometry.location);
            map.setCenter(place.geometry.location);
            setLocations((prev: any) => ({ ...prev, start: place }));
            setQueries((prev: any) => ({ ...prev, start: place.name || place.formatted_address }));
          } else reverseGeocode(startLoc, 'start');
        });
      } else reverseGeocode(startLoc, 'start');

      if (hasEnd) {
        reverseGeocode(endLoc, 'end');
      } else if (initial?.end?.address) {
        searchPlaceByNameOrAddress(initial.end.address, (place) => {
          if (place) {
            endMarker.setPosition(place.geometry.location);
            setLocations((prev: any) => ({ ...prev, end: place }));
            setQueries((prev: any) => ({ ...prev, end: place.name || place.formatted_address }));
          } else reverseGeocode(endLoc, 'end');
        });
      } else reverseGeocode(endLoc, 'end');
    } else {
      const hasSingle = Boolean(initial?.single?.lat && initial?.single?.lng);
      if (hasSingle) {
        reverseGeocode(singleLoc, 'single');
      } else if (initial?.single?.address) {
        searchPlaceByNameOrAddress(initial.single.address, (place) => {
          if (place) {
            marker.setPosition(place.geometry.location);
            map.setCenter(place.geometry.location);
            setLocations((prev: any) => ({ ...prev, single: place }));
            setQueries((prev: any) => ({ ...prev, single: place.name || place.formatted_address }));
          } else reverseGeocode(singleLoc, 'single');
        });
      } else reverseGeocode(singleLoc, 'single');
    }

    map.addListener("click", (e: any) => {
      const latLng = e.latLng;
      const currentPin = activePinRef.current;

      if (currentPin === 'single' || currentPin === 'start') {
        marker.setPosition(latLng);
        marker.setMap(map);
        reverseGeocode(latLng, currentPin, true);
      } else if (currentPin === 'end') {
        endMarker.setPosition(latLng);
        endMarker.setMap(map);
        reverseGeocode(latLng, currentPin, true);
      }
    });

    marker.addListener("dragend", () => {
      const latLng = marker.getPosition();
      reverseGeocode(latLng, mode === 'route' ? 'start' : 'single');
    });

    endMarker.addListener("dragend", () => {
      const latLng = endMarker.getPosition();
      reverseGeocode(latLng, 'end');
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, searchPlaceByNameOrAddress]);

  const reverseGeocode = (latLng: any, pin: ActivePin, switchPin = false) => {
    setIsSearching(true);
    setPredictions([]); // Ẩn gợi ý khi thao tác trực tiếp trên Map
    const geocoder = new (window as any).google.maps.Geocoder();
    geocoder.geocode({ location: latLng }, (results: any, status: any) => {
      if (status === "OK" && results && results[0]) {
        const service = new (window as any).google.maps.places.PlacesService(mapInstanceRef.current);
        service.getDetails({
          placeId: results[0].place_id,
          fields: ['name', 'formatted_address', 'address_components', 'geometry']
        }, (place: any, placeStatus: any) => {
          setIsSearching(false);
          const finalPlace = (placeStatus === "OK" && place) ? place : results[0];
          setLocations((prev: any) => ({ ...prev, [pin]: finalPlace }));
          setQueries((prev: any) => ({ ...prev, [pin]: finalPlace.name || finalPlace.formatted_address }));

          if (switchPin && mode === 'route') {
            if (pin === 'start') setActivePin('end');
            if (pin === 'end') setActivePin('start');
          }
        });
      } else {
        setIsSearching(false);
      }
    });
  };

  // Vẽ đường đi (Directions) khi có đủ Start và End
  useEffect(() => {
    if (mode === 'route' && locations.start && locations.end && dirRendererRef.current) {
      const directionsService = new (window as any).google.maps.DirectionsService();
      directionsService.route({
        origin: locations.start.geometry.location,
        destination: locations.end.geometry.location,
        travelMode: 'DRIVING'
      }, (response: any, status: any) => {
        if (status === 'OK') {
          dirRendererRef.current.setDirections(response);
        }
      });
    }
  }, [locations.start, locations.end, mode]);

  useEffect(() => {
    if (isOpen) {
      if (!(window as any).google) {
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=en`; // Ưu tiên tiếng Việt
        script.async = true;
        script.defer = true;
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        setQueries({ single: "", start: "", end: "" });
        setLocations({ single: null, start: null, end: null });
        setActivePin(mode === 'route' ? 'start' : 'single');
        setPredictions([]);
        initMap();
      }
    }
  }, [isOpen, initMap, mode]);

  const handleSearchLocation = async (pin: ActivePin) => {
    const query = queries[pin];
    if (!query.trim() || !(window as any).google) return;
    setPredictions([]); // Ẩn gợi ý khi bấm Enter/Tìm kiếm
    setIsSearching(true);
    
    searchPlaceByNameOrAddress(query, (place) => {
      setIsSearching(false);
      if (place) {
        const loc = place.geometry.location;
        mapInstanceRef.current?.setCenter(loc);
        mapInstanceRef.current?.setZoom(15);
        
        if (pin === 'single' || pin === 'start') {
          markerRef.current?.setPosition(loc);
          markerRef.current?.setMap(mapInstanceRef.current);
        } else if (pin === 'end') {
          endMarkerRef.current?.setPosition(loc);
          endMarkerRef.current?.setMap(mapInstanceRef.current);
        }

        setLocations((prev: any) => ({ ...prev, [pin]: place }));
        setQueries((prev: any) => ({ ...prev, [pin]: place.name || place.formatted_address }));
      }
    });
  };

  const handleLocateMe = () => {
    setPredictions([]);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    
    setIsSearching(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latLng = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        mapInstanceRef.current?.setCenter(latLng);
        mapInstanceRef.current?.setZoom(15);
        
        const currentPin = activePinRef.current;
        if (currentPin === 'single' || currentPin === 'start') {
          markerRef.current?.setPosition(latLng);
          markerRef.current?.setMap(mapInstanceRef.current);
        } else if (currentPin === 'end') {
          endMarkerRef.current?.setPosition(latLng);
          endMarkerRef.current?.setMap(mapInstanceRef.current);
        }
        reverseGeocode(latLng, currentPin);
      },
      (error) => {
        console.error("Error getting location", error);
        setIsSearching(false);
        alert("Unable to retrieve your location. Please check your browser permissions.");
      }
    );
  };

  // Hàm lấy gợi ý khi người dùng gõ
  const handleInputChange = (value: string, pin: ActivePin) => {
    setQueries((prev) => ({ ...prev, [pin]: value }));
    // SỬA LỖI: Kiểm tra kỹ thư viện 'places' đã sẵn sàng chưa để tránh trắng trang
    if (!value.trim() || !(window as any).google?.maps?.places) {
      setPredictions([]);
      return;
    }
    const autocompleteService = new (window as any).google.maps.places.AutocompleteService();
    autocompleteService.getPlacePredictions({ 
      input: value, 
      language: 'vi',
      componentRestrictions: { country: 'vn' } // THU HẸP: Chỉ tìm ở Việt Nam
    }, (results: any, status: any) => {
      setPredictions(status === "OK" && results ? results : []);
    });
  };

  // Hàm xử lý khi bấm chọn 1 dòng gợi ý
  const handleSelectPrediction = (placeId: string, description: string, pin: ActivePin) => {
    setQueries((prev) => ({ ...prev, [pin]: description }));
    setPredictions([]);
    setIsSearching(true);

    const service = new (window as any).google.maps.places.PlacesService(mapInstanceRef.current);
    service.getDetails({ placeId: placeId, fields: ['name', 'geometry', 'formatted_address', 'address_components'] }, (place: any, status: any) => {
      setIsSearching(false);
      if (status === "OK" && place) {
        const loc = place.geometry.location;
        mapInstanceRef.current?.setCenter(loc);
        mapInstanceRef.current?.setZoom(15);
        if (pin === 'single' || pin === 'start') {
          markerRef.current?.setPosition(loc);
          markerRef.current?.setMap(mapInstanceRef.current);
        } else if (pin === 'end') {
          endMarkerRef.current?.setPosition(loc);
          endMarkerRef.current?.setMap(mapInstanceRef.current);
        }
        setLocations((prev: any) => ({ ...prev, [pin]: place }));
        setQueries((prev: any) => ({ ...prev, [pin]: place.name || place.formatted_address }));
      }
    });
  };

  // Hàm nhảy bản đồ đến mục tiêu khi bấm (A hoặc B)
  const handleFocusPin = (pin: ActivePin) => {
    if (activePin !== pin) {
      setActivePin(pin);
      setPredictions([]);
    }
    const loc = locations[pin];
    if (loc && loc.geometry && mapInstanceRef.current) {
      mapInstanceRef.current.setCenter(loc.geometry.location);
      mapInstanceRef.current.setZoom(16); // Phóng to sát mục tiêu để dễ nhìn
    }
  };

  return {
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
  };
};