import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // Chức năng: Lấy dữ liệu Hello. Cách hoạt động: Truy vấn dữ liệu và trả về kết quả đã định dạng.
  getHello(): string {
    return 'Hello World!';
  }
}
