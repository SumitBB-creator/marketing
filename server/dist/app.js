"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const platform_routes_1 = __importDefault(require("./routes/platform.routes"));
const marketer_routes_1 = __importDefault(require("./routes/marketer.routes"));
const lead_routes_1 = __importDefault(require("./routes/lead.routes"));
const analytics_routes_1 = __importDefault(require("./routes/analytics.routes"));
const branding_routes_1 = __importDefault(require("./routes/branding.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const stickyNote_routes_1 = __importDefault(require("./routes/stickyNote.routes"));
const import_routes_1 = __importDefault(require("./routes/import.routes"));
const public_routes_1 = __importDefault(require("./routes/public.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use((0, morgan_1.default)('dev'));
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/platforms', platform_routes_1.default);
app.use('/api/marketers', marketer_routes_1.default);
app.use('/api/leads', lead_routes_1.default);
app.use('/api/analytics', analytics_routes_1.default);
app.use('/api/branding', branding_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/notes', stickyNote_routes_1.default);
app.use('/api/import', import_routes_1.default);
app.use('/api/shared', public_routes_1.default);
app.use('/api/users', user_routes_1.default);
// Serve uploads statically
// Serve uploads via API route now
// import path from 'path';
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});
exports.default = app;
