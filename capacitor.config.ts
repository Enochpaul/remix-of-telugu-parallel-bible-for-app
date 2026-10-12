import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.enochpaul.telugubible",
  appName: "Telugu Bible",
  webDir: "dist/client",
  android: { allowMixedContent: false },
};

export default config;
