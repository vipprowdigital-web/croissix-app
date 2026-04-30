// api/course.api.ts
import { API } from "@/api/client";

// ===== Types ===== //
export interface CourseQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface CoursePagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CourseSEO {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export interface CourseCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface Course {
  _id: string;
  title: string;
  slug: string;
  category?: CourseCategory | null;
  short_description?: string;
  description?: string;
  level?: "beginner" | "intermediate" | "advanced";
  duration?: string;
  price?: number | null;
  sale_price?: number | null;
  lessons_count?: number | null;
  intro_video?: string | null;
  thumbnail?: string | null;
  gallery_images?: string[];
  seo?: CourseSEO;
  isActive?: boolean;
  isFeature?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseApiResponse {
  success: boolean;
  data: Course[];
  pagination: CoursePagination;
}

// ===== Fetch Public Courses ===== //
export const fetchPublicCourses = async (
  params: CourseQuery = {}
): Promise<CourseApiResponse> => {
  const res = await API.get("/course", { params });
  return res.data;
};

// ===== Fetch Single Course ===== //
export const fetchCourseById = async (id: string): Promise<Course> => {
  const res = await API.get(`/course/${id}`);
  return res.data.data;
};
