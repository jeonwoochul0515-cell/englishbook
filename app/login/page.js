"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../firebase/config"; // Corrected import path
import { useAuth } from "../context/AuthContext"; // Corrected import path
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/library");
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save user to Firestore
      await setDoc(doc(db, "users", user.uid), {
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
      }, { merge: true });

    } catch (error) {
      console.error("Error during Google sign-in:", error);
    }
  };

  if (loading || user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>; // Or a proper loader
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cream px-4 text-center">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800">ReadEasy.ai</h1>
        <p className="text-gray-600 mt-2">AI와 함께 영어 독서, 쉽고 즐겁게</p>
      </div>
      <button
        onClick={handleGoogleSignIn}
        className="flex items-center justify-center w-full max-w-xs p-3 bg-white border border-gray-300 rounded-lg shadow-md hover:bg-gray-50 transition-colors"
      >
        <FcGoogle size={24} className="mr-3" />
        <span className="font-semibold text-gray-700">Sign in with Google</span>
      </button>
      <p className="text-xs text-gray-500 mt-6">© 2024 ReadEasy.ai. All rights reserved.</p>
    </div>
  );
}
