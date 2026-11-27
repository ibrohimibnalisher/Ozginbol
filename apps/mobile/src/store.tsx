import { createContext, useContext, useEffect, useReducer, useRef, useState, type Dispatch, type ReactNode } from "react";
import { EMPTY, reducer, type Action, type DiaryState } from "./diary";
import { loadState, saveState } from "./storage";

const Ctx = createContext<{ state: DiaryState; dispatch: Dispatch<Action>; ready: boolean } | null>(null);

export function DiaryProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, EMPTY);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    loadState().then((s) => {
      dispatch({ type: "load", state: s });
      loaded.current = true;
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (loaded.current) void saveState(state);
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch, ready }}>{children}</Ctx.Provider>;
}

export function useDiary() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useDiary outside DiaryProvider");
  return v;
}
