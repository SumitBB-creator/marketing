import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes';
import platformRoutes from './routes/platform.routes';
import marketerRoutes from './routes/marketer.routes';
import leadRoutes from './routes/lead.routes';
import analyticsRoutes from './routes/analytics.routes';
import brandingRoutes from './routes/branding.routes';
import uploadRoutes from './routes/upload.routes';
import stickyNoteRoutes from './routes/stickyNote.routes';
import importRoutes from './routes/import.routes';
import publicRoutes from './routes/public.routes';
import userRoutes from './routes/user.routes';

const app: Application = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/marketers', marketerRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notes', stickyNoteRoutes);
app.use('/api/import', importRoutes);
app.use('/api/shared', publicRoutes);
app.use('/api/users', userRoutes);

// Serve uploads statically
// Serve uploads via API route now
// import path from 'path';
// app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

export default app;
