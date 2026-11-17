import { create } from "zustand";
import { emitGameSounds } from "../audio/gameSounds";
import {
  Command,
  State,
  initialState,
  loadSave,
  reduce,
} from "../game/domain/engine";
const key = "the-mirrors-save-v1";
interface Store {
  game: State | null;
  error: string;
  notice: string;
  start: (names: string[], seed: string) => void;
  dispatch: (command: Command) => boolean;
  resume: () => void;
  save: () => void;
  home: () => void;
}
export const useGameStore = create<Store>((set, get) => ({
  game: null,
  error: "",
  notice: "",
  start: (names, seed) => {
    try {
      // Generate fresh entropy only at the new-game boundary, keeping the engine
      // deterministic and saved expeditions reproducible.
      const game = initialState(
        names,
        seed.trim() ? seed : crypto.randomUUID(),
      );
      set({ game, error: "", notice: "" });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  dispatch: (command) => {
    try {
      const before = get().game!;
      const game = reduce(before, command);
      set({ game, error: "", notice: "" });
      emitGameSounds(before, game, command);
      try {
        localStorage.setItem(key, JSON.stringify(game));
      } catch {
        set({ notice: "Autosave unavailable. Keep this tab open." });
      }
      return true;
    } catch (e) {
      set({ error: (e as Error).message });
      return false;
    }
  },
  resume: () => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) throw Error("No saved game yet. Begin a new expedition.");
      const game = loadSave(raw);
      game.privacy = true;
      set({ game, error: "", notice: "Saved expedition restored." });
    } catch (e) {
      set({ error: (e as Error).message });
    }
  },
  save: () => {
    try {
      localStorage.setItem(key, JSON.stringify(get().game));
      set({ notice: "Expedition saved on this browser.", error: "" });
    } catch {
      set({ error: "This browser could not save the game." });
    }
  },
  home: () => set({ game: null, error: "", notice: "" }),
}));
