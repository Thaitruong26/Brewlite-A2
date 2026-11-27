import { SetMetadata } from '@nestjs/common';
import { Role } from '../../generated/prisma/client.js';

export const ROLES_KEY = 'roles';
// Chức năng: Hàm Roles(roles). Cách hoạt động: Thực thi logic xử lý nghiệp vụ của module và trả về kết quả cho nơi gọi.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
