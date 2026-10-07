import config from "../../film.config.json" with { type: "json" };
import grid from "../../grid.json" with { type: "json" };
import { defineFilm } from "../engine/runtime.js";
import { hook } from "./scenes/hook.js";
import { product } from "./scenes/product.js";
import { logo } from "./scenes/logo.js";

defineFilm({ config, grid, scenes: [product, hook, logo] });
