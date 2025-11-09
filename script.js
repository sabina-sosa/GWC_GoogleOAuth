/**
 * ⋆｡𖦹°⭒˚｡⋆GWC  Appwrite Notes Workshop ⋆｡𖦹°⭒˚｡⋆
 * 
 * ᯓ★Look at README.md for detailed setup instructions:)
 */

// ============================================================================
// CONFIGURATION: Load from config.js
// ============================================================================
// Configuration is loaded from config.js. This keeps personal credentials out of the main code

// Checking if config.js exists and has valid values
if (typeof APPWRITE_ENDPOINT === 'undefined' || 
    typeof APPWRITE_PROJECT_ID === 'undefined' || 
    typeof NOTES_DATABASE_ID === 'undefined' || 
    typeof NOTES_COLLECTION_ID === 'undefined') {
  console.error('Configuration Error! config.js not found or incomplete!');
  console.error('Please copy config.example.js to config.js and fill in your Appwrite credentials.');
  document.body.innerHTML = `
    <div style="padding: 40px; max-width: 600px; margin: 50px auto; text-align: center;">
      <h2 style="color: #d32f2f;">Configuration Missing</h2>
      <p>Please set up your configuration:</p>
      <ol style="text-align: left; display: inline-block;">
        <li>Copy <code>config.example.js</code> to <code>config.js</code></li>
        <li>Open <code>config.js</code> and fill in your Appwrite credentials</li>
        <li>Refresh this page</li>
      </ol>
      <p style="margin-top: 20px; color: #666;">
        See README.md for detailed setup instructions.
      </p>
    </div>
  `;
  throw new Error('Appwrite configuration not found');
}

// Validating that students haven't left placeholder values
let configValidated = false;
if (APPWRITE_ENDPOINT.includes('YOUR_') || 
    APPWRITE_PROJECT_ID.includes('YOUR_') || 
    NOTES_DATABASE_ID.includes('YOUR_') || 
    NOTES_COLLECTION_ID.includes('YOUR_')) {
  console.error('❌ Configuration Error: Please replace placeholder values in config.js with your actual Appwrite credentials!');
  configValidated = false;
} else {
  configValidated = true;
}

// ============================================================================
// APWRITE CLIENT VARIABLES
// ============================================================================
// These will be initialized once the Appwrite SDK is loaded
let client, account, databases;

// ============================================================================
// UI ELEMENTS: References to HTML elements we'll interact with
// ============================================================================
// Waiting for DOM(Document Object Model) to be ready before accessing elements
let loginBtn, logoutBtn, saveBtn, newNoteEl, existingNotesEl, nameEl, emailEl, photoEl;
let userArea, notSignedInSection, signedInSection, statusEl;

/**
 * Initialize Appwrite client and services
 * This must be called after the Appwrite SDK has been loaded
 */
function initializeAppwrite() {
  if (!window.Appwrite) {
    console.error('Appwrite SDK not loaded! Make sure the CDN script tag is in index.html.');
    return false;
  }
  
  try {
    // The Appwrite Client is your apps Wi-Fi password to talk to Appwrite
    // no connection, no data.
    client = new window.Appwrite.Client()
      .setEndpoint(APPWRITE_ENDPOINT)  // Where Appwrite is hosted
      .setProject(APPWRITE_PROJECT_ID); // Which project to use

    // Account service handles authentication (login, logout, user info)
    account = new window.Appwrite.Account(client);

    // Databases service handles reading/writing data to your database
    databases = new window.Appwrite.Databases(client);
    
    console.log('Appwrite initialized successfully');
    return true;
  } catch (err) {
    console.error('Failed to initialize Appwrite:', err);
    return false;
  }
}

function initializeUIElements() {
  loginBtn = document.getElementById('login-btn');
  logoutBtn = document.getElementById('logout-btn');
  saveBtn = document.getElementById('save-btn');
  newNoteEl = document.getElementById('new-note'); // Textarea for new notes only
  existingNotesEl = document.getElementById('existing-notes'); // Display area for user's existing notes
  nameEl = document.getElementById('name');
  emailEl = document.getElementById('email');
  photoEl = document.getElementById('photo');
  userArea = document.getElementById('user-area');
  notSignedInSection = document.getElementById('not-signed-in');
  signedInSection = document.getElementById('signed-in');
  statusEl = document.getElementById('status');
  
  // Verifying critical elements exist
  if (!loginBtn) {
    console.error('Login button not found! Check HTML.');
    return false;
  }
  return true;
}

// ============================================================================
// UI HELPER FUNCTIONS: Show/hide different parts of the interface
// ============================================================================
/**
 * Updates the UI to show the signed-in state
 * Displays user information (name, email, profile picture)
 */
function showSignedInUI(user) {
  nameEl.textContent = user.name || 'No name';
  emailEl.textContent = user.email || '';
  // Appwrite stores profile picture in user.prefs.picture after OAuth login
  photoEl.src = (user.prefs && user.prefs.picture) || `https://www.gravatar.com/avatar/?d=mp`;
  userArea.classList.remove('hidden');
  notSignedInSection.classList.add('hidden');
  signedInSection.classList.remove('hidden');
}

/**
 * Updates the UI to show the signed-out state
 * Hides user info and clears the note textarea
 */
function showSignedOutUI() {
  userArea.classList.add('hidden');
  notSignedInSection.classList.remove('hidden');
  signedInSection.classList.add('hidden');
  if (newNoteEl) newNoteEl.value = '';
  if (existingNotesEl) existingNotesEl.textContent = '';
  statusEl.textContent = '';
}

// ============================================================================
// INITIALIZATION: Check if user is already logged in
// ============================================================================
/**
 * When the page loads, check if there's an existing Appwrite session
 * If yes, show the signed-in UI and load their notes
 * If no, show the login screen
 */
async function init() {
  try {
    // Try to get the current user, this will succeed if they're logged in
    const user = await account.get();
    // Success! User is logged in, show their info and load their notes
    showSignedInUI(user);
    await loadUserNote(user.$id);
  } catch (err) {
    // No active session, user needs to log in
    showSignedOutUI();
  }
}

// ============================================================================
// LOGIN: Google OAuth via Appwrite
// ============================================================================
/**
 * When user clicks "Sign in with Google", it redirects them to Google's login page
 * After they authenticate, Google redirects back to Appwrite, then Appwrite redirects back here
 */
function setupLoginHandler() {
  if (!loginBtn) {
    console.error('Cannot setup login handler: login button not found');
    return;
  }
  
  loginBtn.addEventListener('click', async () => {
    try {
      // Check if Appwrite is initialized
      if (!account) {
        showError('Appwrite not initialized. Please refresh the page.');
        console.error('Appwrite account service not available');
        return;
      }
      
      console.log('Login button clicked');
      console.log('Current URL:', window.location.href);
      console.log('Appwrite endpoint:', APPWRITE_ENDPOINT);
      console.log('Appwrite project ID:', APPWRITE_PROJECT_ID);
      
      // Validate Appwrite client is configured
      if (!APPWRITE_PROJECT_ID || APPWRITE_PROJECT_ID.includes('YOUR_')) {
        showError('Appwrite Project ID not configured. Please update script.js with your Project ID.');
        return;
      }
      
      // Show loading state
      if (statusEl) {
        statusEl.textContent = 'Redirecting to Google...';
      }

      const redirectUrl = window.location.href;
      console.log('Initiating OAuth with redirect URL:', redirectUrl);
      
      account.createOAuth2Session('google', redirectUrl);
      
      // Note: The page will redirect, so code after this won't run
      // If we get here, something went wrong !!(ಥ﹏ಥ)
      console.warn('OAuth redirect did not happen - check Appwrite configuration');
      
    } catch (err) {
      // If OAuth setup is incorrect, show helpful error
      console.error('OAuth error details:', err);
      let errorMsg = 'Login failed. ';
      
      if (err.message) {
        if (err.message.includes('provider')) {
          errorMsg += 'Google OAuth provider not enabled in Appwrite Console.';
        } else if (err.message.includes('redirect')) {
          errorMsg += 'Redirect URL mismatch. Check Appwrite Console redirect settings.';
        } else {
          errorMsg += err.message;
        }
      } else {
        errorMsg += 'Make sure Google OAuth is configured in Appwrite Console.';
      }
      
      showError(errorMsg);
    }
  });
}

// ============================================================================
// LOGOUT: End the current Appwrite session
// ============================================================================
/**
 * When user clicks logout, delete their Appwrite session
 * This clears their authentication and returns them to the login screen
 */
function setupLogoutHandler() {
  if (!logoutBtn) return;
  
  logoutBtn.addEventListener('click', async () => {
  try {
    // Delete the current session, this logs them out
    await account.deleteSession('current');
    showSignedOutUI();
    statusEl.textContent = 'Logged out successfully';
  } catch (err) {
    showError('Logout failed. Please try refreshing the page.');
    console.error('Logout error:', err);
  }
  });
}

// ============================================================================
// SAVE NOTE: Append new content to user's existing note
// ============================================================================
/**
 * When user clicks "Add to note", append their new text to their existing note
 * If they don't have a note yet, create one
 * 
 * KEY CONCEPT: We're appending, not replacing!
 * Each time they log in and add text, it gets added to what they already have
 */
function setupSaveHandler() {
  if (!saveBtn) return;
  
  saveBtn.addEventListener('click', async () => {
  // Get only the NEW content from the textarea (this is always just new content)
  const newContent = newNoteEl.value.trim();
  
  // Validate input
  if (!newContent) {
    showError('Please write something before saving!');
    return;
  }

  statusEl.textContent = 'Saving...';
  
  try {
    // Get the current logged-in user
    const user = await account.get();
    const userId = user.$id;

    // Query the database to find this user's existing note document
    // Query.equal('userId', userId) means "find documents where userId matches this user"
    // Query.limit(1) means "only get the first result"
    const query = [
      window.Appwrite.Query.equal('userId', userId), 
      window.Appwrite.Query.limit(1)
    ];
    const list = await databases.listDocuments(NOTES_DATABASE_ID, NOTES_COLLECTION_ID, query);

    // Format the new content with a timestamp
    const timestamp = new Date().toLocaleString();
    const formattedNewContent = `\n\n ${timestamp} \n${newContent}`;

    if (list.total === 0) {
      // if there is no existing note, create a new document
      // window.Appwrite.ID.unique() generates a unique ID for the document
      await databases.createDocument(
        NOTES_DATABASE_ID, 
        NOTES_COLLECTION_ID, 
        window.Appwrite.ID.unique(), 
        {
          userId,
          content: formattedNewContent
        }
      );
      statusEl.textContent = 'Note created and saved! ✔';
    } else {
      // if there is an existing note, append to it
      const docId = list.documents[0].$id;
      const existingContent = list.documents[0].content || '';
      const updatedContent = existingContent + formattedNewContent;
      
      // Updating the document with the combined content
      await databases.updateDocument(
        NOTES_DATABASE_ID, 
        NOTES_COLLECTION_ID, 
        docId, 
        {
          content: updatedContent
        }
      );
      statusEl.textContent = 'Added to your note! ✔';
    }
    
    // Clearing the new note textarea after saving
    newNoteEl.value = '';
    
    // Reloading the note to show the updated content in the display area
    await loadUserNote(userId);
    
  } catch (err) {
    // Providing helpful error messages based on what went wrong
    let errorMessage = 'Save failed. ';
    
    if (err.message && err.message.includes('not found')) {
      errorMessage += 'Database or Collection not found. Check your Database ID and Collection ID.';
    } else if (err.message && err.message.includes('permission')) {
      errorMessage += 'Permission denied. Make sure your Collection permissions allow users to read/write their own documents.';
    } else if (err.message && err.message.includes('attribute')) {
      errorMessage += 'Database schema error. Make sure your Collection has "userId" and "content" attributes.';
    } else {
      errorMessage += 'Please check your Appwrite configuration and try again.';
    }
    
    showError(errorMessage);
    console.error('Save error details:', err);
  }
  });
}

// ============================================================================
// LOAD NOTE: Retrieve user's saved note from the database
// ============================================================================
/**
 * Fetches the user's note from Appwrite database and displays it
 * This runs when they log in and after they save new content
 */
async function loadUserNote(userId) {
  statusEl.textContent = 'Loading your notes...';
  
  try {
    // Query the database for this user's note
    const query = [
      window.Appwrite.Query.equal('userId', userId), 
      window.Appwrite.Query.limit(1)
    ];
    const list = await databases.listDocuments(NOTES_DATABASE_ID, NOTES_COLLECTION_ID, query);
    
    if (list.total > 0) {
      // if their note is found, display it in the read-only area
      const noteContent = list.documents[0].content || '';
      existingNotesEl.textContent = noteContent || 'No notes yet.';
      statusEl.textContent = '';
    } else {
      // if there is no note, show empty display area
      existingNotesEl.textContent = 'No notes yet. Write something below and save it:)';
      statusEl.textContent = '';
    }
  } catch (err) {
    // Handling different types of errors with helpful messages
    let errorMessage = 'Could not load note:( ';
    
    if (err.message && err.message.includes('not found')) {
      errorMessage += 'Database or Collection not found. Check your Database ID and Collection ID in the code.';
    } else if (err.message && err.message.includes('permission')) {
      errorMessage += 'Permission denied. Check your Collection permissions in Appwrite Console.';
    } else {
      errorMessage += 'Please check your Appwrite configuration.';
    }
    
    showError(errorMessage);
    console.error('Load error details:', err);
  }
}

// ============================================================================
// ERROR HANDLING HELPER: Display user-friendly error messages
// ============================================================================
/**
 * Showing error messages clearly to locate where the error is coming from
 */
function showError(message) {
  statusEl.textContent = `❌ ${message}`;
  statusEl.style.color = '#d32f2f'; 
  statusEl.classList.remove('muted');
  
  // Auto-clear error after 5 seconds
  setTimeout(() => {
    statusEl.textContent = '';
    statusEl.style.color = '';
    statusEl.classList.add('muted');
  }, 5000);
}

// ============================================================================
// PAGE LOAD: Initialize the app when the page loads
// ============================================================================
/**
 * Wait for Appwrite SDK to load, then initialize everything
 * This function checks if Appwrite is loaded, and if not, waits a bit and tries again
 * 
 * When the page loads (or when user returns from Google OAuth redirect),
 * check if they're logged in and show the appropriate UI
 * 
 * After Google OAuth redirects back here, Appwrite automatically handles
 * the session cookie, so init() will detect the logged-in user
 */
let appwriteLoadAttempts = 0;
const MAX_LOAD_ATTEMPTS = 100; // Wait up to 10 seconds

function waitForAppwriteAndInit() {
  // Check if config is valid
  if (!configValidated) {
    document.body.innerHTML = `
      <div style="padding: 40px; max-width: 600px; margin: 50px auto; text-align: center;">
        <h2 style="color: #d32f2f;">Configuration Error</h2>
        <p>Please update <code>config.js</code> with your Appwrite credentials.</p>
        <p style="margin-top: 20px; color: #666;">
          See README.md for detailed setup instructions.
        </p>
      </div>
    `;
    return;
  }
  
  if (window.Appwrite) {
    // Appwrite is loaded, initialize everything
    console.log('Appwrite SDK detected, initializing...');
    
    // Initialize Appwrite client
    if (!initializeAppwrite()) {
      document.body.innerHTML = '<div style="padding: 20px; color: red;"><h2>Error Loading App</h2><p>Failed to initialize Appwrite. Check console for details.</p></div>';
      return;
    }
    
    // Initialize UI elements
    if (!initializeUIElements()) {
      console.error('Failed to initialize UI elements');
      document.body.innerHTML = '<div style="padding: 20px; color: red;"><h2>Error Loading App</h2><p>Please check the browser console for details.</p></div>';
      return;
    }
    
    // Set up event handlers
    setupLoginHandler();
    setupLogoutHandler();
    setupSaveHandler();
    
    // Initialize app state
    init();
    
    console.log('App initialized successfully');
    console.log('Make sure you have:');
    console.log('1. Configured Google OAuth in Appwrite Console');
    console.log('2. Set redirect URL to:', window.location.href);
    console.log('3. Updated APPWRITE_PROJECT_ID in script.js');
  } else {
    // Appwrite not loaded yet, wait a bit and try again
    appwriteLoadAttempts++;
    if (appwriteLoadAttempts % 10 === 0) {
      console.log(`Still waiting for Appwrite SDK... (attempt ${appwriteLoadAttempts}/${MAX_LOAD_ATTEMPTS})`);
    }
    
    if (appwriteLoadAttempts >= MAX_LOAD_ATTEMPTS) {
      console.error('Appwrite SDK failed to load after', MAX_LOAD_ATTEMPTS * 100, 'ms');
      console.error('Troubleshooting:');
      console.error('1. Check Network tab - is appwrite.min.js loading?');
      console.error('2. Check if CDN is blocked by firewall/adblocker');
      console.error('3. Try accessing: https://cdn.jsdelivr.net/npm/appwrite@8.5.0/dist/appwrite.min.js');
      document.body.innerHTML = `
        <div style="padding: 20px; color: red; max-width: 600px; margin: 50px auto;">
          <h2>Error Loading App</h2>
          <p><strong>Appwrite SDK failed to load.</strong></p>
          <p>Possible causes:</p>
          <ul>
            <li>No internet connection</li>
            <li>CDN blocked by firewall/adblocker</li>
            <li>Slow network connection</li>
          </ul>
          <p><strong>Try:</strong></p>
          <ol>
            <li>Check browser Network tab (F12) - look for appwrite.min.js</li>
            <li>Disable adblockers/extensions</li>
            <li>Check firewall settings</li>
            <li>Try refreshing the page</li>
          </ol>
        </div>
      `;
      return;
    }
    setTimeout(waitForAppwriteAndInit, 100);
  }
}

// Start initialization when DOM is ready
window.addEventListener('DOMContentLoaded', waitForAppwriteAndInit);
