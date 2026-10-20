import { createStart } from "@tanstack/react-start";

// Load Start's server-route type augmentation without changing existing handlers.
export const startInstance = createStart(() => ({}));