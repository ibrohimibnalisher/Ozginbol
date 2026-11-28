import { useRef } from "react";
import { Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button, Muted } from "../components/ui";
import { useTheme } from "../theme";

/** Full-screen barcode scanner (EAN-13 / EAN-8 / UPC on food packages). */
export default function Scanner({ onCode, onCancel }: { onCode: (code: string) => void; onCancel: () => void }) {
  const t = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const done = useRef(false);

  if (!permission) return <View style={{ flex: 1, backgroundColor: "#000" }} />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, padding: 24, justifyContent: "center", gap: 14, backgroundColor: t.bg }}>
        <Text style={{ color: t.text, fontSize: 18, fontWeight: "700" }}>Kameraga ruxsat kerak</Text>
        <Muted>Shtrix-kodni o'qish uchun kamera ishlatiladi. Rasm saqlanmaydi.</Muted>
        <Button title="Ruxsat berish" onPress={requestPermission} />
        <Button kind="ghost" title="Bekor qilish" onPress={onCancel} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
        onBarcodeScanned={({ data }) => {
          if (done.current) return;
          done.current = true;
          onCode(data);
        }}
      />
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 40, alignItems: "center", gap: 12 }}>
        <Text style={{ color: "#fff", fontSize: 16 }}>Shtrix-kodni ramkaga to'g'rilang</Text>
        <View style={{ width: 200 }}>
          <Button kind="ghost" title="Bekor qilish" onPress={onCancel} />
        </View>
      </View>
    </View>
  );
}
