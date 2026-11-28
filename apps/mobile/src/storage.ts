import AsyncStorage from "@react-native-async-storage/async-storage";
import { EMPTY, type DiaryState } from "./diary";

const KEY = "ozginbol.diary.v1";
const KEEP_DAYS = 400;

export async function loadState(): Promise<DiaryState> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as DiaryState;
    return parsed.version === 1 ? { ...EMPTY, ...parsed } : EMPTY;
  } catch {
    return EMPTY;
  }
}

export async function saveState(s: DiaryState): Promise<void> {
  const cutoff = Date.now() - KEEP_DAYS * 86_400_000;
  const trimmed: DiaryState = { ...s, entries: s.entries.filter((e) => e.at >= cutoff) };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full or unavailable: keep working in memory.
  }
}
