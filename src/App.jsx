import React, { useEffect, useState } from "react";
import { auth, loginWithGoogle, logout } from "./firebase";
import CareerAIPreview from "./CareerAIPreview";
import { onAuthStateChanged } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {!user ? (
        <div className="flex flex-col items-center justify-center h-screen text-center">
          <h1 className="text-4xl font-bold text-indigo-600">CareerAI</h1>
          <p className="mt-4 text-slate-600">AI Job Accelerator — land jobs faster 🚀</p>
          <button
            onClick={loginWithGoogle}
            className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:brightness-95"
          >
            Sign in with Google
          </button>
        </div>
      ) : (
        <>
          <header className="p-4 flex justify-between items-center bg-white shadow">
            <h1 className="text-2xl font-bold">CareerAI Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-slate-600">{user.displayName}</span>
              <img
                src={user.photoURL}
                alt="profile"
                className="w-10 h-10 rounded-full border"
              />
              <button
                onClick={logout}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
              >
                Logout
              </button>
            </div>
          </header>
          <CareerAIPreview />
        </>
      )}
    </div>
  );
}
