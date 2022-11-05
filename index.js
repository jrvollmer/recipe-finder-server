import express from "express";
import { createServer } from "http";
import index from "./api.js";

const PORT = 3000;
const APP = express();

APP.use(index);

const SERVER = createServer(APP);

SERVER.listen(PORT, () => console.log(`Listening on port ${PORT}`));

