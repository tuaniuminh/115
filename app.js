/* ==========================================================================
   APPLICATION LOGIC - SƠ CỨU 115 PWA (v2.0.0)
   ========================================================================== */

const APP_VERSION = '2.0.0';

// Global Audio Context for Metronome (Used only in Stepper Overlay)
let audioCtx = null;
let metronomeInterval = null;
let isMetronomePlaying = false;
let metronomeBpm = 110; // Updated to match training standard of 110 BPM

// Quiz State variables
let currentQuizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

// Stepper Overlay variables
let currentEmergencyId = '';
let currentStepIndex = 0;

/* ==========================================================================
   DATABASE: DETAILED CLINICAL EMERGENCY GUIDES (8 SITUATIONS)
   ========================================================================== */
const emergencyData = {
  cardiac_arrest: {
    title: "Ngừng tim & Ngừng tuần hoàn",
    imagePath: "./assets/cpr.png",
    steps: [
      {
        title: "Đảm bảo an toàn hiện trường",
        desc: "Lập tức quan sát xung quanh. Kiểm tra các mối nguy như rò rỉ điện, đám cháy, sạt lở, xe cộ đi lại hoặc khí độc. Đảm bảo an toàn tuyệt đối cho bản thân người sơ cứu trước khi tiếp cận nạn nhân.",
        imagePath: "./assets/cpr.png"
      },
      {
        title: "Kiểm tra phản ứng và gọi 115",
        desc: "Vỗ mạnh vào hai bên vai nạn nhân và hỏi lớn: <strong>'Anh/Chị có nghe thấy tôi nói không?'</strong>. Nếu không phản ứng, lật ngửa nạn nhân, kiểm tra nhịp thở trong 10 giây. Nếu không thở hoặc chỉ thở ngáp, lập tức gọi <strong>115</strong> và yêu cầu người xung quanh tìm máy AED.",
        imagePath: "./assets/cpr.png"
      },
      {
        title: "Kỹ thuật đặt tay lên xương ức",
        desc: "Đặt gót bàn tay thứ nhất lên chính giữa lồng ngực nạn nhân (nửa dưới xương ức). Đặt bàn tay thứ hai lên trên bàn tay thứ nhất, đan chéo các ngón tay và kéo ngón tay nhấc lên không chạm vào xương sườn.",
        imagePath: "./assets/cpr.png"
      },
      {
        title: "Tiến hành ép tim ngoài lồng ngực (CPR)",
        desc: "Cánh tay thẳng đứng, khuỷu tay khóa chặt, vai thẳng góc với tay đè lên ngực nạn nhân. Ép sâu xuống <strong>5 - 6 cm</strong> với tốc độ từ <strong>100 - 120 lần/phút</strong>. (Bật nhịp đập 110 BPM chuẩn bên dưới để căn nhịp).",
        imagePath: "./assets/cpr.png"
      },
      {
        title: "Chu kỳ Hồi sức Tim Phổi 30:2",
        desc: "Thực hiện chu kỳ: <strong>30 lần ép tim</strong> xen kẽ <strong>2 lần thổi ngạt</strong>. Nhấc ngửa đầu nâng cằm nạn nhân, bịt mũi, áp kín miệng thổi mạnh hơi trong 1 giây để ngực phồng lên. Nếu không thể thổi ngạt, duy trì ép tim liên tục không ngừng.",
        imagePath: "./assets/cpr.png"
      }
    ],
    theory: {
      physiology: "Khi tim ngừng đập, tuần hoàn máu bị dừng hoàn toàn. Oxy không được vận chuyển đến não bộ và các cơ quan nội tạng. Các tế bào não nhạy cảm nhất với tình trạng thiếu oxy: sau 4 phút thiếu oxy, não bắt đầu bị tổn thương không thể đảo ngược; sau 10 phút, tế bào não chết hàng loạt và cơ hội sống sót gần như bằng không. Ép tim ngoài lồng ngực (CPR) tạo lực cơ học đè ép tim vào cột sống, đẩy máu chứa oxy còn lại đi nuôi dưỡng não và cơ tim, duy trì sự sống lâm sàng.",
      symptoms: [
        "Nạn nhân bất tỉnh nhân sự: lay gọi, cấu véo hoàn toàn không phản ứng.",
        "Ngừng thở hoàn toàn hoặc chỉ xuất hiện những cơn thở ngáp cá (nhịp thở yếu, rời rạc, không có luồng khí ra vào phổi).",
        "Mạch động mạch lớn (cổ, bẹn) không đập (dành cho người có chuyên môn kiểm tra).",
        "Da mặt nhợt nhạt, tím tái, lạnh ẩm, đặc biệt thấy rõ ở môi và các đầu ngón tay/chân."
      ],
      actions: [
        "Gọi 115 lập tức hoặc chỉ định một người cụ thể gọi cấp cứu và mang máy AED đến.",
        "Đặt nạn nhân nằm ngửa trên nền phẳng cứng (nền nhà, mặt đất), không nằm trên đệm lò xo.",
        "Thực hiện ép tim với tốc độ 110 lần/phút, độ sâu ép lồng ngực đạt từ 5 - 6 cm.",
        "Đảm bảo lồng ngực đàn hồi (nở ra) hoàn toàn sau mỗi lần ép trước khi thực hiện nhịp tiếp theo.",
        "Phối hợp 30 lần ép tim với 2 lần thổi ngạt. Nếu có 2 người sơ cứu, luân phiên thay đổi vai trò sau mỗi 2 phút (5 chu kỳ) để tránh kiệt sức làm giảm chất lượng ép tim."
      ],
      donts: [
        "KHÔNG ép tim khi nạn nhân nằm trên nệm, đệm mềm hoặc võng vì lực ép sẽ bị triệt tiêu hoàn toàn xuống nệm, không tác động lên tim.",
        "KHÔNG dừng ép tim quá 10 giây trừ khi cần phân tích nhịp tim bằng máy AED.",
        "KHÔNG ấn quá nông (< 5cm) vì không tạo đủ áp lực tống máu đi nuôi não, hoặc ấn quá sâu (> 6cm) gây chấn thương dập tim, gãy xương sườn đâm rách phổi.",
        "KHÔNG đổ nước, nhét thuốc hay chanh vào miệng người bất tỉnh vì gây tắc đường thở trực tiếp dẫn đến tử vong."
      ]
    }
  },
  choking: {
    title: "Hóc dị vật / Tắc đường thở",
    imagePath: "./assets/choking.png",
    steps: [
      {
        title: "Nhận biết hóc nghẹt thở hoàn toàn",
        desc: "Quan sát nạn nhân đột ngột ôm cổ họng, mặt tím tái, không thể ho, nói hay thở. Hỏi nhanh: <strong>'Bạn có bị hóc không?'</strong>. Nếu gật đầu nhưng không nói được, phải sơ cứu lập tức.",
        imagePath: "./assets/choking.png"
      },
      {
        title: "Khuyên nạn nhân cố ho mạnh",
        desc: "Nếu nạn nhân vẫn còn ho được hoặc nói được ngắt quãng (tắc nghẽn một phần), hãy khuyên họ đứng nghiêng người về phía trước và cố gắng ho thật mạnh để tống dị vật ra ngoài tự nhiên.",
        imagePath: "./assets/choking.png"
      },
      {
        title: "Vỗ lưng mạnh 5 lần (Back Blows)",
        desc: "Đứng hơi chếch phía sau, đỡ ngực nạn nhân bằng một tay và nghiêng họ về phía trước. Dùng gốc bàn tay còn lại vỗ mạnh <strong>5 lần liên tiếp</strong> vào vùng lưng giữa hai xương bả vai.",
        imagePath: "./assets/choking.png"
      },
      {
        title: "Khóa tay thực hiện thủ thuật Heimlich",
        desc: "Vòng hai tay ôm quanh bụng nạn nhân. Nắm một tay thành nắm đấm, đặt ngón cái của nắm đấm vào bụng <strong>phía trên rốn và dưới xương ức</strong>. Dùng tay kia ôm chặt nắm đấm.",
        imagePath: "./assets/choking.png"
      },
      {
        title: "Giật bụng mạnh hướng trong và lên trên",
        desc: "Giật nắm đấm mạnh mẽ vào trong bụng và hướng lên trên <strong>5 lần liên tiếp</strong>. Lặp lại chu kỳ 5 vỗ lưng và 5 giật bụng cho đến khi dị vật ra ngoài hoặc nạn nhân bất tỉnh.",
        imagePath: "./assets/choking.png"
      }
    ],
    theory: {
      physiology: "Hóc dị vật đường thở là tình trạng dị vật (thức ăn, xương, đồ chơi nhỏ) mắc kẹt tại thanh quản hoặc khí quản, gây tắc nghẽn một phần hoặc toàn bộ đường thở. Khi tắc nghẽn hoàn toàn, nồng độ oxy trong máu tụt dốc không phanh, khí CO2 tích tụ gây nhiễm toan máu. Não bộ sẽ bị hủy hoại chỉ sau 4-6 phút không có oxy, tiếp theo là ngừng tim nhanh chóng. Thủ thuật Heimlich sử dụng áp lực cơ học ép đột ngột vào cơ hoành dưới phổi, đẩy lượng khí dự trữ trong phổi vọt lên với vận tốc lớn để tống dị vật ra ngoài như cơ chế một khẩu súng hơi.",
      symptoms: [
        "Nạn nhân đột ngột dùng hai tay ôm chặt lấy cổ (dấu hiệu hóc dị vật quốc tế).",
        "Hoàn toàn không thể nói chuyện, không thể ho thành tiếng hoặc chỉ ho khò khè rất yếu.",
        "Mặt đỏ gay, mắt trợn ngược, các mạch máu cổ nổi lên, da chuyển dần sang tím tái.",
        "Có tiếng thở rít khè khè cao độ khi cố gắng hít vào.",
        "Hôn mê và ngã gục trong vòng 1-2 phút nếu không giải phóng được dị vật."
      ],
      actions: [
        "Hỏi xác nhận: 'Bạn bị hóc phải không?' để phân biệt với cơn nhồi máu cơ tim.",
        "Nếu nạn nhân ho mạnh được, KHÔNG can thiệp thủ thuật mà khuyến khích họ tự ho.",
        "Nếu nghẹt thở hoàn toàn: Thực hiện luân phiên 5 lần vỗ lưng bằng gốc bàn tay và 5 lần giật bụng Heimlich.",
        "Tư thế giật bụng: Ép nắm đấm vào bụng nạn nhân theo hướng giật mạnh xiên chéo từ trước ra sau và từ dưới lên trên.",
        "Đối với phụ nữ mang thai hoặc người quá béo: Thực hiện ép ngực (đặt nắm đấm trên xương ức) thay vì ép bụng.",
        "Nếu nạn nhân bất tỉnh: Đặt nằm ngửa, gọi 115 và tiến hành CPR. Mỗi lần ngửa đầu thổi ngạt, quan sát miệng xem dị vật có bị đẩy lên không để gắp ra."
      ],
      donts: [
        "KHÔNG dùng tay móc mù trong cổ họng nạn nhân khi không nhìn thấy rõ dị vật. Việc này cực kỳ nguy hiểm vì ngón tay có thể vô tình đẩy dị vật lún sâu xuống dưới thanh môn, gây tắc nghẽn hoàn toàn không thể cứu vãn.",
        "KHÔNG vuốt ngực hoặc cho nạn nhân uống nước, ăn cơm để 'trôi dị vật' vì nước sẽ tràn vào phổi gây sặc và cơm làm dị vật kẹt chặt hơn.",
        "KHÔNG thực hiện Heimlich khi nạn nhân vẫn còn ho mạnh hoặc nói được."
      ]
    }
  },
  bleeding: {
    title: "Chảy máu nghiêm trọng",
    imagePath: "./assets/bleeding.png",
    steps: [
      {
        title: "Bảo vệ bản thân & Đặt nằm nghỉ",
        desc: "Đeo găng tay y tế hoặc dùng túi nilon sạch để tránh lây nhiễm qua máu. Cho nạn nhân nằm nghỉ ngơi thoải mái để giảm áp lực tim và làm chậm tốc độ mất máu.",
        imagePath: "./assets/bleeding.png"
      },
      {
        title: "Băng ép trực tiếp liên tục",
        desc: "Đặt miếng gạc sạch hoặc quần áo sạch đè trực tiếp lên vết thương. Dùng bàn tay ép thật mạnh liên tục trong <strong>5 - 10 phút</strong>. Không bỏ tay ra kiểm tra giữa chừng.",
        imagePath: "./assets/bleeding.png"
      },
      {
        title: "Nâng cao chi bị thương",
        desc: "Nếu chi bị tổn thương không gãy xương, nâng chi cao hơn mức tim của nạn nhân. Điều này lợi dụng trọng lực giúp làm giảm áp lực tưới máu và lượng máu thoát ra ngoài.",
        imagePath: "./assets/bleeding.png"
      },
      {
        title: "Đặt ga-rô khi đứt động mạch chi",
        desc: "Nếu máu phun thành tia đỏ tươi từ chi bị dập nát/đứt lìa mà băng ép trực tiếp không cầm được: Quấn băng garo cách vết thương <strong>5 - 7 cm</strong> về phía tim (không đặt đè lên khớp). Xoắn thanh gậy chặt đến khi máu ngừng chảy.",
        imagePath: "./assets/bleeding.png"
      },
      {
        title: "Ghi lại mốc thời gian ga-rô",
        desc: "Ghi rõ giờ thắt ga-rô lên trán nạn nhân (ví dụ: 'Garo 14h15'). Chuyển ngay đến bệnh viện. Tuyệt đối không tự ý nới garo trừ khi có nhân viên y tế giám sát.",
        imagePath: "./assets/bleeding.png"
      }
    ],
    theory: {
      physiology: "Cơ thể người trưởng thành chứa khoảng 5 lít máu. Mất đột ngột 1/5 lượng máu (khoảng 1 lít) sẽ gây ra sốc giảm thể tích: huyết áp giảm sâu, tim đập nhanh nhưng yếu để bù đắp, các tế bào không nhận đủ oxy. Nếu mất hơn 30-40% lượng máu mà không được kiểm soát cấp tốc, cơ thể sẽ rơi vào trạng thái sốc không hồi phục, suy đa tạng và tử vong trong vài phút. Băng ép trực tiếp tạo áp lực ngoài thắng áp lực máu trong mạch, tạo điều kiện cho các tiểu cầu kết tập và hình thành cục máu đông tự nhiên để vá lòng mạch.",
      symptoms: [
        "Máu phun mạnh thành tia đỏ tươi theo nhịp đập của tim (chảy máu động mạch cực nguy cấp).",
        "Máu đỏ sẫm chảy ồ ạt, xối xả liên tục tràn ra khắp vết thương (chảy máu tĩnh mạch lớn).",
        "Nạn nhân vã mồ hôi hột, da lạnh tái nhợt, môi tím, thở nhanh nông.",
        "Chóng mặt, hoa mắt, khát nước dữ dội, lờ đờ rồi mất dần ý thức.",
        "Mạch quay ở cổ tay nhanh nhỏ, yếu ớt hoặc không bắt được."
      ],
      actions: [
        "Ép mạnh trực tiếp lên vết thương bằng gạc hoặc quần áo sạch. Lực ép phải đủ mạnh và liên tục.",
        "Nếu máu thấm đẫm băng cũ, đắp thêm lớp băng mới đè lên trên, KHÔNG cởi bỏ lớp băng cũ.",
        "Dùng băng thun quấn chặt cố định lực ép xung quanh chi bị thương.",
        "Sử dụng garo chỉ khi chảy máu động mạch lớn ở chi không thể kiểm soát bằng băng ép, hoặc chi bị đứt lìa.",
        "Xoắn thanh garo cho đến khi máu ngừng chảy hẳn và mạch đập ở ngọn chi biến mất."
      ],
      donts: [
        "KHÔNG tự ý tháo hoặc nới lỏng dây garo sau khi đã buộc chặt. Việc nới lỏng đột ngột sẽ giải phóng độc tố tích tụ ở vùng chi thiếu máu về tim, gây suy tim cấp, sốc nhiễm độc và chảy máu ồ ạt trở lại dẫn đến tử vong.",
        "KHÔNG đắp bột cà phê, tơ hồng, thuốc lá, đất, hoặc các loại lá cây giã nhỏ lên vết thương chảy máu. Những chất này không có tác dụng đông máu y học mà đưa hàng triệu vi khuẩn trực tiếp vào tuần hoàn, gây nhiễm trùng hoại tử, nhiễm trùng huyết và khiến bác sĩ gặp cực kỳ nhiều khó khăn khi rửa làm sạch vết thương."
      ]
    }
  },
  drowning: {
    title: "Đuối nước",
    imagePath: "./assets/drowning.png",
    steps: [
      {
        title: "Đưa nạn nhân lên bờ an toàn",
        desc: "Sử dụng phao cứu sinh, cây sào dài hoặc thừng kéo nạn nhân vào bờ. Chỉ bơi ra cứu nếu được huấn luyện bơi cứu đuối chuyên nghiệp. KHÔNG để nạn nhân hoảng loạn ôm ghì bạn.",
        imagePath: "./assets/drowning.png"
      },
      {
        title: "Đánh giá nhịp thở & Khai thông đường thở",
        desc: "Đặt nạn nhân nằm ngửa trên nền phẳng, khô ráo. Ngửa đầu nâng cằm để mở rộng đường thở. Dùng ngón tay móc bù đất, rong rêu bám trong khoang miệng ra ngoài.",
        imagePath: "./assets/drowning.png"
      },
      {
        title: "Thổi ngạt cấp cứu 2 - 5 lần",
        desc: "Nạn nhân đuối nước bị thiếu oxy nghiêm trọng. Lập tức bóp mũi, áp kín miệng thổi ngạt mạnh <strong>2 đến 5 hơi đầu tiên</strong> để đưa oxy vào phổi phục hồi chức năng phế nang.",
        imagePath: "./assets/drowning.png"
      },
      {
        title: "Tiến hành hồi sức CPR 30:2",
        desc: "Nếu ngực không nhô lên và không có dấu hiệu thở, thực hiện ngay chu kỳ ép tim và thổi ngạt: <strong>30 lần ép tim, 2 lần thổi ngạt</strong>. Kiên trì thực hiện liên tục.",
        imagePath: "./assets/cpr.png"
      },
      {
        title: "Cởi đồ ướt, giữ ấm & Nghiêng an toàn",
        desc: "Khi nạn nhân tự thở lại, cởi bỏ quần áo ướt lạnh, đắp chăn giữ ấm để tránh hạ thân nhiệt. Đặt nạn nhân nằm nghiêng an toàn để ngăn đờm nhớt hoặc nước từ dạ dày trào ngược vào phổi.",
        imagePath: "./assets/drowning.png"
      }
    ],
    theory: {
      physiology: "Đuối nước là tình trạng suy hô hấp do bị chìm trong chất lỏng. Khi chìm, phản xạ đầu tiên là nín thở, sau đó luồng co thắt thanh quản mạnh mẽ xuất hiện. Khi nồng độ oxy giảm sâu, phản xạ hít vào cưỡng bức buộc nước tràn vào đường thở. Nước xâm nhập vào phế nang phá hủy chất surfactant (chất hoạt diện bảo vệ phổi), làm xẹp phổi, rách màng phế nang mao mạch gây phù phổi cấp tính. Thiếu oxy nghiêm trọng dẫn đến ngừng tim trong vài phút. Việc cấp cứu thổi ngạt ngay lập tức khi đưa lên bờ là mấu chốt sống còn để đưa oxy tái thông phế quản phổi.",
      symptoms: [
        "Nạn nhân sặc sụa, khó thở dữ dội, tím tái môi và toàn thân.",
        "Miệng và mũi sùi bọt hồng (dấu hiệu của phù phổi cấp do nước vào nang phổi).",
        "Lơ mơ, co giật, hôn mê sâu.",
        "Ngừng thở, mạch cổ không đập, tim ngừng tuần hoàn."
      ],
      actions: [
        "Tiếp cận cứu hộ an toàn bằng dụng cụ gián tiếp (phao, sào, dây) từ trên bờ trước.",
        "Móc sạch đờm nhớt, bùn đất trong khoang miệng ngay khi đưa lên bờ.",
        "Thổi ngạt ngay 2-5 hơi đầu tiên để kích thích phổi.",
        "Thực hiện CPR chu kỳ 30 lần ép tim xen kẽ 2 lần thổi ngạt liên tục.",
        "Ủ ấm cơ thể bằng chăn sấy khô, xoa bóp nhẹ để kích thích tuần hoàn ngoại biên."
      ],
      donts: [
        "KHÔNG thực hiện động tác 'xốc nước' (vác ngược nạn nhân chạy vòng quanh). Đây là hành động phản khoa học và cực kỳ nguy hiểm. Lượng nước đi vào phổi thực chất rất ít và bị màng phế nang giữ lại, không thể dốc ra ngoài theo trọng lực. Việc xốc nước làm mất đi 'thời gian vàng' cấp cứu thổi ngạt cứu não, đồng thời làm tăng nguy cơ trào ngược dịch dạ dày ngược vào đường thở gây tắc nghẽn phổi hoàn toàn, hoặc làm chấn thương cột sống cổ nặng thêm."
      ]
    }
  },
  stroke: {
    title: "Đột quỵ (Stroke)",
    imagePath: "./assets/stroke.png",
    steps: [
      {
        title: "Nhận biết Face (Mặt méo)",
        desc: "Yêu cầu nạn nhân cười lớn. Quan sát xem một bên mặt có bị chảy xệ xuống, khóe miệng lệch, méo xệch hoặc nhân trung bị lệch sang một bên hay không.",
        imagePath: "./assets/stroke.png"
      },
      {
        title: "Nhận biết Arms (Yếu tay chân)",
        desc: "Yêu cầu giơ cả hai tay lên phía trước. Quan sát xem một bên tay có bị tê liệt, yếu ớt, không thể nhấc lên cao hoặc tự động rơi thõng xuống hay không.",
        imagePath: "./assets/stroke.png"
      },
      {
        title: "Nhận biết Speech (Nói ngọng)",
        desc: "Yêu cầu nạn nhân nói một câu ngắn đơn giản. Lắng nghe xem giọng nói có bị ngọng nghịu, ú ớ nói không thành câu, hoặc không thể hiểu được câu hỏi của bạn.",
        imagePath: "./assets/stroke.png"
      },
      {
        title: "Hành động Time (Thời gian vàng)",
        desc: "Nếu có bất kỳ dấu hiệu nào trên, gọi <strong>115</strong> lập tức. Ghi nhớ chính xác giờ đầu tiên phát hiện triệu chứng để báo cho bác sĩ cấp cứu.",
        imagePath: "./assets/stroke.png"
      },
      {
        title: "Đặt tư thế đầu cao & Nghiêng khi nôn",
        desc: "Nếu nạn nhân còn tỉnh, đặt nằm yên tĩnh đầu cao 30 độ. Nếu lơ mơ hoặc nôn ói, đặt nằm nghiêng an toàn để giữ đường thở thông suốt, tránh sặc dịch nôn.",
        imagePath: "./assets/drowning.png"
      }
    ],
    theory: {
      physiology: "Đột quỵ não xảy ra khi dòng máu nuôi não bị chặn lại do cục máu đông gây tắc nghẽn (nhồi máu não - chiếm 85% các ca) hoặc do mạch máu não bị vỡ (xuất huyết não). Khi không có máu nuôi dưỡng, các tế bào não tại vùng tổn thương sẽ chết đi với tốc độ khủng khiếp: khoảng 1.9 triệu tế bào thần kinh chết mỗi phút. Thời gian điều trị tái thông tối ưu bằng thuốc tiêu sợi huyết chỉ trong vòng 4.5 giờ từ khi khởi phát triệu chứng. Mọi sự chậm trễ đều trả giá bằng di chứng liệt nửa người, mất ngôn ngữ hoặc tử vong.",
      symptoms: [
        "Méo miệng, lệch một bên mặt, chảy nước dãi khi cố nói chuyện.",
        "Yếu, tê bì hoặc liệt hoàn toàn một bên tay và chân cùng phía.",
        "Nói ngọng nói lắp, gặp khó khăn khi tìm từ ngữ để nói hoặc hoàn toàn không hiểu lời người khác.",
        "Đau đầu dữ dội đột ngột mà không rõ nguyên nhân, kèm theo chóng mặt, mất thăng bằng.",
        "Mắt mờ đột ngột hoặc nhìn đôi (thấy hai hình ảnh)."
      ],
      actions: [
        "Gọi cấp cứu 115 ngay lập tức. Nêu rõ nghi ngờ đột quỵ và thời gian bắt đầu bị.",
        "Đặt nạn nhân nằm đầu cao 30 độ, nới lỏng khuy áo ở cổ, thắt lưng để hỗ trợ thở.",
        "Nếu nạn nhân có hiện tượng trào ngược dịch nôn hoặc lơ mơ, đặt nằm nghiêng an toàn để thông đường thở.",
        "Theo dõi nhịp thở của nạn nhân chặt chẽ. Nếu ngưng thở, tiến hành CPR ngay."
      ],
      donts: [
        "KHÔNG tự ý cho nạn nhân ăn, uống nước, hoặc uống bất kỳ loại thuốc nào (như aspirin, thuốc hạ huyết áp, hay An Cung Ngưu Hoàng Hoàn). Đột quỵ làm liệt cơ hầu họng, nuốt sặc là phản ứng tự nhiên khiến thức ăn/thuốc chui thẳng vào đường thở gây tắc nghẽn phổi, dẫn đến suy hô hấp cấp tử vong lập tức.",
        "KHÔNG thực hiện cạo gió, giật tóc mai, châm cứu hay chích máu đầu ngón tay. Những biện pháp dân gian này không có tác dụng làm tan cục máu đông hay cầm máu não, ngược lại gây đau đớn làm huyết áp nạn nhân vọt tăng cao (khiến xuất huyết não nặng thêm) và làm mất đi thời gian vàng đưa nạn nhân đến bệnh viện."
      ]
    }
  },
  burns: {
    title: "Bỏng nhiệt & hóa chất",
    imagePath: "./assets/burns.png",
    steps: [
      {
        title: "Cách ly nguồn nhiệt nhẹ nhàng",
        desc: "Đưa nạn nhân ra xa nguồn nhiệt. Nhanh chóng nhưng cực kỳ nhẹ nhàng cởi bỏ trang sức hoặc quần áo nóng dính chất nóng trước khi vết bỏng sưng vù lên.",
        imagePath: "./assets/burns.png"
      },
      {
        title: "Xả nước mát sạch vòi chảy nhẹ",
        desc: "Ngâm hoặc xả nhẹ vùng bị bỏng dưới vòi nước mát sạch (nhiệt độ 15-25 độ C) trong thời gian từ <strong>15 - 20 phút</strong> để hạ nhiệt độ lớp da sâu, giảm phù nề.",
        imagePath: "./assets/burns.png"
      },
      {
        title: "Che phủ vết bỏng lỏng bằng gạc sạch",
        desc: "Dùng băng gạc vô trùng khô hoặc màng bọc thực phẩm sạch bọc lỏng nhẹ vết thương để tránh bụi bẩn và nhiễm trùng. Tuyệt đối không băng chặt co siết vùng bỏng.",
        imagePath: "./assets/burns.png"
      },
      {
        title: "Rửa nước nhiều hơn đối với bỏng hóa chất",
        desc: "Nếu bỏng do hóa chất (axit, kiềm), xả nước mát liên tục ít nhất <strong>30 - 45 phút</strong> để hòa tan hóa chất. Nếu là hóa chất khô, chải sạch bột hóa chất trước khi xả nước.",
        imagePath: "./assets/burns.png"
      }
    ],
    theory: {
      physiology: "Bỏng phá hủy cấu trúc da từ nông đến sâu tùy thuộc nhiệt độ và thời gian tiếp xúc. Bỏng độ 1 chỉ ảnh hưởng biểu bì gây đỏ đau. Bỏng độ 2 phá hủy lớp biểu bì và một phần trung bì, tạo bọng nước huyết thanh. Bỏng độ 3 hủy hoại toàn bộ các lớp da, dây thần kinh và mạch máu, da có màu xám xịt hoặc trắng bệch và không còn cảm giác đau. Bỏng nặng làm mất hàng rào bảo vệ da, gây thất thoát huyết tương lớn dẫn đến sốc giảm thể tích và tạo điều kiện cho vi khuẩn xâm nhập trực tiếp gây nhiễm trùng huyết hoại tử.",
      symptoms: [
        "Da đỏ rực, đau rát dữ dội, sưng nề nhẹ (Bỏng độ 1).",
        "Hình thành các bọng nước chứa dịch huyết thanh trong suốt, đau đớn tăng lên khi bọng nước căng (Bỏng độ 2).",
        "Da cháy xém khô ráp, chuyển màu trắng bệch như sáp hoặc xám đen như than, không còn cảm giác đau rát tại trung tâm vết bỏng do dây thần kinh đã bị phá hủy hoàn toàn (Bỏng độ 3).",
        "Đối với bỏng hóa chất: da có thể bị bào mòn, biến đổi màu sắc liên tục và đau nhức ăn sâu âm ỉ."
      ],
      actions: [
        "Hạ nhiệt vết bỏng bằng nước mát sạch chảy nhẹ càng sớm càng tốt (tốt nhất trong vòng 10 phút đầu).",
        "Tháo nhẫn, đồng hồ, vòng tay trước khi vùng bỏng bị sưng nề nghẹt tuần hoàn.",
        "Che phủ vết bỏng bằng gạc ẩm vô trùng hoặc khăn ẩm sạch.",
        "Cho nạn nhân uống nước ấm pha chút muối hoặc dung dịch Oresol để bù lại lượng nước đã mất qua vết bỏng."
      ],
      donts: [
        "KHÔNG dùng nước đá hoặc đá viên chườm trực tiếp lên vết bỏng. Nhiệt độ cực lạnh của đá gây co thắt mạch máu đột ngột, làm giảm máu nuôi dưỡng vùng da tổn thương và gây ra hiện tượng bỏng lạnh đè lên bỏng nóng, làm hoại tử mô sâu thêm nghiêm trọng.",
        "KHÔNG bôi kem đánh răng, mỡ trăn, nước mắm, cồn, dầu hỏa hay đắp các loại lá cây thuốc nam lên vết bỏng. Các chất này ngăn cản sự thoát nhiệt của vết bỏng dưới da, làm vết bỏng ăn sâu hơn, chứa vô số vi khuẩn gây nhiễm trùng sâu khó điều trị và để lại sẹo co rút.",
        "KHÔNG tự ý chọc vỡ các bọng nước. Lớp màng bọng nước là lá chắn vô trùng tự nhiên tốt nhất chống lại nhiễm khuẩn ngoại lai."
      ]
    }
  },
  fractures: {
    title: "Gãy xương & Chấn thương chi",
    imagePath: "./assets/fracture.png",
    steps: [
      {
        title: "Bất động và để nằm yên",
        desc: "Khuyên nạn nhân giữ nguyên tư thế chấn thương. Tránh tối đa dịch chuyển nạn nhân hoặc chi bị thương trừ khi có mối đe dọa cháy nổ hiện trường sạt lở.",
        imagePath: "./assets/fracture.png"
      },
      {
        title: "Cầm máu vết thương hở nhẹ nhàng",
        desc: "Nếu gãy xương hở (đầu xương đâm thủng da rách chảy máu), băng ép nhẹ xung quanh vết thương để cầm máu. Tuyệt đối KHÔNG tìm cách ấn đầu xương gãy chui vào trong da.",
        imagePath: "./assets/fracture.png"
      },
      {
        title: "Cố định bằng nẹp cứng",
        desc: "Tìm nẹp tre, gỗ hoặc bìa carton dày. Đặt nẹp dọc theo chi chấn thương, chiều dài nẹp phải đủ dài vượt qua <strong>cả hai khớp (khớp trên và khớp dưới)</strong> của vùng xương bị gãy.",
        imagePath: "./assets/fracture.png"
      },
      {
        title: "Buộc nẹp lót vải mềm",
        desc: "Lót bông hoặc vải mềm ở đầu nẹp và khớp xương lồi để tránh cọ xát. Dùng dây vải buộc cố định nẹp vào chi chắc chắn nhưng không bó quá chặt cản trở máu lưu thông.",
        imagePath: "./assets/fracture.png"
      },
      {
        title: "Chườm lạnh giảm sưng nề",
        desc: "Bọc đá lạnh trong một chiếc khăn sạch đặt chườm lên vùng sưng đau trong 15-20 phút. Tránh đặt đá trực tiếp lên da để ngừa bỏng lạnh.",
        imagePath: "./assets/fracture.png"
      }
    ],
    theory: {
      physiology: "Gãy xương là tình trạng mất tính liên tục của xương do chấn thương lực mạnh. Gãy xương kín da nguyên vẹn ít nguy hiểm hơn gãy xương hở. Gãy xương hở khiến tủy xương tiếp xúc trực tiếp với không khí, vi khuẩn xâm nhập dễ gây viêm xương tủy xương mãn tính rất khó điều trị. Ngoài ra đầu xương gãy rất sắc nhọn, nếu di chuyển chi vô ý sẽ làm đầu xương cắt đứt động mạch lớn kế bên gây chảy máu trong dữ dội (như gãy xương đùi có thể gây mất 1-1.5 lít máu trong cơ đùi dẫn đến sốc chấn thương tử vong).",
      symptoms: [
        "Đau đớn dữ dội tại vị trí gãy, đau chói tăng lên khi có lực tác động nhẹ hoặc cố gắng cử động chi.",
        "Chi bị biến dạng, lệch trục, ngắn chi hoặc gập góc bất thường so với chi lành.",
        "Vùng chấn thương sưng to nhanh chóng, bầm tím lan rộng dưới da do đứt mạch máu nuôi xương.",
        "Mất hoàn toàn chức năng vận động của chi bị thương.",
        "Nghe hoặc cảm nhận thấy tiếng lạo xạo xương (tiếng cọ xát của hai đầu xương gãy) khi di chuyển nhẹ chi."
      ],
      actions: [
        "Khuyên nạn nhân nằm yên, dùng tay nâng đỡ giữ thẳng chi chấn thương.",
        "Cố định xương gãy bằng nẹp vượt qua hai khớp. Ví dụ gãy xương cẳng chân phải cố định nẹp từ đùi đến gót chân (vượt khớp gối và khớp cổ chân).",
        "Buộc dây nẹp ở trên và dưới vị trí gãy chi.",
        "Sau khi buộc nẹp, kiểm tra xem các ngón tay/chân có bị lạnh, tím hoặc mất cảm giác không để nới dây kịp thời."
      ],
      donts: [
        "KHÔNG cố gắng kéo nắn, bẻ thẳng hoặc đẩy đầu xương gãy bị lòi ra ngoài chui vào trong da. Việc kéo nắn không có chuyên môn sẽ làm đầu xương sắc nhọn cắt đứt dây thần kinh gây liệt vĩnh viễn và cắt đứt động mạch gây chảy máu hoại tử chi.",
        "KHÔNG bóp dầu nóng, đắp cồn hoặc đắp lá cây giã dập lên vết thương chấn thương kín (dầu nóng làm giãn mạch tăng chảy máu trong khiến vùng chấn thương sưng nề nặng hơn).",
        "KHÔNG cố di chuyển nạn nhân khi chưa được cố định nẹp xương vững chắc."
      ]
    }
  },
  snakebite: {
    title: "Rắn cắn / Độc cắn",
    imagePath: "./assets/snakebite.png",
    steps: [
      {
        title: "Để nạn nhân bất động nằm yên",
        desc: "Đưa nạn nhân ra xa vùng nguy hiểm. Khuyên nằm yên tĩnh tuyệt đối, không co duỗi cử động chi bị cắn vì vận động sẽ đẩy nhanh nọc độc theo hệ bạch huyết về tim.",
        imagePath: "./assets/snakebite.png"
      },
      {
        title: "Tháo đồ trang sức chi bị cắn",
        desc: "Nhanh chóng tháo nhẫn, vòng tay hoặc giày dép của chi bị cắn vì vùng tổn thương sẽ sưng nề rất nhanh, gây chèn ép tuần hoàn máu dẫn đến hoại tử ngón tay/chân.",
        imagePath: "./assets/snakebite.png"
      },
      {
        title: "Băng ép bất động (PIT) từ đầu chi",
        desc: "Dùng băng thun y tế (hoặc vải sạch) quấn chặt vừa phải từ ngón chân/ngón tay quấn ngược lên trên toàn bộ chi bị cắn. Lực quấn tương đương như băng bó bong gân.",
        imagePath: "./assets/snakebite.png"
      },
      {
        title: "Nẹp cố định chi cắn",
        desc: "Dùng nẹp gỗ cố định chi đã băng để nạn nhân không thể co duỗi cử động chi đó. Để chi nằm thấp hơn hoặc bằng mức của tim.",
        imagePath: "./assets/snakebite.png"
      },
      {
        title: "Không rạch vết cắn, không hút nọc",
        desc: "<strong>TUYỆT ĐỐI KHÔNG:</strong> Rạch da vết cắn, giác hơi hút nọc độc, đắp lá cây, hay buộc dây garo thắt chặt (garo bóp nghẹt có thể gây hoại tử phải cưa chi). Gọi 115 đưa đi cấp cứu ngay.",
        imagePath: "./assets/snakebite.png"
      }
    ],
    theory: {
      physiology: "Rắn độc được chia thành hai nhóm chính: nhóm độc tố thần kinh (như rắn cạp nong, cạp nia, hổ mang chúa) gây liệt cơ hô hấp, suy hô hấp ngừng thở và nhóm độc tố huyết học (như rắn lục đuôi đỏ, rắn chàm quạp) gây rối loạn đông máu nặng, chảy máu không cầm và hoại tử chi lan rộng. Nọc độc di chuyển chủ yếu qua hệ thống mạch bạch huyết dưới da nhờ sự co bóp của cơ bắp khi cử động. Kỹ thuật băng ép bất động (Pressure Immobilisation Technique - PIT) làm chậm dòng chảy bạch huyết mà không cản mạch máu động mạch, cầm giữ nọc độc tại chi bị cắn lâu hơn chờ tiêm huyết thanh kháng độc.",
      symptoms: [
        "Có 2 dấu vết răng nanh (dấu móc độc) cách nhau khoảng 0.5-1 cm trên da (phân biệt với nhiều vết răng nhỏ li ti vòng cung của rắn lành).",
        "Vùng cắn sưng nề rất nhanh, bầm tím đen, đau nhức buốt dữ dội lan dần lên gốc chi.",
        "Triệu chứng thần kinh (rắn độc thần kinh): sụp mi mắt, nhìn mờ, nuốt ngẹn khó thở, yếu liệt cơ toàn thân, ngừng thở.",
        "Triệu chứng chảy máu (rắn lục độc): máu chảy rỉ liên tục từ vết cắn không đông, tiểu ra máu, chảy máu chân răng."
      ],
      actions: [
        "Nằm bất động hoàn toàn chi bị cắn. Giữ bình tĩnh làm chậm nhịp tim.",
        "Thực hiện băng ép bất động (PIT) bằng băng thun bản rộng quấn từ ngón chân/tay quấn lên trên toàn chi.",
        "Đặt nẹp gỗ/tre cố định chi cắn thẳng, để chi nằm ngang hoặc thấp hơn mức tim.",
        "Ghi nhớ hình dáng, màu sắc con rắn (hoặc chụp ảnh nếu an toàn) để giúp bác sĩ xác định loại huyết thanh kháng độc phù hợp nhanh nhất.",
        "Gọi 115 chuyển đến bệnh viện lớn có sẵn huyết thanh kháng nọc."
      ],
      donts: [
        "KHÔNG thắt dây garo bóp nghẹt động mạch chi. Garo thắt chặt chặn hoàn toàn dòng máu nuôi chi, khi nọc độc bị nhốt lại ở chi với nồng độ cao sẽ phá hủy cơ nhanh chóng gây hoại tử thối chi, dẫn đến biến chứng buộc phải cưa cụt chi tổn thương.",
        "KHÔNG rạch rộng vết thương vết cắn hay dùng giác hút độc. Vết rạch gây tổn thương thêm mạch máu và dây thần kinh, đồng thời gây chảy máu ồ ạt không cầm (do độc tố gây giảm đông máu). Hút nọc bằng miệng có thể gây ngộ độc trực tiếp cho người sơ cứu qua vết xước lợi răng.",
        "KHÔNG đắp các loại lá cây dập nát, đất cát vì đưa thêm vi khuẩn uốn ván trực tiếp vào sâu trong máu gây nhiễm trùng máu nguy kịch."
      ]
    }
  }
};

/* ==========================================================================
   APP INITIALIZATION & SERVICE WORKER REGISTRATION
   ========================================================================== */
window.addEventListener('load', () => {
  // Populate theory list dynamically with new detailed templates
  generateTheoryLibrary();
  
  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('Service Worker registered successfully:', reg.scope);
        
        // Listen for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('Có bản cập nhật mới! Đang tải lại ứng dụng...', 4000);
              setTimeout(() => {
                window.location.reload();
              }, 1500);
            }
          });
        });
      })
      .catch(err => {
        console.error('Service Worker registration failed:', err);
      });
  }

  // Set initial online/offline status
  updateOnlineStatus();
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Initialize medical records form from localStorage
  loadMedicalInfo();

  // Initialize Tab Switch Navigation
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTabId = item.getAttribute('data-tab');
      switchTab(targetTabId);
    });
  });

  // Category filter listeners
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.getAttribute('data-filter');
      
      // Update active button UI
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      filterEmergencyCards(category);
    });
  });

  // Setup Sound Metronome trigger on Stepper
  const stepperSoundBtn = document.getElementById('stepper-cpr-sound-btn');
  if (stepperSoundBtn) {
    stepperSoundBtn.addEventListener('click', toggleStepperMetronome);
  }

  // Setup initial quiz
  loadQuizQuestion();

  // Display version Display from constants
  const versionDisplay = document.getElementById('version-display');
  if (versionDisplay) {
    versionDisplay.textContent = APP_VERSION;
  }
});

/* ==========================================================================
   TAB NAVIGATION SYSTEM
   ========================================================================== */
function switchTab(tabId) {
  // Hide all tabs
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => tab.classList.remove('active'));

  // Deactivate all nav items
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');
  navItems.forEach(item => item.classList.remove('active'));

  // Show active tab
  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.classList.add('active');
  }

  // Activate matching nav button
  const activeNav = document.querySelector(`.bottom-nav .nav-item[data-tab="${tabId}"]`);
  if (activeNav) {
    activeNav.classList.add('active');
  }

  // Stop any active metronome when leaving tabs
  stopMetronome();
}

function updateOnlineStatus() {
  const badge = document.getElementById('offline-badge');
  if (badge) {
    if (navigator.onLine) {
      badge.textContent = "Trực Tuyến";
      badge.classList.remove('offline');
      badge.style.backgroundColor = "var(--accent-teal)";
    } else {
      badge.textContent = "Ngoại Tuyến (Offline)";
      badge.classList.add('offline');
      badge.style.backgroundColor = "var(--text-muted)";
    }
  }
}

/* ==========================================================================
   EMERGENCY FILTER LOGIC
   ========================================================================== */
function filterEmergencyCards(category) {
  const cards = document.querySelectorAll('.emergency-card');
  cards.forEach(card => {
    const cardCat = card.getAttribute('data-category');
    if (category === 'all' || cardCat === category) {
      card.style.display = 'flex';
    } else {
      card.style.display = 'none';
    }
  });
}

/* ==========================================================================
   EMERGENCY STEPPER OVERLAY LOGIC
   ========================================================================== */
function openEmergency(id) {
  currentEmergencyId = id;
  currentStepIndex = 0;

  const data = emergencyData[id];
  if (!data) return;

  const overlay = document.getElementById('emergency-overlay');
  const title = document.getElementById('stepper-title');
  
  title.textContent = data.title;
  overlay.classList.add('active');
  
  renderCurrentStep();
}

function closeEmergency() {
  const overlay = document.getElementById('emergency-overlay');
  overlay.classList.remove('active');
  
  stopMetronome();
  currentEmergencyId = '';
}

function renderCurrentStep() {
  const data = emergencyData[currentEmergencyId];
  if (!data) return;

  const step = data.steps[currentStepIndex];
  const stepContainer = document.getElementById('step-container');
  const dotsContainer = document.getElementById('stepper-dots');
  const specialControls = document.getElementById('stepper-special-controls');

  // Insert Step Contents with photorealistic img instead of SVG template
  stepContainer.innerHTML = `
    <div class="step-number">Bước ${currentStepIndex + 1} / ${data.steps.length}</div>
    <h3 class="step-title">${step.title}</h3>
    <div class="step-svg-wrapper" id="step-image-container">
      <img src="${step.imagePath}" alt="${step.title}">
    </div>
    <p class="step-instruction">${step.desc}</p>
  `;

  // Generate dots indicator
  dotsContainer.innerHTML = '';
  for (let i = 0; i < data.steps.length; i++) {
    const dot = document.createElement('span');
    dot.className = `step-dot ${i === currentStepIndex ? 'active' : ''}`;
    dotsContainer.appendChild(dot);
  }

  // Show metronome control panel ONLY for Cardiac Arrest and during the main CPR steps (e.g., Step 4 onwards)
  if (currentEmergencyId === 'cardiac_arrest' && currentStepIndex >= 3) {
    specialControls.style.display = 'flex';
  } else {
    specialControls.style.display = 'none';
    stopMetronome();
  }

  // Update button states
  const prevBtn = document.getElementById('stepper-prev');
  const nextBtn = document.getElementById('stepper-next');

  prevBtn.disabled = (currentStepIndex === 0);
  
  if (currentStepIndex === data.steps.length - 1) {
    nextBtn.textContent = 'Hoàn thành ✓';
    nextBtn.classList.add('danger-action');
  } else {
    nextBtn.textContent = 'Tiếp theo →';
    nextBtn.classList.remove('danger-action');
  }
}

function nextStep() {
  const data = emergencyData[currentEmergencyId];
  if (!data) return;

  if (currentStepIndex < data.steps.length - 1) {
    currentStepIndex++;
    renderCurrentStep();
  } else {
    // End of stepper
    closeEmergency();
  }
}

function prevStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    renderCurrentStep();
  }
}

/* ==========================================================================
   WEB AUDIO API: SYNTESIZED WOODBLOCK METRONOME SOUND (For Stepper CPR)
   ========================================================================== */
function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playWoodblockSound() {
  if (!audioCtx) return;
  
  // Resume context if suspended (browser security)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  
  // Synthesize woodblock sound
  const oscClick = audioCtx.createOscillator();
  const gainClick = audioCtx.createGain();
  
  oscClick.type = 'triangle';
  oscClick.frequency.setValueAtTime(880, now);
  // Pitch decay
  oscClick.frequency.exponentialRampToValueAtTime(180, now + 0.05);

  gainClick.gain.setValueAtTime(0.7, now);
  gainClick.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  oscClick.connect(gainClick);
  gainClick.connect(audioCtx.destination);
  
  oscClick.start(now);
  oscClick.stop(now + 0.06);
}

function startMetronome(bpmVal) {
  initAudio();
  stopMetronome();

  const intervalMs = (60 / bpmVal) * 1000;
  isMetronomePlaying = true;
  
  const pulseIndicator = document.getElementById('stepper-pulse-indicator');

  metronomeInterval = setInterval(() => {
    playWoodblockSound();
    
    // Visual flash sync
    if (pulseIndicator) {
      pulseIndicator.classList.add('flash');
      setTimeout(() => pulseIndicator.classList.remove('flash'), 120);
    }
  }, intervalMs);
}

function stopMetronome() {
  if (metronomeInterval) {
    clearInterval(metronomeInterval);
    metronomeInterval = null;
  }
  isMetronomePlaying = false;
  
  const stepperSoundBtn = document.getElementById('stepper-cpr-sound-btn');
  if (stepperSoundBtn) {
    stepperSoundBtn.textContent = `🔊 Bật nhịp ép tim chuẩn (${metronomeBpm} BPM)`;
    stepperSoundBtn.classList.remove('active');
  }
}

function toggleStepperMetronome() {
  const btn = document.getElementById('stepper-cpr-sound-btn');
  if (isMetronomePlaying) {
    stopMetronome();
  } else {
    startMetronome(metronomeBpm);
    btn.textContent = '🔇 Tắt nhịp ép tim';
    btn.classList.add('active');
  }
}

/* ==========================================================================
   TAB 3: INTERACTIVE QUIZ ENGINE
   ========================================================================== */
function loadQuizQuestion() {
  const questionEl = document.getElementById('quiz-question');
  const optionsEl = document.getElementById('quiz-options');
  const explanationEl = document.getElementById('quiz-explanation');
  const nextBtn = document.getElementById('quiz-next-btn');
  const progressEl = document.getElementById('quiz-progress');

  if (!questionEl) return;

  const questionData = quizData[currentQuizIndex];
  
  progressEl.textContent = `Câu hỏi ${currentQuizIndex + 1} / ${quizData.length}`;
  questionEl.textContent = questionData.question;
  optionsEl.innerHTML = '';
  explanationEl.style.display = 'none';
  nextBtn.style.display = 'none';
  quizAnswered = false;

  questionData.options.forEach((opt, idx) => {
    const btn = document.createElement('div');
    btn.className = 'quiz-option';
    btn.textContent = opt;
    btn.addEventListener('click', () => handleQuizAnswer(idx, btn));
    optionsEl.appendChild(btn);
  });
}

function handleQuizAnswer(selectedIndex, selectedBtn) {
  if (quizAnswered) return; // Answer locked
  
  quizAnswered = true;
  const questionData = quizData[currentQuizIndex];
  const options = document.querySelectorAll('.quiz-option');
  const explanationEl = document.getElementById('quiz-explanation');
  const nextBtn = document.getElementById('quiz-next-btn');

  // Check correct option
  if (selectedIndex === questionData.answer) {
    selectedBtn.classList.add('correct');
    quizScore++;
  } else {
    selectedBtn.classList.add('incorrect');
    options[questionData.answer].classList.add('correct'); // Highlight correct answer
  }

  // Display explanation text
  explanationEl.textContent = questionData.explanation;
  explanationEl.style.display = 'block';
  
  nextBtn.style.display = 'block';
}

function nextQuizQuestion() {
  if (currentQuizIndex < quizData.length - 1) {
    currentQuizIndex++;
    loadQuizQuestion();
  } else {
    // End of quiz
    displayQuizResult();
  }
}

function displayQuizResult() {
  const container = document.getElementById('quiz-container');
  let rating = "";
  
  if (quizScore === quizData.length) {
    rating = "Bác sĩ thực thụ! 🩺 Bạn đã nắm vững lý thuyết.";
  } else if (quizScore >= 3) {
    rating = "Khá tốt! 🩹 Bạn đã có kỹ năng cơ bản để ứng cứu.";
  } else {
    rating = "Cần ôn tập lại! 📚 Hãy đọc thêm phần Lý thuyết để nắm chắc hơn.";
  }

  container.innerHTML = `
    <div class="quiz-progress">Hoàn thành</div>
    <div class="quiz-question" style="font-size: 1.2rem; text-align: center; margin: 15px 0;">Kết quả luyện tập trắc nghiệm</div>
    <div style="font-size: 2.2rem; font-weight: 800; color: var(--accent-teal); text-align: center; margin: 15px 0;">
      ${quizScore} / ${quizData.length}
    </div>
    <p style="text-align: center; color: var(--text-secondary); margin-bottom: 25px; font-weight: 500;">${rating}</p>
    <button class="action-btn" onclick="restartQuiz()">Luyện tập lại</button>
  `;
}

function restartQuiz() {
  currentQuizIndex = 0;
  quizScore = 0;
  
  // Reconstruct quiz HTML structure
  const container = document.getElementById('quiz-container');
  container.innerHTML = `
    <div class="quiz-progress" id="quiz-progress">Câu hỏi 1/5</div>
    <div class="quiz-question" id="quiz-question">Đang tải câu hỏi...</div>
    <div class="quiz-options" id="quiz-options"></div>
    <div class="quiz-explanation" id="quiz-explanation"></div>
    <button class="action-btn" id="quiz-next-btn" style="display: none;" onclick="nextQuizQuestion()">Câu tiếp theo</button>
  `;
  
  loadQuizQuestion();
}

/* ==========================================================================
   TAB 2: THEORY DYNAMIC LIBRARY & FILTER
   ========================================================================== */
function generateTheoryLibrary() {
  const listEl = document.getElementById('theory-list');
  if (!listEl) return;

  listEl.innerHTML = '';
  
  for (const [key, data] of Object.entries(emergencyData)) {
    const card = document.createElement('article');
    card.className = 'theory-section-card';
    card.setAttribute('data-id', key);

    card.innerHTML = `
      <h2>
        <span style="font-size:1.6rem; line-height:1;">🩺</span>
        ${data.title}
      </h2>
      <div class="theory-svg-box">
        <img src="${data.imagePath}" alt="${data.title}">
      </div>
      
      <div class="theory-block physiology-block" style="background-color: rgba(59, 130, 246, 0.04); border-left: 4px solid var(--accent-blue); padding: 12px 14px; border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0; margin-bottom: 15px; text-align: left;">
        <h4 style="color: var(--accent-blue);">🔬 Cơ chế sinh lý học & Nguyên nhân</h4>
        <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 5px; line-height: 1.6;">${data.theory.physiology}</p>
      </div>

      <div class="theory-block symptoms-block" style="background-color: rgba(245, 158, 11, 0.04); border-left: 4px solid var(--accent-amber); padding: 12px 14px; border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0; margin-bottom: 15px; text-align: left;">
        <h4 style="color: var(--accent-amber);">⚠️ Triệu chứng & Dấu hiệu nhận biết</h4>
        <ul style="margin-top: 5px; padding-left: 15px; list-style-type: disc;">
          ${data.theory.symptoms.map(symptom => `<li style="font-size: 0.88rem; color: var(--text-secondary); margin-bottom: 4px;">${symptom}</li>`).join('')}
        </ul>
      </div>
      
      <div class="theory-block dos" style="text-align: left;">
        <h4>✓ Hướng dẫn xử lý sơ cứu chi tiết</h4>
        <ul>
          ${data.theory.actions.map(action => `<li>${action}</li>`).join('')}
        </ul>
      </div>

      <div class="theory-block donts" style="text-align: left;">
        <h4>✕ Hành động cấm kỵ tuyệt đối tránh</h4>
        <ul>
          ${data.theory.donts.map(dont => `<li>${dont}</li>`).join('')}
        </ul>
      </div>
    `;

    listEl.appendChild(card);
  }
}

function filterTheory() {
  const query = document.getElementById('theory-search-input').value.trim().toLowerCase();
  const cards = document.querySelectorAll('.theory-section-card');
  const clearBtn = document.getElementById('search-clear');

  if (query.length > 0) {
    clearBtn.style.display = 'block';
  } else {
    clearBtn.style.display = 'none';
  }

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    if (text.includes(query)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

function clearSearch() {
  document.getElementById('theory-search-input').value = '';
  document.getElementById('search-clear').style.display = 'none';
  filterTheory();
}

/* ==========================================================================
   TAB 4: PERSONAL MEDICAL CARD (LOCAL STORAGE)
   ========================================================================== */
function saveMedicalInfo(event) {
  event.preventDefault();

  const profile = {
    name: document.getElementById('med-name').value.trim(),
    blood: document.getElementById('med-blood').value,
    birth: document.getElementById('med-birth').value,
    conditions: document.getElementById('med-conditions').value.trim(),
    allergies: document.getElementById('med-allergies').value.trim(),
    contact: document.getElementById('med-contact').value.trim()
  };

  localStorage.setItem('med_profile_115', JSON.stringify(profile));
  
  const feedback = document.getElementById('form-feedback');
  feedback.textContent = "Hồ sơ y tế của bạn đã được lưu thành công! ✓";
  
  setTimeout(() => {
    feedback.textContent = "";
  }, 3000);
}

function loadMedicalInfo() {
  const saved = localStorage.getItem('med_profile_115');
  if (!saved) return;

  try {
    const profile = JSON.parse(saved);
    
    document.getElementById('med-name').value = profile.name || '';
    document.getElementById('med-blood').value = profile.blood || '';
    document.getElementById('med-birth').value = profile.birth || '';
    document.getElementById('med-conditions').value = profile.conditions || '';
    document.getElementById('med-allergies').value = profile.allergies || '';
    document.getElementById('med-contact').value = profile.contact || '';
  } catch (e) {
    console.error("Error loading medical profile:", e);
  }
}

/* ==========================================================================
   PWA FORCE UPDATE MECHANISM
   ========================================================================== */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast-notification');
  const toastMsg = document.getElementById('toast-msg');

  if (toast && toastMsg) {
    toastMsg.textContent = message;
    toast.classList.add('active');

    setTimeout(() => {
      toast.classList.remove('active');
    }, duration);
  }
}

function checkAppUpdate() {
  showToast('Đang kiểm tra bản cập nhật mới nhất...', 2500);

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(reg => {
        // Trigger manual check on service worker file
        reg.update()
          .then(updatedReg => {
            if (updatedReg && updatedReg.installing) {
              showToast('Có phiên bản mới! Đang tải xuống bộ đệm...', 3000);
            } else if (updatedReg && updatedReg.waiting) {
              showToast('Đã tải phiên bản mới. Đang làm mới...', 2000);
              setTimeout(() => {
                updatedReg.waiting.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }, 1200);
            } else {
              // Wait 1.5s then show status
              setTimeout(() => {
                showToast(`Bạn đang sử dụng bản mới nhất v${APP_VERSION} ✓`, 3000);
              }, 1200);
            }
          })
          .catch(err => {
            console.warn('Manual update check failed:', err);
            showToast('Lỗi mạng. Vui lòng kiểm tra lại kết nối.', 3000);
          });
      })
      .catch(err => {
        showToast('Không có kết nối Service Worker.', 3000);
      });
  } else {
    showToast('Trình duyệt không hỗ trợ chạy ngoại tuyến PWA.', 3000);
  }
}
