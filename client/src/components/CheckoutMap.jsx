import { LocateFixed } from "lucide-react";
import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/684/684908.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function DraggableMarker({ position, setPosition }) {
  const map = useMap();

  useEffect(() => {
    const timeout = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(timeout);
  }, [map]);

  useEffect(() => {
    map.setView(position, 15, { animate: true });
  }, [position, map]);

  return (
    <Marker
      icon={markerIcon}
      position={position}
      draggable
      eventHandlers={{
        dragend: (event) => {
          const marker = event.target;
          const { lat, lng } = marker.getLatLng();
          setPosition([lat, lng]);
        },
      }}
    />
  );
}

function ClickToMovePin({ setPosition }) {
  useMapEvents({
    click: (event) => {
      setPosition([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export default function CheckoutMap({ position, setPosition }) {
  const [locating, setLocating] = useState(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation || locating) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (currentPosition) => {
        setPosition([currentPosition.coords.latitude, currentPosition.coords.longitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
  };

  return (
    <div className="relative h-full w-full">
      <button
        type="button"
        onClick={useCurrentLocation}
        disabled={locating}
        className="absolute right-3 top-3 z-[1000] flex h-11 w-11 items-center justify-center rounded-full border border-white/80 bg-white/90 text-emerald-700 shadow-lg transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        title="Use current location"
      >
        <LocateFixed className={`h-5 w-5 ${locating ? "animate-spin" : ""}`} />
      </button>
      <MapContainer center={position} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickToMovePin setPosition={setPosition} />
        <DraggableMarker position={position} setPosition={setPosition} />
      </MapContainer>
    </div>
  );
}
