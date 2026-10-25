import { describe, expect, it } from "vitest";
import { SERVICE_CONFIG } from "./service-config";

describe("the existing external connection", () => {
  it("preserves the user-selected project", () => {
    expect(SERVICE_CONFIG.projectId).toBe("xprysgjlwouonpylgusb");
  });
  it("preserves the user-selected service URL", () => {
    expect(SERVICE_CONFIG.url).toBe("https://xprysgjlwouonpylgusb.supabase.co");
  });
  it("preserves the user-selected publishable value", () => {
    expect(SERVICE_CONFIG.publishableKey).toBe("sb_publishable_Cdh8umqD_Z49bAJ2VcW2nQ_OXDJhMZ6");
  });
});