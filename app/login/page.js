"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/library');
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/library');
    } catch (error) {
      console.error("Error signing in with Google:", error);
    }
  };

  if (loading || user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cream">
      <div className="w-full max-w-xs p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800">Welcome</h1>
        <p className="text-center text-gray-600">Sign in to continue</p>
        <button
          onClick={handleGoogleSignIn}
          className="w-full p-3 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
