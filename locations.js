const LOCATIONS = [
  // ─── HANOI (50 locations) ───
  // Hoàn Kiếm
  { id: 'hn-1', city: 'Hanoi', name: 'Hồ Hoàn Kiếm – Tháp Rùa (Q. Hoàn Kiếm)', desc: 'Biểu tượng trung tâm Hà Nội', lat: 21.0285, lng: 105.8522 },
  { id: 'hn-2', city: 'Hanoi', name: 'Chợ Đồng Xuân (Q. Hoàn Kiếm)', desc: 'Khu chợ sầm uất lâu đời nhất nhì Hà Nội', lat: 21.0381, lng: 105.8504 },
  { id: 'hn-3', city: 'Hanoi', name: 'Nhà hát Lớn Hà Nội (Q. Hoàn Kiếm)', desc: 'Kiến trúc Pháp cổ điển nổi tiếng', lat: 21.0245, lng: 105.8572 },
  { id: 'hn-4', city: 'Hanoi', name: 'Nhà thờ Lớn Hà Nội (Q. Hoàn Kiếm)', desc: 'Nhà thờ cổ kính phong cách Gothic', lat: 21.0286, lng: 105.8489 },
  { id: 'hn-5', city: 'Hanoi', name: 'Phố đi bộ Tạ Hiện (Q. Hoàn Kiếm)', desc: 'Khu phố Tây nhộn nhịp về đêm', lat: 21.0346, lng: 105.8519 },
  
  // Ba Đình
  { id: 'hn-6', city: 'Hanoi', name: 'Lăng Chủ tịch Hồ Chí Minh (Q. Ba Đình)', desc: 'Công trình lịch sử quan trọng nhất Hà Nội', lat: 21.0368, lng: 105.8348 },
  { id: 'hn-7', city: 'Hanoi', name: 'Hoàng Thành Thăng Long (Q. Ba Đình)', desc: 'Quần thể di tích lịch sử hoàng gia', lat: 21.0360, lng: 105.8390 },
  { id: 'hn-8', city: 'Hanoi', name: 'Lotte Center Đào Tấn (Q. Ba Đình)', desc: 'Tòa nhà cao tầng nổi bật với đài quan sát kính', lat: 21.0318, lng: 105.8122 },
  { id: 'hn-9', city: 'Hanoi', name: 'Chùa Một Cột (Q. Ba Đình)', desc: 'Ngôi chùa có kiến trúc độc đáo nhất Việt Nam', lat: 21.0358, lng: 105.8335 },
  { id: 'hn-10', city: 'Hanoi', name: 'Công viên Lê Nin (Q. Ba Đình)', desc: 'Khuôn viên xanh mát trung tâm thủ đô', lat: 21.0312, lng: 105.8397 },

  // Tây Hồ
  { id: 'hn-11', city: 'Hanoi', name: 'Chùa Trấn Quốc (Q. Tây Hồ)', desc: 'Ngôi chùa hơn 1500 năm tuổi trên Hồ Tây', lat: 21.0462, lng: 105.8259 },
  { id: 'hn-12', city: 'Hanoi', name: 'Công viên Nước Hồ Tây (Q. Tây Hồ)', desc: 'Khu vui chơi giải trí lớn ven hồ', lat: 21.0772, lng: 105.8120 },
  { id: 'hn-13', city: 'Hanoi', name: 'Phủ Tây Hồ (Q. Tây Hồ)', desc: 'Nơi thờ chúa Liễu Hạnh rất linh thiêng', lat: 21.0664, lng: 105.8242 },
  { id: 'hn-14', city: 'Hanoi', name: 'Thung lũng hoa Hồ Tây (Q. Tây Hồ)', desc: 'Địa điểm chụp ảnh tuyệt đẹp', lat: 21.0718, lng: 105.8203 },

  // Đống Đa
  { id: 'hn-15', city: 'Hanoi', name: 'Văn Miếu – Quốc Tử Giám (Q. Đống Đa)', desc: 'Trường đại học đầu tiên của Việt Nam', lat: 21.0277, lng: 105.8355 },
  { id: 'hn-16', city: 'Hanoi', name: 'Ga Hà Nội (Q. Đống Đa)', desc: 'Ga tàu hỏa trung tâm mang kiến trúc Pháp', lat: 21.0252, lng: 105.8415 },
  { id: 'hn-17', city: 'Hanoi', name: 'Gò Đống Đa (Q. Đống Đa)', desc: 'Di tích lịch sử trận chiến Ngọc Hồi - Đống Đa', lat: 21.0135, lng: 105.8252 },
  { id: 'hn-18', city: 'Hanoi', name: 'Vincom Phạm Ngọc Thạch (Q. Đống Đa)', desc: 'Trung tâm mua sắm nhộn nhịp', lat: 21.0069, lng: 105.8317 },
  
  // Hai Bà Trưng
  { id: 'hn-19', city: 'Hanoi', name: 'Công viên Thống Nhất (Q. Hai Bà Trưng)', desc: 'Công viên lớn nhất nội thành Hà Nội', lat: 21.0116, lng: 105.8427 },
  { id: 'hn-20', city: 'Hanoi', name: 'Times City (Q. Hai Bà Trưng)', desc: 'Khu đô thị hiện đại với thủy cung lớn', lat: 20.9950, lng: 105.8675 },
  { id: 'hn-21', city: 'Hanoi', name: 'Chợ Hôm - Đức Viên (Q. Hai Bà Trưng)', desc: 'Khu chợ vải vóc nổi tiếng', lat: 21.0163, lng: 105.8509 },
  { id: 'hn-22', city: 'Hanoi', name: 'Bệnh viện Bạch Mai (Q. Hai Bà Trưng)', desc: 'Bệnh viện đa khoa lớn nhất miền Bắc', lat: 21.0006, lng: 105.8407 },

  // Cầu Giấy
  { id: 'hn-23', city: 'Hanoi', name: 'Keangnam Landmark 72 (Q. Cầu Giấy)', desc: 'Tòa nhà biểu tượng khu vực phía Tây', lat: 21.0175, lng: 105.7839 },
  { id: 'hn-24', city: 'Hanoi', name: 'Bảo tàng Dân tộc học (Q. Cầu Giấy)', desc: 'Nơi lưu giữ văn hóa của 54 dân tộc anh em', lat: 21.0409, lng: 105.7981 },
  { id: 'hn-25', city: 'Hanoi', name: 'Công viên Cầu Giấy (Q. Cầu Giấy)', desc: 'Công viên xanh mát và thoáng đãng', lat: 21.0253, lng: 105.7915 },
  { id: 'hn-26', city: 'Hanoi', name: 'Đại học Quốc gia Hà Nội (Q. Cầu Giấy)', desc: 'Khuôn viên đại học hàng đầu Việt Nam', lat: 21.0375, lng: 105.7820 },

  // Thanh Xuân
  { id: 'hn-27', city: 'Hanoi', name: 'Royal City (Q. Thanh Xuân)', desc: 'Thành phố hoàng gia thu nhỏ dưới lòng đất', lat: 21.0031, lng: 105.8153 },
  { id: 'hn-28', city: 'Hanoi', name: 'Ngã Tư Sở (Q. Thanh Xuân)', desc: 'Nút giao thông sầm uất', lat: 21.0028, lng: 105.8197 },
  { id: 'hn-29', city: 'Hanoi', name: 'Chợ Phùng Khoang (Q. Thanh Xuân)', desc: 'Khu chợ sinh viên sầm uất', lat: 20.9856, lng: 105.7936 },

  // Long Biên
  { id: 'hn-30', city: 'Hanoi', name: 'Cầu Long Biên (Q. Long Biên)', desc: 'Cầu sắt lịch sử qua sông Hồng', lat: 21.0449, lng: 105.8602 },
  { id: 'hn-31', city: 'Hanoi', name: 'Aeon Mall Long Biên (Q. Long Biên)', desc: 'Đại siêu thị Nhật Bản quy mô lớn', lat: 21.0279, lng: 105.8996 },
  { id: 'hn-32', city: 'Hanoi', name: 'Cầu Vĩnh Tuy (Q. Long Biên)', desc: 'Cây cầu bắc ngang sông Hồng', lat: 21.0076, lng: 105.8812 },
  
  // Nam Từ Liêm & Bắc Từ Liêm
  { id: 'hn-33', city: 'Hanoi', name: 'Sân vận động Mỹ Đình (Q. Nam Từ Liêm)', desc: 'Sân vận động quốc gia lớn nhất Việt Nam', lat: 21.0205, lng: 105.7639 },
  { id: 'hn-34', city: 'Hanoi', name: 'Trung tâm Hội nghị Quốc gia (Q. Nam Từ Liêm)', desc: 'Công trình kiến trúc hiện đại vĩ đại', lat: 21.0073, lng: 105.7885 },
  { id: 'hn-35', city: 'Hanoi', name: 'Bảo tàng Hà Nội (Q. Nam Từ Liêm)', desc: 'Tòa nhà hình kim tự tháp lộn ngược', lat: 21.0135, lng: 105.7844 },
  { id: 'hn-36', city: 'Hanoi', name: 'Công viên Hòa Bình (Q. Bắc Từ Liêm)', desc: 'Công viên tưởng niệm hiện đại', lat: 21.0660, lng: 105.7904 },

  // Hà Đông
  { id: 'hn-37', city: 'Hanoi', name: 'Aeon Mall Hà Đông (Q. Hà Đông)', desc: 'Trung tâm thương mại lớn phía Tây Nam', lat: 20.9789, lng: 105.7538 },
  { id: 'hn-38', city: 'Hanoi', name: 'Ga tàu điện Cát Linh - Hà Đông (Q. Hà Đông)', desc: 'Tuyển đường sắt trên cao đầu tiên', lat: 20.9702, lng: 105.7770 },
  { id: 'hn-39', city: 'Hanoi', name: 'Chợ Hà Đông (Q. Hà Đông)', desc: 'Khu chợ truyền thống sầm uất', lat: 20.9734, lng: 105.7766 },

  // Hoàng Mai
  { id: 'hn-40', city: 'Hanoi', name: 'Công viên Yên Sở (Q. Hoàng Mai)', desc: 'Lá phổi xanh rộng lớn phía Nam thành phố', lat: 20.9498, lng: 105.8529 },
  { id: 'hn-41', city: 'Hanoi', name: 'Bến xe Giáp Bát (Q. Hoàng Mai)', desc: 'Bến xe lớn chuyên tuyến phía Nam', lat: 20.9830, lng: 105.8427 },
  { id: 'hn-42', city: 'Hanoi', name: 'Khu đô thị Linh Đàm (Q. Hoàng Mai)', desc: 'Khu đô thị kiểu mẫu đầu tiên', lat: 20.9634, lng: 105.8290 },

  // Ngoại thành (Suburbs)
  { id: 'hn-43', city: 'Hanoi', name: 'Làng gốm Bát Tràng (H. Gia Lâm)', desc: 'Ngôi làng nghề truyền thống nổi tiếng', lat: 20.9760, lng: 105.9149 },
  { id: 'hn-44', city: 'Hanoi', name: 'Vinhomes Ocean Park (H. Gia Lâm)', desc: 'Thành phố biển hồ nhân tạo', lat: 20.9996, lng: 105.9388 },
  { id: 'hn-45', city: 'Hanoi', name: 'Sân bay Quốc tế Nội Bài (H. Sóc Sơn)', desc: 'Cửa ngõ hàng không lớn nhất miền Bắc', lat: 21.2187, lng: 105.8042 },
  { id: 'hn-46', city: 'Hanoi', name: 'Thành Cổ Loa (H. Đông Anh)', desc: 'Di tích kinh đô nước Âu Lạc', lat: 21.1118, lng: 105.8687 },
  { id: 'hn-47', city: 'Hanoi', name: 'Cầu Nhật Tân (H. Đông Anh)', desc: 'Cây cầu dây văng hiện đại nhất Hà Nội', lat: 21.0910, lng: 105.8203 },
  { id: 'hn-48', city: 'Hanoi', name: 'Chùa Thầy (H. Quốc Oai)', desc: 'Ngôi chùa cổ dưới chân núi đá vôi', lat: 21.0345, lng: 105.6375 },
  { id: 'hn-49', city: 'Hanoi', name: 'Làng lụa Vạn Phúc (Q. Hà Đông)', desc: 'Làng nghề dệt lụa tơ tằm truyền thống', lat: 20.9764, lng: 105.7709 },
  { id: 'hn-50', city: 'Hanoi', name: 'Thiên đường Bảo Sơn (H. Hoài Đức)', desc: 'Khu vui chơi giải trí đa năng', lat: 21.0028, lng: 105.7275 },

  // ─── SAIGON (50 locations) ───
  // Quận 1
  { id: 'sg-1', city: 'Saigon', name: 'Chợ Bến Thành (Quận 1)', desc: 'Chợ biểu tượng trung tâm Sài Gòn', lat: 10.7725, lng: 106.6984 },
  { id: 'sg-2', city: 'Saigon', name: 'Phố đi bộ Nguyễn Huệ (Quận 1)', desc: 'Con phố sầm uất nhất trung tâm', lat: 10.7736, lng: 106.7030 },
  { id: 'sg-3', city: 'Saigon', name: 'Thảo Cầm Viên (Quận 1)', desc: 'Công viên sở thú lâu đời nhất Việt Nam', lat: 10.7876, lng: 106.7052 },
  { id: 'sg-4', city: 'Saigon', name: 'Nhà thờ Đức Bà (Quận 1)', desc: 'Nhà thờ Công giáo bằng gạch đỏ độc đáo', lat: 10.7798, lng: 106.6990 },
  { id: 'sg-5', city: 'Saigon', name: 'Bưu điện Trung tâm (Quận 1)', desc: 'Công trình kiến trúc Pháp tuyệt đẹp', lat: 10.7799, lng: 106.7000 },
  { id: 'sg-6', city: 'Saigon', name: 'Dinh Độc Lập (Quận 1)', desc: 'Di tích lịch sử quan trọng của miền Nam', lat: 10.7770, lng: 106.6953 },
  { id: 'sg-7', city: 'Saigon', name: 'Phố Tây Bùi Viện (Quận 1)', desc: 'Khu phố ăn chơi thâu đêm', lat: 10.7675, lng: 106.6939 },

  // Quận 2 (Thủ Đức)
  { id: 'sg-8', city: 'Saigon', name: 'Khu đô thị Sala (Thủ Đức)', desc: 'Khu đô thị sinh thái cao cấp ven sông', lat: 10.7686, lng: 106.7214 },
  { id: 'sg-9', city: 'Saigon', name: 'Vincom Mega Mall Thảo Điền (Thủ Đức)', desc: 'Khu mua sắm lớn tại phố Tây', lat: 10.8033, lng: 106.7358 },
  { id: 'sg-10', city: 'Saigon', name: 'Cầu Sài Gòn (Thủ Đức)', desc: 'Cây cầu huyết mạch kết nối đôi bờ sông', lat: 10.7963, lng: 106.7265 },

  // Quận 3
  { id: 'sg-11', city: 'Saigon', name: 'Hồ Con Rùa (Quận 3)', desc: 'Vòng xoay giao thông kết hợp đài phun nước', lat: 10.7825, lng: 106.6961 },
  { id: 'sg-12', city: 'Saigon', name: 'Ga Sài Gòn (Quận 3)', desc: 'Ga đường sắt cuối cùng của tuyến Bắc - Nam', lat: 10.7830, lng: 106.6763 },
  { id: 'sg-13', city: 'Saigon', name: 'Chùa Tân Định (Quận 3)', desc: 'Ngôi chùa có kiến trúc màu hồng độc đáo', lat: 10.7891, lng: 106.6895 },
  { id: 'sg-14', city: 'Saigon', name: 'Nhà thờ Tân Định (Quận 3)', desc: 'Nhà thờ màu hồng tuyệt đẹp', lat: 10.7894, lng: 106.6896 },

  // Quận 4 & Quận 5 & Quận 6
  { id: 'sg-15', city: 'Saigon', name: 'Bến Nhà Rồng (Quận 4)', desc: 'Di tích lịch sử nơi Bác Hồ ra đi tìm đường cứu nước', lat: 10.7682, lng: 106.7068 },
  { id: 'sg-16', city: 'Saigon', name: 'Đường Tôn Đản (Quận 4)', desc: 'Khu phố ẩm thực sầm uất', lat: 10.7622, lng: 106.7061 },
  { id: 'sg-17', city: 'Saigon', name: 'Chợ An Đông (Quận 5)', desc: 'Chợ buôn bán sầm uất lâu đời của người Hoa', lat: 10.7570, lng: 106.6713 },
  { id: 'sg-18', city: 'Saigon', name: 'Chùa Bà Thiên Hậu (Quận 5)', desc: 'Ngôi chùa người Hoa cổ kính nhất', lat: 10.7533, lng: 106.6617 },
  { id: 'sg-19', city: 'Saigon', name: 'Thuận Kiều Plaza (Quận 5)', desc: 'Tòa nhà mang kiến trúc đặc biệt', lat: 10.7554, lng: 106.6588 },
  { id: 'sg-20', city: 'Saigon', name: 'Chợ Bình Tây - Chợ Lớn (Quận 6)', desc: 'Khu chợ sầm uất mang đậm kiến trúc Hoa', lat: 10.7497, lng: 106.6508 },
  { id: 'sg-21', city: 'Saigon', name: 'Vòng xoay Phú Lâm (Quận 6)', desc: 'Nút giao thông lớn khu vực phía Tây', lat: 10.7495, lng: 106.6343 },

  // Quận 7 & Quận 8
  { id: 'sg-22', city: 'Saigon', name: 'Cầu Ánh Sao – Phú Mỹ Hưng (Quận 7)', desc: 'Cầu đi bộ lãng mạn tại khu đô thị hiện đại', lat: 10.7291, lng: 106.7022 },
  { id: 'sg-23', city: 'Saigon', name: 'Crescent Mall (Quận 7)', desc: 'Trung tâm mua sắm sang trọng', lat: 10.7302, lng: 106.7118 },
  { id: 'sg-24', city: 'Saigon', name: 'Đại học RMIT (Quận 7)', desc: 'Khuôn viên trường đại học quốc tế', lat: 10.7296, lng: 106.6946 },
  { id: 'sg-25', city: 'Saigon', name: 'Cầu chữ Y (Quận 8)', desc: 'Cây cầu nối ba nhánh sông độc đáo', lat: 10.7540, lng: 106.6795 },
  { id: 'sg-26', city: 'Saigon', name: 'Bến Bình Đông (Quận 8)', desc: 'Khu vực ghe thuyền buôn bán nhộn nhịp', lat: 10.7410, lng: 106.6575 },

  // Quận 10 & Quận 11 & Quận 12
  { id: 'sg-27', city: 'Saigon', name: 'Vạn Hạnh Mall (Quận 10)', desc: 'Trung tâm thương mại lớn và nhộn nhịp', lat: 10.7745, lng: 106.6698 },
  { id: 'sg-28', city: 'Saigon', name: 'Công viên Lê Thị Riêng (Quận 10)', desc: 'Khu công viên xanh yêu thích của giới trẻ', lat: 10.7830, lng: 106.6631 },
  { id: 'sg-29', city: 'Saigon', name: 'Công viên Văn hóa Đầm Sen (Quận 11)', desc: 'Khu du lịch giải trí nổi tiếng ở phía Tây', lat: 10.7685, lng: 106.6387 },
  { id: 'sg-30', city: 'Saigon', name: 'Nhà thi đấu Phú Thọ (Quận 11)', desc: 'Khu liên hợp thể thao quy mô', lat: 10.7712, lng: 106.6548 },
  { id: 'sg-31', city: 'Saigon', name: 'Công viên Phần mềm Quang Trung (Quận 12)', desc: 'Khu công nghệ thông tin lớn nhất', lat: 10.8524, lng: 106.6268 },
  
  // Bình Thạnh & Phú Nhuận
  { id: 'sg-32', city: 'Saigon', name: 'Landmark 81 (Q. Bình Thạnh)', desc: 'Tòa nhà cao nhất Việt Nam', lat: 10.7951, lng: 106.7218 },
  { id: 'sg-33', city: 'Saigon', name: 'Khu du lịch Văn Thánh (Q. Bình Thạnh)', desc: 'Không gian xanh mướt ngay trong phố', lat: 10.8016, lng: 106.7137 },
  { id: 'sg-34', city: 'Saigon', name: 'Bến xe Miền Đông cũ (Q. Bình Thạnh)', desc: 'Khu bến xe tấp nập khách và phương tiện', lat: 10.8143, lng: 106.7111 },
  { id: 'sg-35', city: 'Saigon', name: 'Phố ẩm thực Phan Xích Long (Q. Phú Nhuận)', desc: 'Con đường ăn uống sầm uất bậc nhất', lat: 10.7981, lng: 106.6896 },
  { id: 'sg-36', city: 'Saigon', name: 'Chùa Vĩnh Nghiêm (Q. Phú Nhuận)', desc: 'Ngôi chùa bằng gỗ lớn nhất', lat: 10.7915, lng: 106.6841 },

  // Tân Bình, Tân Phú, Gò Vấp, Bình Tân
  { id: 'sg-37', city: 'Saigon', name: 'Sân bay Tân Sơn Nhất (Q. Tân Bình)', desc: 'Khu vực cổng ngoài của sân bay quốc tế', lat: 10.8166, lng: 106.6631 },
  { id: 'sg-38', city: 'Saigon', name: 'Công viên Hoàng Văn Thụ (Q. Tân Bình)', desc: 'Lá phổi xanh độc đáo hình tam giác', lat: 10.8015, lng: 106.6657 },
  { id: 'sg-39', city: 'Saigon', name: 'Aeon Mall Tân Phú (Q. Tân Phú)', desc: 'Trung tâm mua sắm sầm uất phía Tây', lat: 10.8012, lng: 106.6171 },
  { id: 'sg-40', city: 'Saigon', name: 'Chợ Hạnh Thông Tây (Q. Gò Vấp)', desc: 'Khu chợ đêm nổi tiếng nhất Gò Vấp', lat: 10.8350, lng: 106.6545 },
  { id: 'sg-41', city: 'Saigon', name: 'Vincom Plaza Gò Vấp (Q. Gò Vấp)', desc: 'Điểm đến vui chơi sầm uất', lat: 10.8286, lng: 106.6865 },
  { id: 'sg-42', city: 'Saigon', name: 'Aeon Mall Bình Tân (Q. Bình Tân)', desc: 'Trung tâm mua sắm lớn khu vực phía Tây', lat: 10.7423, lng: 106.6083 },
  { id: 'sg-43', city: 'Saigon', name: 'Khu Tên Lửa (Q. Bình Tân)', desc: 'Khu dân cư hiện đại bậc nhất Bình Tân', lat: 10.7485, lng: 106.6120 },

  // TP. Thủ Đức (Quận 9, Thủ Đức cũ) & Ngoại thành
  { id: 'sg-44', city: 'Saigon', name: 'Suối Tiên (TP. Thủ Đức)', desc: 'Khu du lịch văn hóa tâm linh khổng lồ', lat: 10.8643, lng: 106.8027 },
  { id: 'sg-45', city: 'Saigon', name: 'Làng Đại học Quốc gia (TP. Thủ Đức)', desc: 'Khu dân cư sinh viên nhộn nhịp', lat: 10.8703, lng: 106.8028 },
  { id: 'sg-46', city: 'Saigon', name: 'Chợ Thủ Đức (TP. Thủ Đức)', desc: 'Chợ truyền thống sầm uất', lat: 10.8490, lng: 106.7580 },
  { id: 'sg-47', city: 'Saigon', name: 'Địa đạo Củ Chi (H. Củ Chi)', desc: 'Di tích lịch sử nổi tiếng quốc tế', lat: 11.1429, lng: 106.4633 },
  { id: 'sg-48', city: 'Saigon', name: 'Chợ Hóc Môn (H. Hóc Môn)', desc: 'Chợ đầu mối nông sản sầm uất', lat: 10.8872, lng: 106.5939 },
  { id: 'sg-49', city: 'Saigon', name: 'Cầu Bình Điền (H. Bình Chánh)', desc: 'Cửa ngõ miền Tây Nam Bộ', lat: 10.7203, lng: 106.5954 },
  { id: 'sg-50', city: 'Saigon', name: 'Bến phà Bình Khánh (H. Nhà Bè)', desc: 'Cửa ngõ nối liền Cần Giờ', lat: 10.6860, lng: 106.7570 }
];

