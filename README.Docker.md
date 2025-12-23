# Docker Setup for FPI-CONNECT Frontend

## Production Build

### Build the Docker image:
```bash
docker build -t fpi-connect-frontend .
```

### Run the container:
```bash
docker run -d -p 3000:80 --name fpi-connect-frontend fpi-connect-frontend
```

### Using Docker Compose:
```bash
docker-compose up -d
```

The application will be available at `http://localhost:3000`

## Development Build

### Build the development image:
```bash
docker build -f Dockerfile.dev -t fpi-connect-frontend:dev .
```

### Run the development container:
```bash
docker run -d -p 3000:3000 -v $(pwd)/src:/app/src -v $(pwd)/public:/app/public --name fpi-connect-frontend-dev fpi-connect-frontend:dev
```

## Environment Variables

**Important:** For production builds, environment variables must be set at **build time** using build args, as Vite embeds them during the build process.

### Using Docker Build:

```bash
docker build --build-arg VITE_API_URL=http://your-api-url/api/v1 -t fpi-connect-frontend .
```

### Using Docker Compose:

Create a `.env` file in the project root:
```env
VITE_API_URL=http://your-api-url/api/v1
```

Then run:
```bash
docker-compose up -d --build
```

The docker-compose.yml will automatically use the `VITE_API_URL` from your `.env` file as a build argument.

## Stop and Remove

```bash
docker stop fpi-connect-frontend
docker rm fpi-connect-frontend
```

Or with docker-compose:
```bash
docker-compose down
```

