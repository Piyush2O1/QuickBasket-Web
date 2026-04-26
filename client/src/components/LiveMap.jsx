import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

const defaultCenter = [28.6139, 77.209];

const deliveryBoyIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/9561/9561688.png",
  iconSize: [45, 45],
});

const userIcon = L.icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/128/4821/4821951.png",
  iconSize: [45, 45],
});

const isValidLocation = (location) => {
  if (!location) return false;

  const { latitude, longitude } = location;
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !(latitude === 0 && longitude === 0)
  );
};

function Recenter({ userLocation, deliveryBoyLocation, routePath }) {
  const map = useMap();

  useEffect(() => {
    const timeout = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(timeout);
  }, [map]);

  useEffect(() => {
    if (routePath.length > 1) {
      map.fitBounds(routePath, {
        padding: [45, 45],
        animate: true,
      });
      return;
    }

    const hasUserLocation = isValidLocation(userLocation);
    const hasDeliveryBoyLocation = isValidLocation(deliveryBoyLocation);

    if (hasUserLocation && hasDeliveryBoyLocation) {
      map.fitBounds(
        [
          [userLocation.latitude, userLocation.longitude],
          [deliveryBoyLocation.latitude, deliveryBoyLocation.longitude],
        ],
        {
          padding: [45, 45],
          animate: true,
        },
      );
      return;
    }

    if (hasDeliveryBoyLocation) {
      map.setView([deliveryBoyLocation.latitude, deliveryBoyLocation.longitude], 15, {
        animate: true,
      });
      return;
    }

    if (hasUserLocation) {
      map.setView([userLocation.latitude, userLocation.longitude], 15, { animate: true });
    }
  }, [deliveryBoyLocation, routePath, userLocation, map]);

  return null;
}

export default function LiveMap({ userLocation, deliveryLocation, deliveryBoyLocation }) {
  const deliveryPartnerLocation = deliveryBoyLocation || deliveryLocation;
  const [routeData, setRouteData] = useState({
    signature: "",
    path: [],
  });
  const hasUserLocation = isValidLocation(userLocation);
  const hasDeliveryBoyLocation = isValidLocation(deliveryPartnerLocation);
  const routeSignature =
    hasDeliveryBoyLocation && hasUserLocation
      ? `${deliveryPartnerLocation.latitude},${deliveryPartnerLocation.longitude}:${userLocation.latitude},${userLocation.longitude}`
      : "";

  useEffect(() => {
    if (!(hasDeliveryBoyLocation && hasUserLocation)) return undefined;

    const controller = new AbortController();

    const loadRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${deliveryPartnerLocation.longitude},${deliveryPartnerLocation.latitude};${userLocation.longitude},${userLocation.latitude}?overview=full&geometries=geojson`,
          { signal: controller.signal, cache: "no-store" },
        );
        const data = await response.json();
        const coordinates = data?.routes?.[0]?.geometry?.coordinates;

        if (Array.isArray(coordinates) && coordinates.length > 1) {
          setRouteData({
            signature: routeSignature,
            path: coordinates.map(([longitude, latitude]) => [latitude, longitude]),
          });
          return;
        }

        setRouteData({ signature: routeSignature, path: [] });
      } catch (error) {
        if (!controller.signal.aborted) {
          console.log(error);
          setRouteData({ signature: routeSignature, path: [] });
        }
      }
    };

    loadRoute();

    return () => controller.abort();
  }, [
    deliveryPartnerLocation?.latitude,
    deliveryPartnerLocation?.longitude,
    hasDeliveryBoyLocation,
    hasUserLocation,
    routeSignature,
    userLocation?.latitude,
    userLocation?.longitude,
  ]);

  const fallbackLine = useMemo(() => {
    if (!(hasDeliveryBoyLocation && hasUserLocation)) {
      return [];
    }

    return [
      [deliveryPartnerLocation.latitude, deliveryPartnerLocation.longitude],
      [userLocation.latitude, userLocation.longitude],
    ];
  }, [
    deliveryPartnerLocation?.latitude,
    deliveryPartnerLocation?.longitude,
    hasDeliveryBoyLocation,
    hasUserLocation,
    userLocation?.latitude,
    userLocation?.longitude,
  ]);

  const routePath = routeData.signature === routeSignature ? routeData.path : [];
  const linePositions = routePath.length > 1 ? routePath : fallbackLine;
  const center = hasDeliveryBoyLocation
    ? [deliveryPartnerLocation.latitude, deliveryPartnerLocation.longitude]
    : hasUserLocation
      ? [userLocation.latitude, userLocation.longitude]
      : defaultCenter;

  return (
    <div className="relative z-0 h-[500px] w-full overflow-hidden rounded-[26px] shadow">
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
        <Recenter
          userLocation={userLocation}
          deliveryBoyLocation={deliveryPartnerLocation}
          routePath={linePositions}
        />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {hasUserLocation && (
          <Marker position={[userLocation.latitude, userLocation.longitude]} icon={userIcon}>
            <Popup>Delivery address</Popup>
          </Marker>
        )}

        {hasDeliveryBoyLocation && (
          <Marker
            position={[deliveryPartnerLocation.latitude, deliveryPartnerLocation.longitude]}
            icon={deliveryBoyIcon}
          >
            <Popup>Delivery partner</Popup>
          </Marker>
        )}

        {linePositions.length > 0 && (
          <Polyline
            positions={linePositions}
            pathOptions={{
              color: "#16a34a",
              weight: 5,
              opacity: 0.85,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
