# Launchpad UI Renderer

The frontend React application for Greenroom Launchpad. Built with React, TypeScript, and Vite, providing the user interface for launching Greenroom Robotics software products.

## Features

- **Application Tiles**: Interactive tiles for launching GAMA, Lookout+, MarOps, and MIS-SIM
- **Modern UI**: Clean, responsive interface built with React and TypeScript
- **Fast Refresh**: Vite-powered development with hot module replacement
- **React Compiler**: Optimized builds with automatic React compiler integration

## Project Structure

```
src/
├── App.tsx              # Main application component
├── components/
│   └── application-tile.tsx  # Reusable tile component for product launches
├── App.css              # Application styles
├── index.css            # Global styles
└── main.tsx             # Application entry point
```

## Development

### Getting Started

1. Install dependencies: `npm install`
2. Start development server: `npm run dev`
3. Build for production: `npm run build`

### React Compiler

The React Compiler is enabled for optimized builds. See [React Compiler documentation](https://react.dev/learn/react-compiler) for more information.

**Note**: React Compiler may impact Vite dev & build performance but provides runtime optimizations.

### ESLint Configuration

For enhanced code quality, you can enable type-aware lint rules in production:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
