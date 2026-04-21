// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth,GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interviewiq-8d90a.firebaseapp.com",
  projectId: "interviewiq-8d90a",
  storageBucket: "interviewiq-8d90a.firebasestorage.app",
  messagingSenderId: "252118260616",
  appId: "1:252118260616:web:0c08f105662ef5db8bb83d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth=getAuth(app);

const provider=new GoogleAuthProvider();

export {auth,provider};

