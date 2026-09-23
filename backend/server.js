const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');
const Application = require('./models/Application');

// Load env vars
dotenv.config();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set security headers
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/workflows', require('./routes/workflows'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/password-resets', require('./routes/passwordResets'));

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Migration function to fix absolute paths in the database
const migrateFilePaths = async () => {
  try {
    const applications = await Application.find({ 'files.path': { $regex: /[:\\]/ } });
    if (applications.length === 0) return;

    console.log(`Found ${applications.length} applications with potential absolute paths. Migrating...`);

    for (const app of applications) {
      let changed = false;
      app.files = app.files.map(file => {
        if (file.path && (file.path.includes(':\\') || file.path.includes(':/'))) {
          const parts = file.path.split(/[\\\/]uploads[\\\/]/);
          if (parts.length > 1) {
            file.path = 'uploads/' + parts[1];
            changed = true;
          }
        }
        // Also ensure forward slashes
        if (file.path && file.path.includes('\\')) {
          file.path = file.path.replace(/\\/g, '/');
          changed = true;
        }
        return file;
      });

      if (changed) {
        await Application.updateOne({ _id: app._id }, { $set: { files: app.files } });
      }
    }
    console.log('File path migration completed.');
  } catch (err) {
    console.error('Migration error:', err);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    // Run migration after DB connection
    await migrateFilePaths();
    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
  }
};

startServer();
