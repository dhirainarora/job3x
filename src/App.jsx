import React, { useState, useEffect } from "react";
import { auth, provider } from "./firebase";
import { signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import CareerAIPreview from "./CareerAIPreview"; // using your canvas frontend

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100">
        <button
          onClick={login}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Top bar with profile + logout */}
      <div className="flex justify-between items-center p-4 bg-white shadow">
        <div className="flex items-center gap-3">
          <img
            src={user.photoURL}
            alt="Profile"
            className="w-10 h-10 rounded-full"
          />
          <p className="font-semibold">{user.displayName}</p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Logout
        </button>
      </div>

      {/* Load your full dashboard */}
      <CareerAIPreview />
    </div>
  );
}
