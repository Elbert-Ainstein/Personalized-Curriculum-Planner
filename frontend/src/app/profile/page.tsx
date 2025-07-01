"use client";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
const guestId = "guest@student.com";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("guest") === "true") {
      setIsGuest(true);
    }
  }, []);

  useEffect(() => {
    if (!session && !isGuest) return;
    const fetchDashboard = async () => {
      setLoading(true);
      const studentId = session?.user?.email || guestId;
      const res = await fetch(`${BACKEND_URL}/dashboard?student_id=${studentId}`);
      const data = await res.json();
      setDashboard(data);
      setLoading(false);
    };
    fetchDashboard();
  }, [session, isGuest]);

  if (status === "loading" || loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  if (!session && !isGuest) {
    router.push("/");
    return null;
  }

  const handleSwitchToGoogle = () => {
    localStorage.removeItem("guest");
    setIsGuest(false);
    router.push("/");
  };

  const studentEmail = session?.user?.email || (isGuest ? guestId : "");

  return (
    <main className="flex h-screen bg-gradient-to-br from-gray-100 to-blue-100 justify-center items-center">
      <div className="flex flex-col w-full max-w-xl bg-white rounded-lg shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Student Profile</h1>
          <div className="flex flex-col items-end">
            <button
              className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700 mb-1"
              onClick={() => router.push("/")}
            >
              Back to Courses
            </button>
            {isGuest && (
              <button
                className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 mt-2"
                onClick={handleSwitchToGoogle}
              >
                Switch to Google Login
              </button>
            )}
          </div>
        </div>
        <div className="mb-6">
          <div className="text-gray-600 text-sm mb-1">Email</div>
          <div className="font-medium">{studentEmail}</div>
        </div>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Course Progress</h2>
          <div className="space-y-4">
            {dashboard.map(course => (
              <div key={course.course_id} className="">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-gray-800">{course.title}</span>
                  <span className="text-xs text-gray-500">{course.completed_modules}/{course.total_modules} modules</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all"
                    style={{ width: `${Math.round((course.completed_modules / course.total_modules) * 100)}%` }}
                  ></div>
                </div>
                {course.is_complete && (
                  <span className="text-xs text-green-600 font-semibold ml-1">Completed!</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-2">Badges</h2>
          <div className="flex gap-4">
            {/* Static badges for now */}
            <div className="bg-yellow-300 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow">Beginner</div>
            <div className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-xs font-bold shadow">Enthusiast</div>
          </div>
        </div>
        <button
          className="bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600 mt-2 self-end"
          onClick={() => { if (isGuest) { localStorage.removeItem("guest"); setIsGuest(false); router.push("/"); } else { signOut(); } }}
        >
          Logout
        </button>
      </div>
    </main>
  );
} 