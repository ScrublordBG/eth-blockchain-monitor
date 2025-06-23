# Ethereum Blockchain Monitor

A NodeJS application that monitors Ethereum blockchain transactions and filters them based on dynamic configurations.

## Features

- Real-time monitoring of Ethereum blockchain transactions
- Dynamic configuration for transaction filtering
- RESTful API for CRUD operations on configurations
- Hot-reloading of configurations without restarting the server
- Support for delayed block processing
- Comprehensive logging for monitoring and debugging

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Sequelize** - ORM for database interaction
- **SQLite** - Database
- **Ethers.js** - Ethereum interaction
- **Awilix** - Dependency injection
- **Morgan** - HTTP request logger

## Prerequisites

- Node.js (version 14 or higher)
- NPM (version 6 or higher)
- Infura API key (sign up at [infura.io](https://infura.io))

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ethereum-blockchain-monitor.git
cd ethereum-blockchain-monitor
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:

```
# Server Configuration
PORT=3000

# Database Configuration
DB_PATH=./data/ethereum_monitoring.sqlite

# Ethereum Configuration
INFURA_API_KEY=YOUR_INFURA_API_KEY
ETHEREUM_NETWORK=mainnet

# Logging Configuration
LOG_LEVEL=info
```

4. Replace `YOUR_INFURA_API_KEY` with your actual Infura API key.

## Usage

1. Initialize the database with sample configurations:

```bash
npm run setup-db
```

2. Start the server:

```bash
npm start
```

For development with automatic restart:

```bash
npm run dev
```

## API Endpoints

### Configurations

- `GET /api/configurations` - Get all configurations
- `GET /api/configurations/:id` - Get a specific configuration
- `POST /api/configurations` - Create a new configuration
- `PUT /api/configurations/:id` - Update a configuration
- `DELETE /api/configurations/:id` - Delete a configuration

### Transactions

- `GET /api/transactions` - Get all transactions
- `GET /api/transactions/hash/:hash` - Get a transaction by hash
- `GET /api/configurations/:configurationId/transactions` - Get transactions for a specific configuration

## Configuration Options

When creating or updating a configuration, you can use the following options:

| Field               | Type    | Description                                                       |
| ------------------- | ------- | ----------------------------------------------------------------- |
| name                | String  | Required. Name of the configuration                               |
| description         | String  | Optional. Description of the configuration                        |
| active              | Boolean | Whether the configuration is active (default: true)               |
| fromAddress         | String  | Optional. Filter transactions from this address                   |
| toAddress           | String  | Optional. Filter transactions to this address                     |
| minValue            | String  | Optional. Minimum transaction value in wei                        |
| maxValue            | String  | Optional. Maximum transaction value in wei                        |
| blockDelay          | Number  | Optional. Number of blocks to delay processing (default: 0)       |

## Example Configuration

```json
{
  "name": "High Value Transfers",
  "description": "Monitor transactions with value greater than 100 ETH",
  "active": true,
  "minValue": "100000000000000000000" // eth value in wei
}
```
## License

ISC

## Author

Boris Zhelev