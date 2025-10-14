import { Request, Response, NextFunction } from "express";
import prisma from "../libs/prisma.js";
import {
  UploadResourceDTO,
  UpdateResourceDTO,
  CommentDTO,
} from "../dtos/resource.dto.js";

// POST /api/resources
export const uploadResource = async (
  req: Request<{}, {}, UploadResourceDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return next({ status: 401, message: "Unauthorized" });

    const resource = await prisma.resource.create({
      data: { ...req.body, uploaderId: userId },
      include: {
        _count: { select: { hypes: true } },
      },
    });

    res.status(201).json({ success: true, data: resource });
  } catch (e) {
    next(e);
  }
};

// GET /api/resources
export const getAllResources = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      page = "1",
      limit = "10",
      university,
      department,
      search,
    } = req.query;

    const filters: any = {};
    if (university) filters.university = String(university);
    if (department) filters.department = String(department);
    if (search)
      filters.title = { contains: String(search), mode: "insensitive" };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const resources = await prisma.resource.findMany({
      where: filters,
      orderBy: { createdAt: "desc" },
      skip,
      take: parseInt(limit as string),
      include: {
        uploader: { select: { name: true, institute: true } },
        _count: { select: { hypes: true } },
      },
    });

    res.status(200).json({ success: true, data: resources });
  } catch (e) {
    next(e);
  }
};

// GET /api/resources/top
export const getTrendingResources = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const top = await prisma.resource.findMany({
      orderBy: [
        { hypes: { _count: "desc" } },
        { comments: { _count: "desc" } },
        { views: "desc" },
      ],
      take: 10,
      include: {
        uploader: { select: { name: true, institute: true } },
        _count: { select: { hypes: true } },
      },
    });

    res.status(200).json({ success: true, data: top });
  } catch (e) {
    next(e);
  }
};

// GET /api/resources/my
export const getMyUploads = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return next({ status: 401, message: "Unauthorized" });

    const myResources = await prisma.resource.findMany({
      where: { uploaderId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { hypes: true } },
      },
    });

    res.status(200).json({ success: true, data: myResources });
  } catch (e) {
    next(e);
  }
};

// GET /api/resources/:id
export const getResourceById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const resource = await prisma.resource.findUnique({
      where: { id },
      include: {
        uploader: { select: { name: true, institute: true } },
        _count: { select: { hypes: true } },
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    await prisma.resource.update({
      where: { id },
      data: {
        views: { increment: 1 },
      },
    });

    if (!resource) return next({ status: 404, message: "Resource not found" });
    res.status(200).json({ success: true, data: resource });
  } catch (e) {
    next(e);
  }
};

// PUT /api/resources/:id
export const updateResource = async (
  req: Request<{ id: string }, {}, UpdateResourceDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) return next({ status: 401, message: "Unauthorized" });

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource || resource.uploaderId !== userId)
      return next({ status: 403, message: "Not allowed" });

    const updated = await prisma.resource.update({
      where: { id },
      data: req.body,
      include: { _count: { select: { hypes: true } } },
    });

    res.status(200).json({ success: true, message: "Updated", data: updated });
  } catch (e) {
    next(e);
  }
};

// DELETE /api/resources/:id
export const deleteResource = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    if (!userId) return next({ status: 401, message: "Unauthorized" });

    const resource = await prisma.resource.findUnique({ where: { id } });
    if (!resource || resource.uploaderId !== userId)
      return next({ status: 403, message: "Not allowed" });

    await prisma.comment.deleteMany({ where: { resourceId: id } });
    await prisma.hype.deleteMany({ where: { resourceId: id } });
    await prisma.resource.delete({ where: { id } });

    res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (e) {
    next(e);
  }
};

// POST /api/resources/:id/hype
export const toggleHype = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) return next({ status: 401, message: "Unauthorized" });

    const existing = await prisma.hype.findUnique({
      where: { userId_resourceId: { userId, resourceId: id } },
    });

    if (existing) {
      await prisma.hype.delete({ where: { id: existing.id } });
      return res.status(200).json({ success: true, message: "Unhyped" });
    } else {
      await prisma.hype.create({ data: { userId, resourceId: id } });
      return res.status(201).json({ success: true, message: "Hyped" });
    }
  } catch (e) {
    next(e);
  }
};

// POST /api/resources/:id/comment
export const addComment = async (
  req: Request<{ id: string }, {}, CommentDTO>,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { content } = req.body;
    if (!userId) return next({ status: 401, message: "Unauthorized" });
    if (!content) return next({ status: 400, message: "Content required" });

    const comment = await prisma.comment.create({
      data: { content, userId, resourceId: id },
      include: { user: { select: { name: true } } },
    });

    res.status(201).json({ success: true, data: comment });
  } catch (e) {
    next(e);
  }
};

// GET /api/resources/:id/comments
export const getComments = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { resourceId: id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ success: true, data: comments });
  } catch (e) {
    next(e);
  }
};

// DELETE /api/comments/:id
export const deleteComment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId) return next({ status: 401, message: "Unauthorized" });

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.userId !== userId)
      return next({ status: 403, message: "Not allowed" });

    await prisma.comment.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (e) {
    next(e);
  }
};

// download count incrementer and also gives the download link to front end
export const downloadResource = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resource = await prisma.resource.update({
      where: { id },
      data: { downloads: { increment: 1 } },
    });

    res.status(200).json({
      message: "Download recorded",
      fileUrl: resource.fileUrl,
    });
  } catch (error) {
    console.error("Error recording download:", error);
    res.status(500).json({ error: "Failed to record download" });
  }
};

// GET /api/resources/search?query=math&page=2&limit=20
export const searchResources = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      query,
      type,
      university,
      department,
      semester,
      courseCode,
      courseName,
      page = "1",
      limit = "30",
    } = req.query as any;

    const filters: any[] = [];

    if (query) {
      filters.push({
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { university: { contains: query, mode: "insensitive" } },
          { department: { contains: query, mode: "insensitive" } },
          { courseCode: { contains: query, mode: "insensitive" } },
          { courseName: { contains: query, mode: "insensitive" } },
        ],
      });
    }

    if (type) filters.push({ resourceType: type });
    if (university) filters.push({ university });
    if (department) filters.push({ department });
    if (semester) filters.push({ semester: Number(semester) });
    if (courseCode) filters.push({ courseCode });
    if (courseName) filters.push({ courseName });

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [resources, totalCount] = await Promise.all([
      prisma.resource.findMany({
        where: filters.length ? { AND: filters } : {},
        include: {
          uploader: { select: { id: true, name: true, institute: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.resource.count({
        where: filters.length ? { AND: filters } : {},
      }),
    ]);

    res.status(200).json({
      success: true,
      data: resources,
      pagination: {
        total: totalCount,
        page: pageNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (e) {
    next(e);
  }
};
