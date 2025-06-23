<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Ethereum Blockchain Monitor

This is a Node.js application that monitors Ethereum blockchain transactions based on dynamic configurations. The application uses:

- Express for the API
- Sequelize with SQLite for data storage
- Ethers.js for Ethereum blockchain interaction
- Awilix for dependency injection

## Key Components

1. **Configuration System**: CRUD operations for dynamic rule configurations
2. **Ethereum Monitor**: Real-time monitoring of Ethereum transactions using Infura
3. **Transaction Filtering**: Match transactions against configurations
4. **Database Storage**: Store matched transactions with configuration references

## Code Guidelines

- Use JavaScript (ES6+) without TypeScript
- Follow clean code principles and meaningful variable/function names
- Use async/await for asynchronous operations
- Implement proper error handling
- Add comments for complex logic

## Project Structure

- `/src/config`: Configuration files (database, etc.)
- `/src/controllers`: API controllers for HTTP endpoints
- `/src/models`: Sequelize models (Configuration, Transaction)
- `/src/routes`: API route definitions
- `/src/services`: Business logic services
- `/src/utils`: Helper functions and utilities
- `/src/scripts`: Database initialization and utility scripts

## Bonus Features

- Hot loading of configurations without server restart
- Delayed block processing
- Comprehensive logging
