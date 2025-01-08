# CodeZen

Test API Gateway

```sh
curl http://localhost:8080/
curl http://localhost:8080/api/users/
curl http://localhost:8080/api/code-manager/
curl http://localhost:8080/api/chatbot/
```

Note Docker
```
sudo docker exec -it <CONTAINER_ID or NAME> sh
```

Note Docker child container
| **Thuộc tính**        | **Mô tả**                                                                                                                                   | **Giá trị trong mã**                                                   |
|------------------------|-------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------|
| `image`               | Tên của Docker image được sử dụng để tạo container.                                                                                      | `image=image`                                                         |
| `command`             | Lệnh sẽ được thực thi trong container.                                                                                                   | `command=command`                                                     |
| `volumes`             | Ánh xạ thư mục trên host vào container. `bind` xác định nơi thư mục sẽ được gắn kết trong container, và `mode` xác định quyền truy cập. | `{user_dir: {"bind": f"{user_dir}", "mode": "rw"}}`                    |
| `working_dir`         | Thư mục làm việc bên trong container.                                                                                                    | `f"{user_dir}"`                                                       |
| `network_disabled`    | Nếu `True`, tắt toàn bộ mạng trong container để tăng cường bảo mật.                                                                      | `True`                                                                |
| `mem_limit`           | Giới hạn bộ nhớ tối đa mà container có thể sử dụng.                                                                                      | `"300m"` (300 MB)                                                     |
| `mem_reservation`     | Bộ nhớ đảm bảo container có thể sử dụng.                                                                                                 | `"200m"` (200 MB)                                                     |
| `memswap_limit`       | Giới hạn tổng bộ nhớ và swap mà container có thể sử dụng.                                                                                | `"300m"` (300 MB)                                                     |
| `mem_swappiness`      | Mức độ ưu tiên sử dụng swap (0 = không sử dụng, 100 = ưu tiên cao).                                                                      | `0`                                                                   |
| `cpu_period`          | Chu kỳ đo CPU (đơn vị microseconds).                                                                                                    | `100000` (100ms)                                                      |
| `cpu_quota`           | Giới hạn CPU tối đa mà container có thể sử dụng, được tính theo phần trăm của `cpu_period`.                                             | `100000` (tương ứng với 1 CPU)                                        |
| `pids_limit`          | Số lượng process tối đa mà container có thể tạo ra.                                                                                     | `50`                                                                  |
| `privileged`          | Nếu `True`, container sẽ chạy trong chế độ đặc quyền, cho phép truy cập cấp thấp đến hệ thống host.                                      | `False`                                                               |
| `detach`              | Nếu `True`, container sẽ chạy ở chế độ tách rời và không chặn chương trình chính.                                                       | `False` (container chạy và trả về log ngay lập tức)                   |
| `stderr`              | Nếu `True`, cho phép ghi log từ luồng lỗi chuẩn (stderr).                                                                               | `True`                                                                |
| `stdout`              | Nếu `True`, cho phép ghi log từ luồng đầu ra chuẩn (stdout).                                                                             | `True`                                                                |
| `remove`              | Nếu `True`, container sẽ bị xóa tự động sau khi kết thúc.                                                                               | `True`                                                                |
| `ulimits`             | Danh sách giới hạn tài nguyên hệ thống như số file mở (`nofile`) và số process (`nproc`).                                               | `container_ulimits`                                                   |

> Tổng bộ nhớ khả dụng = memswap_limit = mem_limit + SWAP
>
> memswap_limit = -1: Không giới hạn SWAP (chỉ giới hạn RAM bằng mem_limit).
>
> memswap_limit = mem_limit: Không cho phép sử dụng SWAP (container chỉ được phép sử dụng RAM).
