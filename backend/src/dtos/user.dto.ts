export interface UpdateProfileDTO {
  name?: string;
  institute?: string;
  major?: string;
};

export interface ChangePasswordDTO {
  oldPassword: string;
  newPassword: string;
};