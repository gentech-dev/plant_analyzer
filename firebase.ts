
import { initializeApp, deleteApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import type { Auth } from "firebase/auth";

// Safe environment variable retrieval to prevent "Cannot read properties of undefined"
const getEnv = (key: string): string | undefined => {
  try {
    // Check if import.meta exists and is an object
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {}

  try {
    // Check if process and process.env exist
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {}

  return undefined;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Initialize Firebase variables
let app: FirebaseApp | undefined;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

// Robust check: Ensure keys exist AND are not default placeholders
const isConfigValid = 
    firebaseConfig.apiKey && 
    firebaseConfig.apiKey.length > 0 && 
    !firebaseConfig.apiKey.includes("VITE_FIREBASE"); 

try {
    if (isConfigValid) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        console.log("✅ Firebase initialized successfully (Real Mode).");
    } else {
        console.error("❌ Firebase Config Invalid. Please check your .env file.");
        console.log("Current Config:", firebaseConfig);
    }
} catch (error) {
    console.error("❌ Firebase initialization failed:", error);
}

// Export real services
export { auth, db, storage };

/**
 * Upload file to Firebase Storage (Real Mode)
 * Throws error if upload fails, ensuring no "fake success".
 */
export const uploadFile = async (file: File, folder: string = 'uploads'): Promise<string> => {
  if (!storage) {
      const msg = "Database connection missing. Cannot upload file. Please configure .env";
      console.error(msg);
      throw new Error(msg);
  }
  
  try {
    const filename = `${folder}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filename);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error: any) {
    console.error("Upload Error (Real Mode):", error);
    if (error.code === 'storage/unauthorized') {
        console.error("PERMISSION DENIED: Please check Firebase Storage Rules (Set to 'allow read, write: if true;' for test mode).");
    }
    throw error;
  }
};

/**
 * Create a new user account without logging out the current admin.
 * Uses a secondary Firebase App instance.
 */
export const provisionAccount = async (email: string, password: string): Promise<string> => {
  if (!isConfigValid) throw new Error("Firebase config missing");
  
  // Initialize a secondary app instance to create user without logging out the admin
  // This is a necessary trick in client-side Firebase to perform admin-like actions
  const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = userCredential.user.uid;
    await signOut(secondaryAuth); // Immediately sign out so it doesn't interfere
    return uid;
  } catch (error: any) {
    console.error("Provisioning Error:", error);
    throw error;
  } finally {
    await deleteApp(secondaryApp); // Clean up the secondary app instance
  }
};
