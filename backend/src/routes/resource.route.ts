import { Router } from "express";
import {
  uploadResource,
  getAllResources,
  getTrendingResources,
  getMyUploads,
  getResourceById,
  updateResource,
  deleteResource,
  toggleHype,
  addComment,
  getComments,
  deleteComment,
  downloadResource,
  searchResources,
} from "../controller/resource.controller";
import { authMiddleware } from "../middleware/auth.middleware.js"; 

export const resourceRouter = Router();

resourceRouter.post("/", authMiddleware, uploadResource);
resourceRouter.get("/", getAllResources);
resourceRouter.get("/top", getTrendingResources);
resourceRouter.get("/my", authMiddleware, getMyUploads);
resourceRouter.get("/:id", getResourceById);
resourceRouter.put("/:id", authMiddleware, updateResource);
resourceRouter.delete("/:id", authMiddleware, deleteResource);

resourceRouter.post("/:id/hype", authMiddleware, toggleHype);

resourceRouter.post("/:id/comment", authMiddleware, addComment);
resourceRouter.get("/:id/comments", getComments);
resourceRouter.delete("/comments/:id", authMiddleware, deleteComment);

resourceRouter.post("/:id/download", downloadResource);
resourceRouter.get("/search", searchResources);
