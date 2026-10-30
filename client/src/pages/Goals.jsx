import PagePlaceholder from '../components/PagePlaceholder';

export default function Goals() {
  return (
    <PagePlaceholder
      eyebrow="Kế hoạch tương lai"
      title="Mục tiêu tài chính"
      description="Mỗi mục tiêu đều có một lộ trình vừa sức để bắt đầu."
      items={[
        'Danh sách mục tiêu kèm biểu tượng, màu và hạn chót',
        'Tính số tiền cần để dành mỗi tháng để kịp hạn',
        'Lịch sử đóng góp cho từng mục tiêu',
      ]}
    />
  );
}
