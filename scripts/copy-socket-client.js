#!/usr/bin/env node
/**
 * copy-socket-client.js — run via `npm run prepare`
 * Copies the socket.io client bundle into public/socket.io/ so it is always
 * available as a static asset even before the socket.io server sets up its
 * own built-in file-serving handler.
 */
const fs   = require('fs');
const path = require('path');

const src  = path.resolve(__dirname, '../node_modules/socket.io/client-dist/socket.io.js');
const dest = path.resolve(__dirname, '../public/socket.io/socket.io.js');

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(src, dest);
console.log(`Copied socket.io client → ${path.relative(process.cwd(), dest)}`);
