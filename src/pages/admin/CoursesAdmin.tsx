import React, { useEffect, useState } from "react";
import { createCourse, deleteCourse, subscribeCourses } from "@/lib/courseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type Course = { id: string; title: string; description?: string; createdAt?: string };

export default function CoursesAdmin() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsub = subscribeCourses(
      (items) => setCourses(items as any),
      (err) => toast({ title: "Failed to subscribe to courses", description: String(err), variant: "destructive" })
    );
    return () => unsub();
  }, []);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      await createCourse({ title: title.trim(), description: description.trim() });
      setTitle("");
      setDescription("");
      toast({ title: "Course created" });
    } catch (err) {
      toast({ title: "Unable to create course", description: String(err), variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCourse(id);
      toast({ title: "Course deleted" });
    } catch (err) {
      toast({ title: "Unable to delete course", description: String(err), variant: "destructive" });
    }
  };

  return (
    <div>
      <h2 className="page-title">Courses</h2>

      <div className="card" style={{ padding: 16, marginBottom: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Input placeholder="Course title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button onClick={handleCreate} disabled={isCreating}>{isCreating ? "Creating..." : "Create"}</Button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Title</th><th>Description</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td style={{ maxWidth: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.description}</td>
                <td>
                  <Button variant="destructive" className="btn" onClick={() => handleDelete(c.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
