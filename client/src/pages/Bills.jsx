import PagePlaceholder from '../components/PagePlaceholder';

export default function Bills() {
  return (
    <PagePlaceholder
      eyebrow="Thanh toán tự động"
      title="Hóa đơn định kỳ"
      description="Biết trước những khoản sẽ đến để luôn chủ động."
      items={[
        'Danh sách hóa đơn lặp theo tuần/tháng/năm và ngày đến hạn kế tiếp',
        'Đếm ngược số ngày còn lại, đánh dấu hóa đơn sắp đến hạn',
        'Bấm "thanh toán" để sinh giao dịch và trừ đúng tài khoản',
      ]}
    />
  );
}
