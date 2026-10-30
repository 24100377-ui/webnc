import PagePlaceholder from '../components/PagePlaceholder';

export default function Accounts() {
  return (
    <PagePlaceholder
      eyebrow="Tài sản & dòng tiền"
      title="Ví & tài khoản"
      description="Một nơi cho mọi tài khoản, từ tiền mặt đến khoản đầu tư."
      items={[
        'Năm loại tài khoản: ngân hàng, thẻ tín dụng, ví điện tử, tiền mặt, đầu tư',
        'Tổng tài sản ròng tự tính từ số dư các tài khoản',
        'Thêm/sửa/khóa tài khoản, hiển thị hạn mức và 4 số cuối của thẻ',
      ]}
    />
  );
}
