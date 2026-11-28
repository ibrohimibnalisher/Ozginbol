import { Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";

const DIR = `${FileSystem.documentDirectory ?? ""}progress/`;

export type PhotoSource = "camera" | "library";

/**
 * Takes or picks a photo and copies it into the app's own documents folder,
 * so it survives cache cleanup and never leaves the phone. On web the image
 * is kept as a compressed data URI. Returns null if cancelled or not allowed.
 */
export async function pickPhoto(from: PhotoSource): Promise<string | null | "denied"> {
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.6, allowsEditing: true, aspect: [3, 4], base64: Platform.OS === "web" };
  if (from === "camera") {
    const p = await ImagePicker.requestCameraPermissionsAsync();
    if (!p.granted) return "denied";
  }
  const res = from === "camera" ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (res.canceled || !res.assets[0]) return null;
  const a = res.assets[0];
  if (Platform.OS === "web") return a.base64 ? `data:${a.mimeType ?? "image/jpeg"};base64,${a.base64}` : a.uri;
  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => undefined);
  const to = `${DIR}${Date.now().toString(36)}.jpg`;
  await FileSystem.copyAsync({ from: a.uri, to });
  return to;
}

export async function deletePhotoFile(uri: string): Promise<void> {
  if (Platform.OS === "web" || !uri.startsWith(DIR)) return;
  await FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => undefined);
}

export async function deleteAllPhotoFiles(): Promise<void> {
  if (Platform.OS === "web" || !FileSystem.documentDirectory) return;
  await FileSystem.deleteAsync(DIR, { idempotent: true }).catch(() => undefined);
}
