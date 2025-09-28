import type { FC } from "react";
import ElegantBlue from "./elegant-blue/ElegantBlue";

export type PreviewProps = {
  captureId?: string;
};

export type PreviewEntry = {
  id: "ElegantBlue"; // extend as you add
  component: FC<PreviewProps>;
};

export const PREVIEWS: Record<PreviewEntry["id"], PreviewEntry> = {
  ElegantBlue: { id: "ElegantBlue", component: ElegantBlue },
};
