import { useState } from 'react';
import * as Location from 'expo-location';
import useLocationStore from '../stores/useLocationStore';

export default function useLocation() {
  const { location, setLocation } = useLocationStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setPermissionDenied(true);
        setError('Location permission denied');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setLocation(coords);
      return coords;
    } catch (err) {
      setError('Could not get your location');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { location, loading, error, permissionDenied, requestLocation };
}
