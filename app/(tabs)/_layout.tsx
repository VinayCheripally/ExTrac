import { Stack } from "expo-router";
import { useEffect } from "react";
import { PermissionsAndroid, Platform } from "react-native";

export default function RootLayout() {
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
          {
            title: "SMS Permission",
            message: "App needs access to receive SMS messages",
            buttonPositive: "OK",
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log("SMS permission granted");
        } else {
          console.log("SMS permission denied");
        }
      }
    };

    requestPermissions();
  }, []);

  return <Stack />;
}
