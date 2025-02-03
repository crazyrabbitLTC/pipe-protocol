# Pipe Core

A protocol for sharing data between LLMs via IPFS with in-process nodes and visibility tooling.

## Features

- In-process IPFS nodes (local and public)
- Data encryption support
- Schema validation
- Access policy management
- API endpoints for data management
- Comprehensive testing suite

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file with the following variables:

```env
LOCAL_IPFS_ENDPOINT="http://localhost:5001"
PUBLIC_IPFS_ENDPOINT="https://ipfs.infura.io:5001"
```

## Usage

### Building the Project

```bash
npm run build
```

### Running Tests

```bash
npm test
```

### Starting the Server

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

## API Endpoints

- `POST /publish` - Publish a record
- `POST /publish-bundle` - Publish a bundle (schema + data)
- `GET /fetch` - Fetch a record by CID
- `POST /pin` - Pin a record
- `POST /unpin` - Unpin a record
- `POST /replicate` - Replicate a record between scopes
- `GET /node-status` - Get node status
- `GET /node-info` - Get node information
- `GET /storage-metrics` - Get storage metrics
- `GET /pinned-cids` - Get pinned CIDs
- `GET /configuration` - Get node configuration

## License

ISC 