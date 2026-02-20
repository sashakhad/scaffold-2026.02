# Create New Project

Create a fresh copy of this scaffold as a new project, with its own private GitHub repo.

## Instructions for AI

**IMPORTANT: Always ask for the project name first before doing anything else!**

## Prerequisites

- `gh` CLI must be installed and authenticated (`gh auth status`)
- If not authenticated, instruct the user to run `gh auth login` first

## Steps

1. **Ask for project name FIRST** - Display this prompt:

   ---
   
   ## 🆕 Let's create your new project!
   
   **What would you like to name your project?**
   
   Some tips for a good name:
   - Use lowercase letters
   - Use dashes instead of spaces (e.g., `my-cool-app`)
   - Keep it short and memorable
   - Examples: `todo-app`, `my-portfolio`, `awesome-project`
   
   **Type your project name below:**
   
   ---

   **WAIT for the user to respond with a name before proceeding!**

2. **Validate the project name** when user provides it:
   - If name has spaces, convert to dashes and confirm: "I'll use `{converted-name}` - is that okay?"
   - If name has uppercase, convert to lowercase and confirm
   - If name has special characters (except dashes), ask them to choose a different name

3. **Ask where to create it** (optional):
   - Default: parent directory of current project
   - Ask: "I'll create this in `{parent-directory}`. Is that okay, or would you like a different location?"

4. **Copy the scaffold** - Run this command:
   ```bash
   cp -r "$(pwd)" "<destination>/<project-name>"
   ```

5. **Clean up the new project**:
   ```bash
   cd "<destination>/<project-name>"
   rm -rf node_modules .git pnpm-lock.yaml package-lock.json
   ```

6. **Update package.json** - Change the `"name"` field to the new project name

7. **Initialize fresh git repo**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit from scaffold"
   ```

8. **Create a private GitHub repo and push**:
   ```bash
   gh repo create <project-name> --private --source . --push
   ```
   - This creates a private repo under the authenticated user's account, sets it as `origin`, and pushes
   - If the repo name is already taken, append a suffix or ask the user for an alternative

9. **Display success message**:

   ---
   
   ## ✅ Your new project "{project-name}" is ready!
   
   **Project location:** `<full-path-to-new-project>`
   **GitHub repo:** `https://github.com/<username>/<project-name>`
   
   ### 👉 Next Steps
   
   1. **Open your new project in Cursor:**
      - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
      - Type "Open Folder" and select it
      - Navigate to: `<full-path-to-new-project>`
      - Click "Open"
   
   2. **Once you're in the new project, run `/setup`** to install dependencies
   
   3. **Then run `/start`** to launch your app!
   
   ---

## Important Reminders

- **DO NOT proceed without getting a project name from the user first**
- Wait for user input at step 1 before running any commands
- Make sure to use the exact name the user provides (after validation/conversion)
- The GitHub repo is always created as **private** by default

## Tone

Be helpful and encouraging! Creating a new project is exciting. Guide them through each step clearly and celebrate when it's done.
