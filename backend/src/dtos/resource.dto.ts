export interface UploadResourceDTO {
  title: string;
  description: string;
  fileUrl: string;
  university?: string;
  department?: string;
  semester?: number;
  courseCode?: string;
  courseName?: string;
  resourceType?: string;
}

export interface UpdateResourceDTO extends Partial<UploadResourceDTO> {
  id?: string;
}

export interface CommentDTO {
  content: string;
}
