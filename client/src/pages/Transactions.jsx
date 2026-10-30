import PagePlaceholder from '../components/PagePlaceholder';

export default function Transactions() {
  return (
    <PagePlaceholder
      eyebrow="Dòng tiền"
      title="Giao dịch"
      description="Tìm, lọc và hiểu rõ từng khoản tiền ra vào."
      items={[
        'Bảng giao dịch có tìm kiếm, lọc theo loại, danh mục, tài khoản và khoảng ngày',
        'Thêm/sửa/xóa giao dịch, phân trang và sắp xếp theo số tiền hoặc ngày',
        'Chuyển khoản giữa hai tài khoản, số dư cập nhật trong cùng transaction SQL',
      ]}
    />
  );
}
