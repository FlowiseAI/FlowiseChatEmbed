# Debugging Flowise Chat Embed

This document explains how to debug the TypeScript source code of the Flowise Chat Embed component.

## Debug Script

A new `debug` script has been added to `package.json` that enables source map generation and disables code minification for easier debugging.

### Running the Debug Script

```bash
# Start the debug build with watch mode
yarn debug
# or
npm run debug
```

This will:
- Generate source maps for TypeScript files
- Disable code minification (terser is skipped)
- Enable inline sources in source maps
- Start a development server on `http://localhost:51914`
- Watch for file changes and rebuild automatically

## VS Code Debugging

Two debugging configurations have been added to `.vscode/launch.json`:

### 1. Debug Flowise Embed (Node.js)
- Debugs the build process itself
- Useful for debugging build configuration issues

### 2. Debug in Browser (Chrome)
- Debugs the actual chatbot component in the browser
- Allows setting breakpoints in TypeScript source files
- Provides full debugging capabilities in Chrome DevTools

### How to Use Browser Debugging

1. Start the debug script:
   ```bash
   yarn debug
   ```

2. In VS Code, go to the Debug panel (Ctrl+Shift+D / Cmd+Shift+D)

3. Select "Debug in Browser" from the dropdown

4. Click the green play button or press F5

5. This will:
   - Launch Chrome with debugging enabled
   - Open `http://localhost:51914`
   - Connect VS Code debugger to the browser

6. Set breakpoints in your TypeScript source files in VS Code

7. Interact with the chatbot component to trigger your breakpoints

## Browser DevTools Debugging

Alternatively, you can debug directly in Chrome DevTools:

1. Start the debug script: `yarn debug`

2. Open Chrome and navigate to `http://localhost:51914`

3. Open Chrome DevTools (F12)

4. Go to the Sources tab

5. You should see your TypeScript source files under the file tree

6. Set breakpoints directly in the TypeScript source code

## Source Map Configuration

The debug configuration includes:
- `sourceMap: true` in TypeScript plugin
- `inlineSources: true` for embedding source content
- `sourcemap: true` in Rollup output configuration
- Disabled terser minification for readable code

## Testing Your Setup

To verify debugging is working:

1. Run `yarn debug`
2. Open the browser to `http://localhost:51914`
3. Open DevTools and check the Sources tab
4. Look for your TypeScript files (e.g., `src/components/Bot.tsx`)
5. Set a breakpoint in a component that gets executed
6. Interact with the chatbot to trigger the breakpoint

The breakpoint should hit and you should be able to inspect variables, step through code, and see the original TypeScript source.