# Firebase Deployment Guide

## Prerequisites

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Initialize Firebase in your project: `firebase init`

## Deployment Steps

### 1. Build the Application
```bash
npm run build
```

This will:
- Build the client application to `dist/client`
- Build and minify the server to `dist/index.js`

### 2. Deploy to Firebase
```bash
npm run firebase:deploy
```

Or manually:
```bash
firebase deploy
```

## Configuration Files

### firebase.json
- Configures Firebase Hosting to serve static files from `dist/client`
- Routes API calls to Cloud Run service `welcome`
- Sets up caching headers for static assets
- Configures Cloud Run with optimized settings:
  - Memory: 512MB (cost-effective)
  - Timeout: 60s
  - Min instances: 0 (cold starts)
  - Max instances: 10
  - Concurrency: 80

### Dockerfile
- Uses Node.js 20 Alpine for smaller image size
- Optimized for fast cold starts
- Includes health check endpoint
- Runs as non-root user for security
- Exposes port 8080 (Cloud Run default)

## Environment Variables

Ensure these are set in Firebase Functions configuration:

- `DATABASE_URL`: Your database connection string
- `PORT`: Automatically set to 8080 by Cloud Run
- Any Firebase-specific environment variables

Set environment variables:
```bash
firebase functions:config:set database.url="your-database-url"
```

## Health Check

The application includes a health check endpoint at `/api/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-07T12:00:00.000Z",
  "uptime": 123.456
}
```

## Cost Optimization

The deployment is optimized for cost-effectiveness:

1. **Min instances: 0** - Allows scaling to zero when not in use
2. **512MB memory** - Sufficient for most workloads while keeping costs low
3. **80 concurrency** - Handles multiple requests per instance
4. **Alpine Linux** - Smaller Docker image for faster cold starts
5. **Minified server bundle** - Reduces startup time

## Cold Start Optimization

1. **Minified server bundle** - Faster parsing and execution
2. **Production-optimized Express setup** - Minimal middleware overhead
3. **Graceful shutdown handling** - Proper cleanup on instance termination
4. **Health check endpoint** - Keeps instances warm when needed

## Troubleshooting

### Common Issues

1. **Port Configuration Error**
   - Ensure your application listens on `process.env.PORT`
   - Cloud Run automatically sets `PORT=8080`

2. **Build Directory Not Found**
   - Run `npm run build` before deploying
   - Verify `dist/client` and `dist/index.js` exist

3. **Database Connection Issues**
   - Verify `DATABASE_URL` environment variable is set
   - Ensure database is accessible from Cloud Run

4. **Static Files Not Serving**
   - Check that `dist/client` contains built frontend files
   - Verify firebase.json hosting configuration

### Debug Commands

```bash
# Test build locally
npm run build
npm start

# Test with Cloud Run port
PORT=8080 npm start

# Build and test Docker image
npm run docker:build
npm run docker:run

# Check Firebase configuration
firebase projects:list
firebase functions:config:get
```

### Logs

View logs in Firebase Console:
- Go to Firebase Console > Functions
- Select your function
- Click "Logs" tab

Or use CLI:
```bash
firebase functions:log
```

## Performance Monitoring

Monitor your deployment:

1. **Firebase Console** - View function metrics and logs
2. **Cloud Run Console** - Monitor container performance
3. **Health check** - Regular monitoring of `/api/health`

## Security Notes

1. **Non-root user** - Container runs as non-root for security
2. **Trusted proxy** - Configured for Cloud Run environment
3. **Minimal attack surface** - Only necessary dependencies included
4. **Environment isolation** - Production vs development configurations