# Create New Project

Create a fresh copy of this scaffold as a new project.

## Steps

1. **Ask for project details**:
   - Project name (will be the folder name, use lowercase with dashes, e.g., `my-cool-app`)
   - Where to create it (default: parent directory of current project)

2. **Copy the scaffold** - Run this command (replace values):
   ```bash
   cp -r "$(pwd)" "<destination>/<project-name>"
   ```

3. **Clean up the new project**:
   ```bash
   cd "<destination>/<project-name>"
   rm -rf node_modules .git pnpm-lock.yaml package-lock.json
   ```

4. **Initialize fresh git repo**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit from scaffold"
   ```

5. **Update package.json** - Change the `"name"` field to the new project name

6. **IMPORTANT - Final message to user**:

   Display this clearly:

   ---
   
   ## ✅ Your new project is ready!
   
   **Project location:** `<full-path-to-new-project>`
   
   ### 👉 Next Steps
   
   1. **Open your new project in Cursor:**
      - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
      - Type "Open Folder" and select it
      - Navigate to: `<full-path-to-new-project>`
      - Click "Open"
   
   2. **Once you're in the new project, run `/setup`** to install dependencies
   
   3. **Then run `/start`** to launch your app!
   
   ---

## Tone

Be helpful and clear. The user needs explicit instructions to open the new project since we can't do it programmatically. Make sure the path is crystal clear so they can find it.

