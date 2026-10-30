import PagePlaceholder from '../components/PagePlaceholder';

export default function Budgets() {
  return (
    <PagePlaceholder
      eyebrow="Kế hoạch tháng"
      title="Ngân sách"
      description="Một giới hạn rõ ràng giúp bạn chi tiêu tự do hơn."
      items={[
        'Giới hạn chi tiêu theo từng danh mục trong tháng',
        'Thanh tiến độ, số còn lại và cảnh báo khi chạm 80% hoặc vượt ngân sách',
        'Tạo, sửa, xóa ngân sách; tổng ngân sách tháng cập nhật tức thì',
      ]}
    />
  );
}
