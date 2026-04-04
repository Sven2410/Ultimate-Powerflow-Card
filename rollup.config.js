import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import { terser } from "rollup-plugin-terser";

const dev = process.env.ROLLUP_WATCH;

export default {
  input: "src/index.ts",
  output: {
    file: "dist/ultimate-powerflow-card.js",
    format: "es",
    sourcemap: dev ? true : false,
  },
  plugins: [
    resolve({ browser: true }),
    commonjs(),
    typescript({
      declaration: false,
      sourceMap: dev ? true : false,
    }),
    !dev && terser(),
  ],
  external: [],
};
