import type {Metadata} from 'next';
import {cookies} from 'next/headers';
import Link from 'next/link';
import {redirect} from 'next/navigation';
import styles from './page.module.css';

export const metadata:Metadata={
  title:'LIMI — Trợ lý tuân thủ pháp luật cho doanh nghiệp',
  description:'LIMI lập danh sách nghĩa vụ pháp lý theo hồ sơ thực tế của doanh nghiệp, nhắc hạn và báo khi luật thay đổi. Mỗi việc đều dẫn về điều luật gốc.',
  icons:{icon:'/prototype/limi-mark.svg?v=1'},
};

const features=[
  ['Việc cần làm theo đúng hồ sơ','Trả lời vài câu hỏi về nhân sự, kênh bán hàng, địa điểm; LIMI chỉ giữ lại những nghĩa vụ áp dụng cho bạn, kèm các bước kiểm tra cụ thể.'],
  ['Nhắc hạn trước khi trễ','Theo dõi hạn pháp lý và mốc nội bộ, phân công người phụ trách, lưu bằng chứng đã thực hiện trong cùng một chỗ.'],
  ['Biết ngay khi luật thay đổi','LIMI theo dõi nguồn văn bản chính thức; thay đổi chỉ được gửi tới doanh nghiệp sau khi chuyên gia đối chiếu tác động.'],
  ['Luôn có căn cứ để đối chiếu','Mỗi công việc dẫn về điều khoản gốc trong thư viện văn bản, đọc được toàn văn và bản PDF chính thức.'],
] as const;

const steps=[
  ['Nhập mã số thuế','Lấy tên, địa chỉ và tình trạng thuế từ nguồn công khai, hoặc tự nhập hồ sơ.'],
  ['Xác nhận hoạt động thực tế','Quy mô lao động, kênh bán, địa điểm… Mục nào chưa chắc có thể để trống.'],
  ['Theo dõi việc cần làm','Danh sách công việc, hạn và cảnh báo thay đổi luật được cập nhật theo hồ sơ.'],
] as const;

export default async function Home(){
  const jar=await cookies();
  // Signed-in users go straight to their workspace; the session itself is verified by the API.
  if(jar.has('__Host-limi_session')||jar.has('limi_session'))redirect('/workspace');
  return <div className={styles.page}>
    <header className={styles.nav}>
      <Link href="/" className={styles.brand} aria-label="LIMI — trang chủ">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/prototype/limi-mark.svg?v=1" alt="" width={40} height={40}/>
        <span><strong>LIMI</strong><small>Legal Intelligence, Monitoring &amp; Insights</small></span>
      </Link>
      <nav aria-label="Liên kết chính" className={styles.links}>
        <a href="/workspace?view=laws">Tra cứu văn bản</a>
        <a href="/workspace?view=account">Đăng nhập</a>
        <a href="/workspace?view=account&amp;mode=register" className={styles.cta}>Tạo tài khoản</a>
      </nav>
    </header>
    <main>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>TRỢ LÝ TUÂN THỦ CHO DOANH NGHIỆP VIỆT NAM</p>
        <h1>Biết doanh nghiệp cần làm gì theo luật, và làm trước khi đến hạn.</h1>
        <p className={styles.lead}>LIMI lập danh sách nghĩa vụ pháp lý theo hồ sơ thực tế của doanh nghiệp, nhắc hạn và báo khi luật thay đổi. Mỗi việc đều dẫn về điều luật gốc để bạn tự đối chiếu.</p>
        <div className={styles.actions}>
          <a href="/workspace?view=account&amp;mode=register" className={styles.primary}>Tạo tài khoản doanh nghiệp</a>
          <a href="/workspace?view=laws" className={styles.secondary}>Tra cứu văn bản không cần đăng nhập</a>
        </div>
      </section>
      <section aria-labelledby="features" className={styles.section}>
        <h2 id="features">LIMI giúp gì cho bạn</h2>
        <div className={styles.grid}>{features.map(([title,text])=><article key={title} className={styles.card}><h3>{title}</h3><p>{text}</p></article>)}</div>
      </section>
      <section aria-labelledby="how" className={styles.section}>
        <h2 id="how">Bắt đầu trong ba bước</h2>
        <ol className={styles.steps}>{steps.map(([title,text],i)=><li key={title}><span aria-hidden="true">{i+1}</span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol>
      </section>
      <section aria-labelledby="trust" className={`${styles.section} ${styles.trust}`}>
        <h2 id="trust">Minh bạch về nội dung và dữ liệu</h2>
        <ul>
          <li><strong>Ghi rõ mức thẩm định.</strong> Mỗi công việc cho biết đã được chuyên gia LIMI duyệt hay đang chờ thẩm định.</li>
          <li><strong>Là công cụ hỗ trợ.</strong> LIMI giúp bạn rà soát và theo dõi; kết luận pháp lý cho trường hợp cụ thể vẫn cần chuyên gia tư vấn.</li>
          <li><strong>Dữ liệu thuộc về doanh nghiệp.</strong> Hồ sơ lưu theo tài khoản và phân quyền theo thành viên; tệp bằng chứng lưu trong kho riêng, chỉ thành viên được cấp quyền mới tải xuống.</li>
        </ul>
      </section>
    </main>
    <footer className={styles.footer}><span>© 2026 LIMI</span><a href="/workspace?view=laws">Thư viện văn bản</a><a href="/workspace?view=account">Đăng nhập</a></footer>
  </div>;
}
