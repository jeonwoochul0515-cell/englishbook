'use client';

import { useAuth } from "../context/AuthContext";
import { auth, db } from "../firebase/config";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";

// Helper function to calculate level and progress
const calculateLevel = (xp) => {
  const levels = [
    { level: 1, minXp: 0, maxXp: 100 },
    { level: 2, minXp: 100, maxXp: 300 },
    { level: 3, minXp: 300, maxXp: 600 },
    { level: 4, minXp: 600, maxXp: 1000 },
    { level: 5, minXp: 1000, maxXp: 1500 },
  ];

  const currentLevelInfo = levels.find(l => xp >= l.minXp && xp < l.maxXp) || levels[levels.length - 1];
  const nextLevelInfo = levels.find(l => l.level === currentLevelInfo.level + 1);

  if (!nextLevelInfo) { // Max level reached
    return { ...currentLevelInfo, progress: 100, xpToNextLevel: 0 };
  }

  const xpInCurrentLevel = xp - currentLevelInfo.minXp;
  const xpForNextLevel = nextLevelInfo.minXp - currentLevelInfo.minXp;
  const progress = (xpInCurrentLevel / xpForNextLevel) * 100;

  return { ...currentLevelInfo, progress, xpToNextLevel: nextLevelInfo.minXp - xp };
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState({ xp: 0 });

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }

    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        }
      });

      // Cleanup subscription on unmount
      return () => unsubscribe();
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
    return <div className="flex items-center justify-center h-screen bg-cream">Loading...</div>;
  }

  const { level, progress, xpToNextLevel } = calculateLevel(userData.xp || 0);

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 space-y-6">
        
        <div className="text-center">
            <img 
              src={user.photoURL || 'https://via.placeholder.com/100'} 
              alt={user.displayName} 
              className="w-24 h-24 rounded-full mx-auto ring-4 ring-orange-300 shadow-lg"
            />
            <h2 className="text-3xl font-bold mt-4 text-gray-800">{user.displayName}</h2>
            <p className="text-md text-gray-500">{user.email}</p>
        </div>

        <div className="space-y-4">
            <div className="flex justify-between items-baseline">
                <h3 className="font-bold text-lg text-gray-700">Level {level}</h3>
                <span className="text-sm font-semibold text-orange-500">{userData.xp} XP</span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                <div 
                    className="bg-gradient-to-r from-orange-400 to-yellow-400 h-4 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            <p className="text-center text-sm text-gray-600">
                {xpToNextLevel > 0 ? `${xpToNextLevel} XP until next level` : "You've reached the max level!"}
            </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full p-3 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition-colors font-semibold"
        >
          Logout
        </button>

      </div>
    </div>
  );
}
