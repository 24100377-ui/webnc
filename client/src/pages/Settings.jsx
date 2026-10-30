import PagePlaceholder from '../components/PagePlaceholder';

export default function Settings() {
  return (
    <PagePlaceholder
      eyebrow="Cá nhân hóa"
      title="Cài đặt"
      description="Một vài lựa chọn nhỏ để Finora hợp với bạn hơn."
      items={[
        'Cập nhật họ tên, email và ảnh đại diện',
        'Chọn giao diện sáng/tối, đơn vị tiền tệ, ngày bắt đầu tháng',
        'Bật/tắt nhắc ngân sách, báo cáo tháng và gợi ý thông minh',
      ]}
    />
  );
}
