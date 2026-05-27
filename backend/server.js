/**
 * server.js – CyberSathi Backend Entry Point
 */
require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/utils/socket');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

initSocket(server);

connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`✅  CyberSathi backend running on http://localhost:${PORT}`);
    });
});
