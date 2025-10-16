import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface WelcomeState {
  entered: boolean;
  setEntered: (status: boolean) => void;
  reset: () => void;
}
const useWelcomeStatus = create<WelcomeState>()(
  persist(
    (set) => ({
      entered: false,

      setEntered: (status) => set(() => ({ entered: status })),
      reset: () => set({ entered: false }),
    }),
    {
      name: "welcome",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export default useWelcomeStatus;
