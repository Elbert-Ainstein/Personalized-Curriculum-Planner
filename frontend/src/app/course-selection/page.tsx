"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
const guestId = "guest@student.com";

export default function CourseSelectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [error, setError] = useState("");

  // Debug logging
  console.log("[CourseSelectionPage] status:", status, "session:", session, "isGuest:", isGuest, "loading:", loading);

  useEffect(() => {
    // Check guest mode on mount
    if (typeof window !== "undefined" && localStorage.getItem("guest") === "true") {
      setIsGuest(true);
      console.log("[CourseSelectionPage] Guest mode enabled via localStorage");
    } else if (!session) {
      setLoading(false); // Not logged in and not guest, show login options
    }
  }, [session]);

  useEffect(() => {
    if (!session && !isGuest) return;
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const studentId = session?.user?.email || guestId;
        console.log("[CourseSelectionPage] Fetching courses and progress for studentId:", studentId);
        const res = await fetch(`${BACKEND_URL}/courses`);
        if (!res.ok) throw new Error("Failed to fetch courses");
        const courseList = await res.json();
        setCourses(courseList);
        const progressRes = await fetch(`${BACKEND_URL}/progress?student_id=${studentId}`);
        if (!progressRes.ok) throw new Error("Failed to fetch progress");
        const progressData = await progressRes.json();
        setProgress(progressData);
      } catch (err: any) {
        setError(err.message || "An error occurred while loading data.");
        console.error("[CourseSelectionPage] Error:", err);
      } finally {
        setLoading(false);
        console.log("[CourseSelectionPage] Loading set to false");
      }
    };
    fetchData();
  }, [session, isGuest]);

  if (status === "loading" || loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-4">
        <div className="text-red-600 font-semibold text-lg">{error}</div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  // Not logged in and not guest: show login options
  if (!session && !isGuest) {
    return (
      <main className="flex h-screen bg-gray-100 justify-center items-center">
        <div className="flex flex-col items-center bg-white p-8 rounded-lg shadow-xl">
          <h1 className="text-2xl font-bold mb-4">Personalized Curriculum Planner</h1>
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 mb-3"
            onClick={() => signIn("google")}
          >
            Sign in with Google
          </button>
          <button
            className="bg-gray-300 text-gray-800 px-6 py-2 rounded font-semibold hover:bg-gray-400"
            onClick={() => { localStorage.setItem("guest", "true"); setIsGuest(true); }}
          >
            Continue as Guest
          </button>
        </div>
      </main>
    );
  }

  // If guest, show switch to Google login
  const handleSwitchToGoogle = () => {
    localStorage.removeItem("guest");
    setIsGuest(false);
  };

  // Logout handler
  const handleLogout = () => {
    if (isGuest) {
      localStorage.removeItem("guest");
      setIsGuest(false);
      setLoading(false); // Ensure loading is false after guest logout
      window.location.reload();
    } else {
      signOut({ callbackUrl: "/" });
      setLoading(false); // Ensure loading is false after Google logout
    }
  };

  // Helper: enrolled if progress exists for course
  const enrolledCourseIds = Object.keys(progress);
  const studentEmail = session?.user?.email || (isGuest ? guestId : "");

  return (
    <main className="flex h-screen bg-gradient-to-br from-gray-100 to-blue-100 justify-center items-center">
      <div className="flex flex-col w-full max-w-2xl bg-white rounded-lg shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Select a Course</h1>
          <div className="flex flex-col items-end">
            <div className="flex gap-2 mb-1">
              <button
                className="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                onClick={() => router.push("/profile")}
              >
                Profile
              </button>
              {session || isGuest ? (
                <button
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              ) : (
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
                  onClick={() => router.push("/login")}
                >
                  Login / Register
                </button>
              )}
            </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map(course => {
            const enrolled = enrolledCourseIds.includes(course.id);
            return (
              <div
                key={course.id}
                className={`border rounded-lg p-6 flex flex-col items-start shadow transition hover:shadow-lg cursor-pointer bg-gradient-to-br from-white to-gray-50 ${enrolled ? "border-blue-500" : "border-gray-200"}`}
                onClick={() => router.push(`/course/${course.id}`)}
              >
                <h2 className="text-lg font-semibold mb-2">{course.title}</h2>
                {enrolled ? (
                  <span className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">Enrolled</span>
                ) : (
                  <span className="text-xs text-gray-500">Not enrolled</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-8 text-center text-gray-400 text-xs">Welcome, {studentEmail}</div>
      </div>
    </main>
  );
} 