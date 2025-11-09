# **⋆｡𖦹°⭒˚｡⋆GWC  Appwrite Notes Workshop ⋆｡𖦹°⭒˚｡⋆**

This is a workshop demo made to show how Google OAuth with Appwrite is used to handle authentication and database storage. Users sign in with Google and can add notes that persist across sessions.

## ☆ What this demo does

- Sign in with Google via Appwrite's OAuth2
- Display user name, email, and profile picture
- Save notes that append to your existing notes (with timestamps)
- Notes persist across sessions, log out and log back in to see them!

## ᯓ★ Project Structure

```
├── index.html         -> Main HTML structure
├── script.js          -> Appwrite integration and app logic
├── style.css          -> Styling
├── package.json       -> Node.js dependencies and scripts
├── config.example.js  -> Template for configuration (copy this to config.js)
├── config.js          -> Your personal Appwrite credentials (create it, this not in git)
└── README.md          -> What you are reading right now!
```

---

## ᯓ★ Setup Instructions

Follow these steps to get your own copy working. You'll need to set up both Appwrite and Google OAuth first.

### Part 1: Appwrite Setup

#### ☆Create an Appwrite Account☆

- Go to https://cloud.appwrite.io
- Sign up for a free account (or log in if you have one)

#### ☆Create a New Project☆

- Click "Create Project"
- Give it a name (e.g., "GWC Notes Workshop")
- Copy your Project ID from Settings > General
- You'll need this for `APPWRITE_PROJECT_ID` in `config.js`

#### ☆Create a Database☆

- Go to Databases in the left sidebar
- Click "Create Database"
- Give it a name (e.g., "NotesDB")
- Copy the Database ID - you'll need this for `NOTES_DATABASE_ID` in `config.js`

#### ☆Create a Table☆

- Inside your database, click "Create Table"
- Name it `notes` (or whatever you want really and update `NOTES_COLLECTION_ID` accordingly)
- Copy the Table ID - also needed this for `NOTES_COLLECTION_ID` in `config.js`

#### ☆Add Columns to Your Table☆

- Click on your table, then go to the "Columns" tab
- Add these two columns:
  - **Attribute Name:** `userId` | **Type:** String | **Size:** 255 | **Make it required!**
  - **Attribute Name:** `content` | **Type:** String | **Size:** 10000 | **Make it required!**

#### ☆Set Table Permissions☆

- Go to the "Settings" tab of your table
- Under "Permissions", add:
  - **Read Access:** `users` (allows logged-in users to read)
  - **Write Access:** `users` (allows logged-in users to write)
  - **Create Access:** `users` (allows logged-in users to create)
  - **Update Access:** `users` (allows logged-in users to update)
- Click "Update"

### Part 2: Google OAuth Setup

#### ☆Go to Google Cloud Console☆

- Visit https://console.cloud.google.com
- Sign in with your Google account

#### ☆Create a New Project☆

- Click the project dropdown at the top
- Click "New Project"
- Give it a name (e.g., "GWC OAuth Workshop")
- Click "Create"

#### ☆Enable Google+ API☆

- In the left sidebar, go to "APIs & Services" > "Library"
- Search for "Google+ API" or "People API"
- Click on it and click "Enable" (this is to access peoples profile pic, name and email:>)

#### ☆Create OAuth Credentials☆

- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth client ID"
- If prompted, configure the OAuth consent screen first:
  - Choose "External"
  - Fill in required fields (App name, User support email, Developer contact)
- Back to Credentials, choose "Web application"
- Name it (e.g., "GWC Notes App")
- **!!Authorized redirect URIs:** Add your Appwrite OAuth redirect URL
  - This will be something like: `https://cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/[YOUR_PROJECT_ID]`
  - Or check Appwrite Console > Auth > Providers > Google for the exact URL
- Click "Create"
- **Copy the Client ID and Client Secret** - you'll need these for Appwrite when enabling Google for authentication.

#### ☆Configure Google OAuth in Appwrite☆

- Go back to your Appwrite Console
- Navigate to Auth > Providers
- Find "Google" and click to configure
- Enable the provider
- Paste your **Client ID** and **Client Secret** from Google Cloud Console
- Click "Update"

### Part 3: Configure Your Appwrite Credentials

#### ☆Create your configuration file☆

- Copy `config.example.js` to `config.js`
- You can do this in your file explorer, or run in terminal:
  ```bash
  cp config.example.js config.js
  ```

#### ☆Open `config.js` and fill in your Appwrite credentials☆

```javascript
const APPWRITE_ENDPOINT = 'https://fra.cloud.appwrite.io/v1';  // Your endpoint from Appwrite Console
const APPWRITE_PROJECT_ID = 'your-project-id-here';
const NOTES_DATABASE_ID = 'your-database-id-here';
const NOTES_COLLECTION_ID = 'notes';  // Or your collection name/ID
```

#### ☆Where to find these values☆

- **APPWRITE_ENDPOINT**: Appwrite Console → Settings → Overview → API Endpoint
- **APPWRITE_PROJECT_ID**: Appwrite Console → Settings → Overview → Project ID
- **NOTES_DATABASE_ID**: Appwrite Console → Databases → [Your Database] → Copy ID from URL or Settings
- **NOTES_COLLECTION_ID**: Appwrite Console → Databases → [Your Database] → [Your Table] → Copy ID from URL or Settings (or use the table name like 'notes')

#### ☆!!Important!!☆

- `config.js` is in `.gitignore` - your personal credentials won't be committed to git
- **!!Never share your `config.js` file or commit it to a repository!!**
- The `config.example.js` file is safe to commit (it has placeholder values)

### Part 4: Set Up Local Development Server

- Make sure you've created `config.js` from `config.example.js` (see Part 3 above)
- Start the local server using one of these methods:

#### ⭒Option A. Using serve directly (if installed globally)

```bash
serve . -p 3000
```

Or just:

```bash
serve -p 3000
```

#### ⭒Option B. Using npm

- Make sure you have Node.js installed (download from https://nodejs.org if needed)
- Install dependencies:
  ```bash
  npm install
  ```
- Start the server:
  ```bash
  npm start
  ```

**Important Note:** Appwrite OAuth only works if your app is being served from a real local URL, not just opening the HTML file directly!

### Part 5: Test Your Setup

- The server should open automatically, or go to `http://localhost:3000` (or whatever port is shown)
- Click "Sign in with Google"
- You should be redirected to Google login, then back to your app
- Try adding a note!

---

## ᯓ★ Troubleshooting

### "Login failed" or OAuth redirect issues

#### **Error: `redirect_uri_mismatch`**

- This means Google Cloud Console doesn't have the correct redirect URI
- Go to Google Cloud Console → APIs & Services → Credentials
- Click on your OAuth 2.0 Client ID
- In "Authorized redirect URIs", add:
  - The exact URL in Appwrite Console → Auth → Providers → Google (it shows the callback URL)
  - The URI must match **EXACTLY** (including `https://`, no trailing slashes)
- Click "Save" and wait a minute for changes to propagate

#### **Other OAuth issues:**

- Check that your redirect URL in Appwrite matches exactly (including `http://` vs `https://`)
- Verify Google OAuth credentials are correct in Appwrite Console
- Make sure Google Cloud Console has the correct redirect URI (see above)

### "Database or Collection not found"

- Double-check your Database ID and Collection ID in `config.js`
- Make sure the IDs are copied correctly (no extra spaces)
- Make sure you created `config.js` from `config.example.js` and filled in your values

### "Permission denied"

- Check your Collection permissions in Appwrite Console
- Make sure "users" have read, write, create, and update access

### Notes not saving/loading

- Check browser console (F12) for detailed error messages
- Verify your Collection has `userId` and `content` attributes
- Make sure you're logged in (check the header shows your profile)

### Node.js server issues

- Make sure Node.js is installed: `node --version` (should show v14 or higher)
- Run `npm install` first to install dependencies
- If port 3000 is already in use, you can change it in `package.json` (update the `-p 3000` flag)
- Make sure you're accessing the app via `http://localhost:3000` (not `file://`)

---

Happy coding!^-^ 🚀
