# Ethereum Blockchain Monitor

A NodeJS application that monitors Ethereum blockchain transactions and filters them based on dynamic configurations.

## Features

- Real-time monitoring of Ethereum blockchain transactions
- Dynamic configuration for transaction filtering
- RESTful API for CRUD operations on configurations
- Hot-reloading of configurations without restarting the server
- Support for delayed block processing
- Bulk transaction processing to minimize API calls
- Advanced filtering based on:
  - Addresses (from/to)
  - Transaction value
  - Gas price
  - Gas used
- Comprehensive logging for monitoring and debugging
- Optimized for performance and reliability

## Tech Stack

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Sequelize** - ORM for database interaction
- **SQLite** - Database
- **Ethers.js** - Ethereum interaction
- **Awilix** - Dependency injection
- **Morgan** - HTTP request logger

## API Validation & Error Handling

The API implements comprehensive validation for all endpoints:

- **Configuration validation** ensures:

  - Valid Ethereum addresses (0x followed by 40 hex characters)
  - Numeric values are non-negative
  - Min values do not exceed max values
  - Name and description length restrictions
  - Required fields are present

- **Error responses** follow a consistent format:

  ```json
  {
    "success": false,
    "message": "Description of the error",
    "error": "Detailed error information (when available)"
  }
  ```

- **HTTP status codes**:
  - `200` - Success
  - `201` - Resource created
  - `400` - Bad request (validation error)
  - `404` - Resource not found
  - `409` - Conflict (e.g., duplicate resource)
  - `500` - Server error

## Prerequisites

- Node.js (version 14 or higher)
- NPM (version 6 or higher)
- Infura API key (sign up at [infura.io](https://infura.io))

## Installation

1. Clone the repository:

```bash
git clone https://github.com/ScrublordBG/ethereum-blockchain-monitor.git
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
  - Query parameters:
    - `active` (optional): Filter by active status (`true` or `false`)
- `GET /api/configurations/:id` - Get a specific configuration by ID

- `POST /api/configurations` - Create a new configuration
  - Request body: JSON object with configuration options (see Configuration Options section)
- `PUT /api/configurations/:id` - Update an existing configuration
  - Request body: JSON object with configuration options to update
- `DELETE /api/configurations/:id` - Delete a configuration

### Transactions

- `GET /api/transactions` - Get all transactions
  - Query parameters:
    - `limit` (optional): Limit the number of result pagination
    - `page` (optional): Page number for pagination
- `GET /api/transactions/hash/:hash` - Get a transaction by its hash
- `GET /api/configurations/:configurationId/transactions` - Get transactions for a specific configuration
  - Query parameters:
    - `limit` (optional): Limit the number of result pagination
    - `page` (optional): Page number for pagination

## Configuration Options

When creating or updating a configuration, you can use the following options:

| Field       | Type    | Description                                                     |
| ----------- | ------- | --------------------------------------------------------------- |
| name        | String  | Required. Name of the configuration (max 100 characters)        |
| description | String  | Optional. Description of the configuration (max 500 characters) |
| active      | Boolean | Whether the configuration is active (default: true)             |
| fromAddress | String  | Optional. Filter transactions from this Ethereum address        |
| toAddress   | String  | Optional. Filter transactions to this Ethereum address          |
| minValue    | String  | Optional. Minimum transaction value in wei                      |
| maxValue    | String  | Optional. Maximum transaction value in wei                      |
| minGasPrice | String  | Optional. Minimum gas price in wei                              |
| maxGasPrice | String  | Optional. Maximum gas price in wei                              |
| minGasUsed  | String  | Optional. Minimum gas used (approximated from gasLimit)         |
| maxGasUsed  | String  | Optional. Maximum gas used (approximated from gasLimit)         |
| blockDelay  | Number  | Optional. Number of blocks to delay processing (default: 0)     |

## Example Configurations

### Example 1: High Value Transfers

```json
{
  "name": "High Value Transfers",
  "description": "Monitor transactions with value greater than 100 ETH",
  "active": true,
  "minValue": "100000000000000000000"
}
```

### Example 2: Specific Address Monitoring with Gas Price Filters

```json
{
  "name": "Exchange Withdrawals",
  "description": "Monitor withdrawals from a specific exchange address with gas price constraints",
  "active": true,
  "fromAddress": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "minValue": "1000000000000000000",
  "minGasPrice": "20000000000",
  "maxGasPrice": "100000000000",
  "blockDelay": 2
}
```

### Example 3: Contract Interaction Monitoring

```json
{
  "name": "USDT Contract Interactions",
  "description": "Monitor transactions to the USDT contract",
  "active": true,
  "toAddress": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  "minGasUsed": "100000",
  "maxGasUsed": "500000"
}
```

## License

ISC

## Performance Considerations

To ensure optimal performance of the application:

1. **Configuration Filtering**:

   - Be specific with your configuration filters to reduce the number of matched transactions
   - Consider using address filters (fromAddress/toAddress) whenever possible
   - Avoid very broad value ranges that would match most transactions

2. **Block Delay**:

   - Using blockDelay can help distribute processing load
   - For non-time-sensitive monitoring, consider using a delay of 1-5 blocks

3. **Infura Rate Limits**:

   - The application is optimized to minimize Infura API calls by using bulk transaction fetching
   - Monitor your Infura usage if running in production for extended periods

4. **Database Growth**:
   - The SQLite database will grow over time as more transactions are stored
   - Consider implementing a periodic cleanup of old transaction data for long-running deployments

## Author

Boris Zhelev
