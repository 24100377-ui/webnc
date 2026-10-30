import PagePlaceholder from '../components/PagePlaceholder';

export default function Reports() {
  return (
    <PagePlaceholder
      eyebrow="Góc nhìn dài hạn"
      title="Báo cáo & phân tích"
      description="Những con số trở nên hữu ích khi giúp bạn hành động tốt hơn."
      items={[
        'Dòng tiền thu – chi theo tuần, tháng, 6 tháng',
        'Tài sản ròng theo thời gian và top danh mục chi tiêu',
        'Xuất dữ liệu CSV để mở bằng Excel',
      ]}
    />
  );
}
