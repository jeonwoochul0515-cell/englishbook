"use client";

import { useAuth } from "../context/AuthContext"; // Corrected import path
import { auth } from "../firebase/config"; // Corrected import path
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading || !user) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>; // Or a proper loader
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Profile</h1>
      <div className="flex items-center mb-6">
        <img src={user.photoURL} alt={user.displayName} className="w-16 h-16 rounded-full mr-4" />
        <div>
          <h2 className="text-xl font-semibold">{user.displayName}</h2>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>
      
      <button
        onClick={handleLogout}
        className="w-full max-w-xs p-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors"
      >
        Logout
      </button>
      <p className="text-gray-600 mt-4">학습 통계는 여기에 표시됩니다.</p>
    </div>
  );
}
