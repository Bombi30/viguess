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
  { id: 'sg-50', city: 'Saigon', name: 'Bến phà Bình Khánh (H. Nhà Bè)', desc: 'Cửa ngõ nối liền Cần Giờ', lat: 10.6860, lng: 106.7570 },

  // ─── ĐÀ NẴNG ───
  { id: 'dn-1', city: 'DaNang', name: 'Cầu Rồng (Đà Nẵng)', desc: 'Địa danh du lịch nổi tiếng tại Đà Nẵng', lat: 16.06119, lng: 108.22682 },
  { id: 'dn-2', city: 'DaNang', name: 'Cầu Sông Hàn (Đà Nẵng)', desc: 'Địa danh du lịch nổi tiếng tại Đà Nẵng', lat: 16.07191, lng: 108.22268 },
  { id: 'dn-3', city: 'DaNang', name: 'Chùa Linh Ứng (Đà Nẵng)', desc: 'Địa danh du lịch nổi tiếng tại Đà Nẵng', lat: 16.09941, lng: 108.27836 },
  { id: 'dn-4', city: 'DaNang', name: 'Bãi biển Mỹ Khê (Đà Nẵng)', desc: 'Địa danh du lịch nổi tiếng tại Đà Nẵng', lat: 16.05896, lng: 108.24661 },
  { id: 'dn-5', city: 'DaNang', name: 'Ngũ Hành Sơn (Đà Nẵng)', desc: 'Địa danh du lịch nổi tiếng tại Đà Nẵng', lat: 16.00229, lng: 108.26440 },

  // ─── ĐÀ LẠT ───
  { id: 'dl-1', city: 'DaLat', name: 'Hồ Xuân Hương (Đà Lạt)', desc: 'Địa danh du lịch nổi tiếng tại Đà Lạt', lat: 11.94243, lng: 108.44446 },
  { id: 'dl-2', city: 'DaLat', name: 'Quảng trường Lâm Viên (Đà Lạt)', desc: 'Địa danh du lịch nổi tiếng tại Đà Lạt', lat: 11.93935, lng: 108.44444 },
  { id: 'dl-3', city: 'DaLat', name: 'Ga Đà Lạt (Đà Lạt)', desc: 'Địa danh du lịch nổi tiếng tại Đà Lạt', lat: 11.94023, lng: 108.45061 },
  { id: 'dl-4', city: 'DaLat', name: 'Thác Datanla (Đà Lạt)', desc: 'Địa danh du lịch nổi tiếng tại Đà Lạt', lat: 11.90332, lng: 108.44771 },

  // ─── HỘI AN ───
  { id: 'ha-1', city: 'HoiAn', name: 'Chùa Cầu (Hội An)', desc: 'Địa danh du lịch nổi tiếng tại Hội An', lat: 15.87628, lng: 108.32522 },
  { id: 'ha-2', city: 'HoiAn', name: 'Hội quán Phúc Kiến (Hội An)', desc: 'Địa danh du lịch nổi tiếng tại Hội An', lat: 15.87743, lng: 108.33043 },
  { id: 'ha-3', city: 'HoiAn', name: 'Phố cổ Hội An (Hội An)', desc: 'Địa danh du lịch nổi tiếng tại Hội An', lat: 15.87605, lng: 108.32896 },

  // ─── VŨNG TÀU ───
  { id: 'vt-1', city: 'VungTau', name: 'Tượng Chúa Kitô Vua (Vũng Tàu)', desc: 'Địa danh du lịch nổi tiếng tại Vũng Tàu', lat: 10.32352, lng: 107.08462 },
  { id: 'vt-2', city: 'VungTau', name: 'Ngọn hải đăng Vũng Tàu (Vũng Tàu)', desc: 'Địa danh du lịch nổi tiếng tại Vũng Tàu', lat: 10.33414, lng: 107.07889 },
  { id: 'vt-3', city: 'VungTau', name: 'Mũi Nghinh Phong (Vũng Tàu)', desc: 'Địa danh du lịch nổi tiếng tại Vũng Tàu', lat: 10.32347, lng: 107.08423 },

  // ─── NHA TRANG ───
  { id: 'nt-1', city: 'NhaTrang', name: 'Tháp Bà Ponagar (Nha Trang)', desc: 'Địa danh du lịch nổi tiếng tại Nha Trang', lat: 12.26556, lng: 109.19620 },
  { id: 'nt-2', city: 'NhaTrang', name: 'Chùa Long Sơn (Nha Trang)', desc: 'Địa danh du lịch nổi tiếng tại Nha Trang', lat: 12.24987, lng: 109.18057 },
  { id: 'nt-3', city: 'NhaTrang', name: 'Quảng trường 2 Tháng 4 (Nha Trang)', desc: 'Địa danh du lịch nổi tiếng tại Nha Trang', lat: 12.24144, lng: 109.19644 },
  { id: 'nt-4', city: 'NhaTrang', name: 'Nhà thờ Đá Nha Trang (Nhà thờ Núi)', desc: 'Địa danh du lịch nổi tiếng tại Nha Trang', lat: 12.24702, lng: 109.18737 },

  // ─── SA PA ───
  { id: 'sp-1', city: 'SaPa', name: 'Hồ Sa Pa (Sa Pa)', desc: 'Địa danh du lịch nổi tiếng tại Sa Pa', lat: 22.33790, lng: 103.84848 },
  { id: 'sp-2', city: 'SaPa', name: 'Nhà thờ Đá Sa Pa (Sa Pa)', desc: 'Địa danh du lịch nổi tiếng tại Sa Pa', lat: 22.33614, lng: 103.84248 },
  { id: 'sp-3', city: 'SaPa', name: 'Bản Cát Cát (Sa Pa)', desc: 'Địa danh du lịch nổi tiếng tại Sa Pa', lat: 22.32900, lng: 103.83417 },

  // ─── 100 ĐỊA DANH TOÀN QUỐC MỞ RỘNG (BATCH 1) ───
  { id: 'mx-1', city: 'QuangNinh', name: 'Cầu Bãi Cháy (Quảng Ninh)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 20.95668, lng: 107.05575 },
  { id: 'mx-2', city: 'HaiPhong', name: 'Nhà hát lớn Hải Phòng (Hải Phòng)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 20.85850, lng: 106.68142 },
  { id: 'mx-3', city: 'HaiPhong', name: 'Ga Hải Phòng (Hải Phòng)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 20.85629, lng: 106.68805 },
  { id: 'mx-4', city: 'HaiPhong', name: 'Cát Bà (Cảng tàu)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 20.72421, lng: 107.04936 },
  { id: 'mx-5', city: 'HaiPhong', name: 'Cầu Hoàng Văn Thụ (Hải Phòng)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 20.87070, lng: 106.68136 },
  { id: 'mx-6', city: 'NinhBinh', name: 'Khu du lịch Tràng An (Ninh Bình)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 20.25519, lng: 105.89964 },
  { id: 'mx-7', city: 'NinhBinh', name: 'Cố đô Hoa Lư (Ninh Bình)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 20.28464, lng: 105.90632 },
  { id: 'mx-8', city: 'NinhBinh', name: 'Nhà thờ đá Phát Diệm (Ninh Bình)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 20.09067, lng: 106.08186 },
  { id: 'mx-9', city: 'HaGiang', name: 'Cột mốc số 0 (Hà Giang)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 22.82362, lng: 104.98366 },
  { id: 'mx-10', city: 'HaGiang', name: 'Dinh thự họ Vương (Hà Giang)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 23.26102, lng: 105.25386 },
  { id: 'mx-11', city: 'HaGiang', name: 'Phố cổ Đồng Văn (Hà Giang)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 23.27743, lng: 105.35922 },
  { id: 'mx-12', city: 'Hue', name: 'Đại Nội Huế (Huế)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 16.46824, lng: 107.57706 },
  { id: 'mx-13', city: 'Hue', name: 'Lăng Khải Định (Huế)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 16.39691, lng: 107.58962 },
  { id: 'mx-14', city: 'Hue', name: 'Lăng Tự Đức (Huế)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 16.43271, lng: 107.56748 },
  { id: 'mx-15', city: 'Hue', name: 'Cầu Tràng Tiền (Huế)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 16.46993, lng: 107.59419 },
  { id: 'mx-16', city: 'Hue', name: 'Chợ Đông Ba (Huế)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 16.46977, lng: 107.59415 },
  { id: 'mx-17', city: 'QuyNhon', name: 'Tháp Đôi Quy Nhơn (Quy Nhơn)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 13.78805, lng: 109.22000 },
  { id: 'mx-18', city: 'PhuYen', name: 'Tháp Nhạn (Phú Yên)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 13.08772, lng: 109.30245 },
  { id: 'mx-19', city: 'PhuYen', name: 'Bãi Xép (Phú Yên)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 13.21145, lng: 109.28653 },
  { id: 'mx-20', city: 'CanTho', name: 'Bến Ninh Kiều (Cần Thơ)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.03410, lng: 105.78852 },
  { id: 'mx-21', city: 'PhuQuoc', name: 'Dinh Cậu Phú Quốc (Kiên Giang)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.21720, lng: 103.95651 },
  { id: 'mx-22', city: 'PhuQuoc', name: 'Grand World Phú Quốc (Kiên Giang)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.32874, lng: 103.86188 },
  { id: 'mx-23', city: 'PhuQuoc', name: 'VinWonders Phú Quốc (Kiên Giang)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.33579, lng: 103.85453 },
  { id: 'mx-24', city: 'QuangBinh', name: 'Động Phong Nha (Quảng Bình)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 17.58167, lng: 106.28328 },
  { id: 'mx-25', city: 'QuangBinh', name: 'Quảng Bình Quan (Quảng Bình)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 17.46500, lng: 106.62382 },
  { id: 'mx-26', city: 'QuangBinh', name: 'Tượng đài Mẹ Suốt (Quảng Bình)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 17.47298, lng: 106.62360 },
  { id: 'mx-27', city: 'QuangBinh', name: 'Bãi biển Nhật Lệ (Quảng Bình)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 17.48785, lng: 106.62736 },
  { id: 'mx-28', city: 'NgheAn', name: 'Bãi biển Cửa Lò (Nghệ An)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 18.81787, lng: 105.71543 },
  { id: 'mx-29', city: 'GiaLai', name: 'Quảng trường Đại Đoàn Kết (Gia Lai)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 13.97914, lng: 108.00489 },
  { id: 'mx-30', city: 'TienGiang', name: 'Cầu Rạch Miễu (Tiền Giang)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.34351, lng: 106.34235 },
  { id: 'mx-31', city: 'BenTre', name: 'Cầu Hàm Luông (Bến Tre)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.23353, lng: 106.33234 },
  { id: 'mx-32', city: 'DongThap', name: 'Làng hoa Sa Đéc (Đồng Tháp)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.31125, lng: 105.74748 },
  { id: 'mx-33', city: 'DongNai', name: 'Thác Giang Điền (Đồng Nai)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.92448, lng: 106.98181 },
  { id: 'mx-34', city: 'DongNai', name: 'Khu du lịch Bửu Long (Đồng Nai)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.96118, lng: 106.79902 },
  { id: 'mx-35', city: 'BinhDuong', name: 'Khu du lịch Đại Nam (Bình Dương)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 11.04487, lng: 106.63411 },
  { id: 'mx-36', city: 'BinhDuong', name: 'Chùa Bà Thiên Hậu (Bình Dương)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.97901, lng: 106.66800 },
  { id: 'mx-37', city: 'BinhThuan', name: 'Trường Dục Thanh (Bình Thuận)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.93222, lng: 108.10068 },
  { id: 'mx-38', city: 'LangSon', name: 'Đền Mẫu Đồng Đăng (Lạng Sơn)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 21.94318, lng: 106.69728 },
  { id: 'mx-39', city: 'LaoCai', name: 'Ga Lào Cai (Lào Cai)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 22.49337, lng: 103.96918 },
  { id: 'mx-40', city: 'DienBien', name: 'Tượng đài chiến thắng Điện Biên Phủ (Điện Biên)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 21.38267, lng: 103.01841 },
  { id: 'mx-41', city: 'QuangNam', name: 'Thánh địa Mỹ Sơn (Quảng Nam)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 15.76566, lng: 108.12330 },
  { id: 'mx-42', city: 'BacNinh', name: 'Đền Đô (Bắc Ninh)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 21.11295, lng: 105.97984 },
  { id: 'mx-43', city: 'BacNinh', name: 'Chùa Phật Tích (Bắc Ninh)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 21.10187, lng: 106.02184 },

  // ─── 100 ĐỊA DANH TOÀN QUỐC MỞ RỘNG (BATCH 2) ───
  { id: 'mx-44', city: 'HaNam', name: 'Trung tâm TP. Phủ Lý (Hà Nam)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 20.53706, lng: 105.90773 },
  { id: 'mx-45', city: 'NamDinh', name: 'Trung tâm TP. Nam Định (Nam Định)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 20.42193, lng: 106.17901 },
  { id: 'mx-46', city: 'NinhBinh', name: 'Trung tâm TP. Ninh Bình (Ninh Bình)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 20.25081, lng: 105.96787 },
  { id: 'mx-47', city: 'ThanhHoa', name: 'Trung tâm TP. Thanh Hóa (Thanh Hóa)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 19.80079, lng: 105.78000 },
  { id: 'mx-48', city: 'HaTinh', name: 'Trung tâm TP. Hà Tĩnh (Hà Tĩnh)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 18.34299, lng: 105.89728 },
  { id: 'mx-49', city: 'QuangBinh', name: 'Trung tâm TP. Đồng Hới (Quảng Bình)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 17.47302, lng: 106.62369 },
  { id: 'mx-50', city: 'QuangTri', name: 'Trung tâm TP. Đông Hà (Quảng Trị)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 16.81467, lng: 107.10393 },
  { id: 'mx-51', city: 'Hue', name: 'Trung tâm TP. Huế (Thừa Thiên Huế)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 16.46005, lng: 107.59014 },
  { id: 'mx-52', city: 'DaNang', name: 'Trung tâm TP. Đà Nẵng (Đà Nẵng)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 16.07236, lng: 108.22484 },
  { id: 'mx-53', city: 'QuangNam', name: 'Trung tâm TP. Tam Kỳ (Quảng Nam)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 15.56355, lng: 108.48208 },
  { id: 'mx-54', city: 'QuangNgai', name: 'Trung tâm TP. Quảng Ngãi (Quảng Ngãi)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 15.12259, lng: 108.79967 },
  { id: 'mx-55', city: 'QuyNhon', name: 'Trung tâm TP. Quy Nhơn (Bình Định)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 13.75785, lng: 109.21874 },
  { id: 'mx-56', city: 'PhuYen', name: 'Trung tâm TP. Tuy Hòa (Phú Yên)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 13.08597, lng: 109.29875 },
  { id: 'mx-57', city: 'KhanhHoa', name: 'Trung tâm TP. Nha Trang (Khánh Hòa)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 12.24485, lng: 109.18756 },
  { id: 'mx-58', city: 'NinhThuan', name: 'Trung tâm TP. Phan Rang - Tháp Chàm (Ninh Thuận)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 11.55846, lng: 108.99368 },
  { id: 'mx-59', city: 'BinhThuan', name: 'Trung tâm TP. Phan Thiết (Bình Thuận)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 10.93181, lng: 108.10130 },
  { id: 'mx-60', city: 'KonTum', name: 'Trung tâm TP. Kon Tum (Kon Tum)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 14.34526, lng: 108.00074 },
  { id: 'mx-61', city: 'GiaLai', name: 'Trung tâm TP. Pleiku (Gia Lai)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 13.97914, lng: 108.00489 },
  { id: 'mx-62', city: 'LamDong', name: 'Trung tâm TP. Đà Lạt (Lâm Đồng)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 11.93864, lng: 108.44171 },
  { id: 'mx-63', city: 'BinhPhuoc', name: 'Trung tâm TP. Đồng Xoài (Bình Phước)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 11.53254, lng: 106.88120 },
  { id: 'mx-64', city: 'TayNinh', name: 'Trung tâm TP. Tây Ninh (Tây Ninh)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 11.30797, lng: 106.11844 },
  { id: 'mx-65', city: 'BinhDuong', name: 'Trung tâm TP. Thủ Dầu Một (Bình Dương)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 10.97732, lng: 106.65954 },
  { id: 'mx-66', city: 'DongNai', name: 'Trung tâm TP. Biên Hòa (Đồng Nai)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 10.94573, lng: 106.82335 },
  { id: 'mx-67', city: 'BaRiaVungTau', name: 'Trung tâm TP. Bà Rịa (Bà Rịa - Vũng Tàu)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 10.49259, lng: 107.16802 },
  { id: 'mx-68', city: 'TienGiang', name: 'Trung tâm TP. Mỹ Tho (Tiền Giang)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 10.35839, lng: 106.35154 },
  { id: 'mx-69', city: 'BenTre', name: 'Trung tâm TP. Bến Tre (Bến Tre)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 10.23793, lng: 106.37713 },
  { id: 'mx-70', city: 'TraVinh', name: 'Trung tâm TP. Trà Vinh (Trà Vinh)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 9.94074, lng: 106.33757 },
  { id: 'mx-71', city: 'VinhLong', name: 'Trung tâm TP. Vĩnh Long (Vĩnh Long)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 10.25174, lng: 105.96057 },
  { id: 'mx-72', city: 'DongThap', name: 'Trung tâm TP. Cao Lãnh (Đồng Tháp)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 10.45487, lng: 105.62725 },
  { id: 'mx-73', city: 'AnGiang', name: 'Trung tâm TP. Long Xuyên (An Giang)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 10.37418, lng: 105.43347 },
  { id: 'mx-74', city: 'CanTho', name: 'Trung tâm TP. Cần Thơ (Cần Thơ)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 10.02804, lng: 105.77658 },
  { id: 'mx-75', city: 'CaMau', name: 'Trung tâm TP. Cà Mau (Cà Mau)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 9.18027, lng: 105.15021 },
  { id: 'mx-76', city: 'VinhPhuc', name: 'Trung tâm TP. Vĩnh Yên (Vĩnh Phúc)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 21.31350, lng: 105.59934 },
  { id: 'mx-77', city: 'BacNinh', name: 'Trung tâm TP. Bắc Ninh (Bắc Ninh)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 21.17779, lng: 106.07160 },
  { id: 'mx-78', city: 'QuangNinh', name: 'Trung tâm TP. Hạ Long (Quảng Ninh)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 20.94889, lng: 107.07901 },
  { id: 'mx-79', city: 'HaiDuong', name: 'Trung tâm TP. Hải Dương (Hải Dương)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 20.93923, lng: 106.33248 },
  { id: 'mx-80', city: 'HaiPhong', name: 'Trung tâm TP. Hải Phòng (Hải Phòng)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 20.86230, lng: 106.68033 },
  { id: 'mx-81', city: 'HungYen', name: 'Trung tâm TP. Hưng Yên (Hưng Yên)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 20.64754, lng: 106.05349 },
  { id: 'mx-82', city: 'ThaiBinh', name: 'Trung tâm TP. Thái Bình (Thái Bình)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 20.45384, lng: 106.33129 },
  { id: 'mx-83', city: 'HaGiang', name: 'Trung tâm TP. Hà Giang (Hà Giang)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 22.82361, lng: 104.98460 },
  { id: 'mx-84', city: 'ThaiNguyen', name: 'Trung tâm TP. Thái Nguyên (Thái Nguyên)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 21.58901, lng: 105.83778 },
  { id: 'mx-85', city: 'BacGiang', name: 'Trung tâm TP. Bắc Giang (Bắc Giang)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 21.27312, lng: 106.18897 },
  { id: 'mx-86', city: 'PhuTho', name: 'Trung tâm TP. Việt Trì (Phú Thọ)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 21.32227, lng: 105.40085 },
  { id: 'mx-87', city: 'LaiChau', name: 'Trung tâm TP. Lai Châu (Lai Châu)', desc: 'Địa danh trung tâm tỉnh/thành phố tại Việt Nam', lat: 22.39041, lng: 103.47364 },

  // ─── 100 ĐỊA DANH TOÀN QUỐC MỞ RỘNG (BATCH 3) ───
  { id: 'mx-88', city: 'Hue', name: 'Lăng Minh Mạng (Huế)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 16.38814, lng: 107.57268 },
  { id: 'mx-89', city: 'LamDong', name: 'Thiền viện Trúc Lâm Đà Lạt (Lâm Đồng)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 11.90034, lng: 108.43660 },
  { id: 'mx-90', city: 'LamDong', name: 'Hồ Tuyền Lâm (Lâm Đồng)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 11.90039, lng: 108.43650 },
  { id: 'mx-91', city: 'KhanhHoa', name: 'Ga Nha Trang (Khánh Hòa)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 12.24943, lng: 109.18732 },
  { id: 'mx-92', city: 'KhanhHoa', name: 'Viện Hải dương học Nha Trang (Khánh Hòa)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 12.20574, lng: 109.21649 },
  { id: 'mx-93', city: 'DaNang', name: 'Đèo Hải Vân (Đà Nẵng)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 16.18725, lng: 108.13122 },
  { id: 'mx-94', city: 'QuangTri', name: 'Thành cổ Quảng Trị (Quảng Trị)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 16.74017, lng: 107.18605 },
  { id: 'mx-95', city: 'BaRiaVungTau', name: 'Trung tâm TP. Vũng Tàu (Bà Rịa - Vũng Tàu)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.34066, lng: 107.07291 },
  { id: 'mx-96', city: 'DongThap', name: 'Trung tâm TP. Sa Đéc (Đồng Tháp)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.29021, lng: 105.75328 },
  { id: 'mx-97', city: 'AnGiang', name: 'Trung tâm TP. Châu Đốc (An Giang)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.70128, lng: 105.11147 },
  { id: 'mx-98', city: 'KhanhHoa', name: 'Trung tâm TP. Cam Ranh (Khánh Hòa)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 11.91442, lng: 109.13763 },
  { id: 'mx-99', city: 'TayNinh', name: 'Cửa khẩu Mộc Bài (Tây Ninh)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 11.07726, lng: 106.17574 },
  { id: 'mx-100', city: 'CanTho', name: 'Đại học Cần Thơ (Cần Thơ)', desc: 'Địa danh nổi tiếng tại Việt Nam', lat: 10.03126, lng: 105.76839 }
];
