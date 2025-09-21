// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8Y_IoI-Cn0x1KIIOGPGXpgnxKF3EVUOI",
  authDomain: "ehsan-c91f9.firebaseapp.com",
  projectId: "ehsan-c91f9",
  storageBucket: "ehsan-c91f9.appspot.com",
  messagingSenderId: "391329272843",
  appId: "1:391329272843:web:0c54125e5964e5020ee30e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
