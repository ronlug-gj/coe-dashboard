/* The app's single data entry point. vite.config.js points @data / @works at the real
 * data, or at the dummy พ.ค. 2573 data in src/demo/ when Vite runs with `--mode demo`. */
export * from "@data";
export { CLINIC_WORKS } from "@works";
export const IS_DEMO = import.meta.env.MODE === "demo";
