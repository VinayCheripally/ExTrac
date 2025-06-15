import { useEffect, useState } from "react";
import { NativeModules, Text, View } from "react-native";

const { SMSModule } = NativeModules;

export default function HomeScreen() {
  const [smsContent, setSmsContent] = useState("No message yet");

  useEffect(() => {
    const getSMS = async () => {
      try {
        const latestSMS = await SMSModule.getLatestSMS();
        setSmsContent(latestSMS || "No message yet");
      } catch (error) {
        console.error("Failed to get SMS:", error);
      }
    };

    // poll every 2 seconds
    const interval = setInterval(getSMS, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 18, padding: 20 }}>{smsContent}</Text>
    </View>
  );
}
