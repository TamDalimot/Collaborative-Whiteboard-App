// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBMSH4WChfQPtEUQqEkoHCO7BUatLCrmEI",
    authDomain: "javascript4-major-project.firebaseapp.com",
    projectId: "javascript4-major-project",
    storageBucket: "javascript4-major-project.appspot.com",
    messagingSenderId: "609537585855",
    appId: "1:609537585855:web:6800ffaae4e41f26750c0a",
    measurementId: "G-33P2JDEW5F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);