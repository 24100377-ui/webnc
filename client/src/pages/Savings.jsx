import PagePlaceholder from '../components/PagePlaceholder';

export default function Savings() {
  return (
    <PagePlaceholder
      eyebrow="Tích lũy thông minh"
      title="Tiết kiệm"
      description="Tự động hóa những bước nhỏ để chạm tới sự an tâm."
      items={[
        'Mục tiêu tiết kiệm với số tiền đích và hạn hoàn thành',
        'Phần trăm hoàn thành và số tiền cần để dành mỗi tháng',
        'Ghi nhận từng lần đóng góp, cộng dồn vào mục tiêu',
      ]}
    />
  );
}
