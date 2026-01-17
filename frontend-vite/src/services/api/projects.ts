import { apiFetch } from "./config";
import type {
  Project,
  ApiResponse,
  CreateProjectRequest,
  UpdateProjectRequest,
} from "./types";

export const projectsApi = {
  // Get all projects
  async getProjects(): Promise<ApiResponse<Project[]>> {
    try {
      const response = await apiFetch<{
        projects: Project[];
        total: number;
      }>("/projects");
      return { data: response.projects, success: true };
    } catch (error: any) {
      return {
        data: [],
        success: false,
        message: error.message || "Failed to fetch projects",
      };
    }
  },

  // Get single project
  async getProject(id: string): Promise<ApiResponse<Project>> {
    try {
      const project = await apiFetch<Project>(`/projects/${id}`);
      return { data: project, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as Project,
        success: false,
        message: "Project not found",
      };
    }
  },

  // Create project
  async createProject(data: CreateProjectRequest): Promise<ApiResponse<Project>> {
    try {
      const project = await apiFetch<Project>("/projects", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return { data: project, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as Project,
        success: false,
        message: error.message || "Failed to create project",
      };
    }
  },

  // Update project
  async updateProject(
    id: string,
    data: UpdateProjectRequest
  ): Promise<ApiResponse<Project>> {
    try {
      const project = await apiFetch<Project>(`/projects/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      return { data: project, success: true };
    } catch (error: any) {
      return {
        data: null as unknown as Project,
        success: false,
        message: error.message || "Failed to update project",
      };
    }
  },

  // Delete project
  async deleteProject(id: string): Promise<ApiResponse<void>> {
    try {
      await apiFetch<void>(`/projects/${id}`, {
        method: "DELETE",
      });
      return { data: undefined, success: true };
    } catch (error: any) {
      return {
        data: undefined,
        success: false,
        message: error.message || "Failed to delete project",
      };
    }
  },
};
