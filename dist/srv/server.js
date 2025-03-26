"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cds_1 = __importDefault(require("@sap/cds"));
cds_1.default.on('bootstrap', (app) => {
    console.log('CAP service is gestart met OAuth 2.0 authenticatie.');
});
exports.default = cds_1.default.server;
