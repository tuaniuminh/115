/* ==========================================================================
   APPLICATION LOGIC - SƠ CỨU 115 PWA (v1.0.0)
   ========================================================================== */

const APP_VERSION = '1.0.0';

// Global Audio Context for Metronome
let audioCtx = null;
let metronomeInterval = null;
let isMetronomePlaying = false;
let metronomeBpm = 104; // 104 BPM is perfect (standard 100-120)

// CPR Training Game variables
let lastTapTime = 0;
let tapIntervals = [];
let totalTaps = 0;
let correctTaps = 0;
let cprFeedbackTimer = null;
let isGameAudioActive = false;

// Quiz State variables
let currentQuizIndex = 0;
let quizScore = 0;
let quizAnswered = false;

// Stepper Overlay variables
let currentEmergencyId = '';
let currentStepIndex = 0;

/* ==========================================================================
   DATABASE: EMERGENCY GUIDES (8 SITUATIONS)
   ========================================================================== */
const emergencyData = {
  cardiac_arrest: {
    title: "Ngừng tim & tuần hoàn",
    steps: [
      {
        title: "Đảm bảo an toàn hiện trường",
        desc: "Kiểm tra mối nguy xung quanh (điện giật, xe cộ, khí độc). Đảm bảo hiện trường an toàn cho bạn và nạn nhân trước khi tiến lại gần.",
        svgId: "svg-cpr-pos"
      },
      {
        title: "Kiểm tra phản ứng và gọi 115",
        desc: "Lay mạnh vai nạn nhân và hỏi lớn: <strong>'Anh/Chị có nghe rõ tôi nói không?'</strong>. Nếu nạn nhân bất tỉnh, không thở hoặc thở ngáp cá, lập tức <strong>gọi cấp cứu 115</strong> hoặc nhờ người xung quanh gọi và tìm máy khử rung tim (AED).",
        svgId: "svg-cpr-pos"
      },
      {
        title: "Đặt nạn nhân nằm ngửa",
        desc: "Đặt nạn nhân nằm ngửa trên một mặt phẳng cứng, bằng phẳng để chuẩn bị thực hiện hồi sức tim phổi (CPR). Nhấc nhẹ cằm nạn nhân để đường thở thẳng.",
        svgId: "svg-cpr-pos"
      },
      {
        title: "Kỹ thuật đan tay nhấn tim",
        desc: "Đặt gốc bàn tay thứ nhất lên trung tâm ngực nạn nhân (nửa dưới xương ức). Đặt bàn tay thứ hai lên trên và đan chéo các ngón tay. Nhấc ngón tay lên để không đè vào xương sườn.",
        svgId: "svg-cpr-hands"
      },
      {
        title: "Ép tim ngoài lồng ngực đúng cách",
        desc: "Giữ hai cánh tay hoàn toàn thẳng, vai vuông góc với ngực nạn nhân. Dùng trọng lượng cơ thể ép ngực lún sâu từ <strong>5 - 6 cm</strong> với tốc độ <strong>100 - 120 lần/phút</strong>. (Bật nhịp đập bên dưới để hỗ trợ).",
        svgId: "svg-cpr-pos"
      },
      {
        title: "Thổi ngạt (Hô hấp nhân tạo) nếu được đào tạo",
        desc: "Thực hiện chu kỳ: <strong>30 lần ép tim</strong> và <strong>2 lần thổi ngạt</strong>. Nếu không biết thổi ngạt hoặc không có màng lọc y tế, hãy tiếp tục <strong>chỉ ép tim liên tục</strong> cho đến khi có nhân viên y tế hoặc máy AED đến.",
        svgId: "svg-cpr-pos"
      }
    ]
  },
  choking: {
    title: "Hóc dị vật / Tắc đường thở",
    steps: [
      {
        title: "Nhận biết dấu hiệu hóc dị vật",
        desc: "Nạn nhân ôm cổ họng, mặt đỏ gay hoặc tím tái, không thể nói, ho hay thở được. Hỏi lớn: <strong>'Bạn bị hóc xương/dị vật phải không?'</strong>. Nếu nạn nhân gật đầu, lập tức hành động.",
        svgId: "svg-heimlich"
      },
      {
        title: "Khuyên nạn nhân ho mạnh",
        desc: "Nếu nạn nhân vẫn còn ho hoặc nói được, hãy đứng cạnh khuyên họ cố gắng ho thật mạnh để tống dị vật ra ngoài tự nhiên. Tuyệt đối không dùng tay móc mù trừ khi nhìn rõ dị vật.",
        svgId: "svg-heimlich"
      },
      {
        title: "Đánh lưng 5 lần (Back Blows)",
        desc: "Đứng hơi chếch sau lưng nạn nhân, đỡ ngực nạn nhân và nghiêng họ về phía trước. Dùng gốc bàn tay vỗ mạnh <strong>5 lần vào vùng lưng giữa hai bả vai</strong>.",
        svgId: "svg-heimlich"
      },
      {
        title: "Thủ thuật Heimlich: Tư thế đứng",
        desc: "Nếu dị vật không ra, đứng sau lưng nạn nhân, vòng hai tay ôm quanh eo của họ. Nghiêng nạn nhân về phía trước.",
        svgId: "svg-heimlich"
      },
      {
        title: "Khóa tay thủ thuật Heimlich",
        desc: "Nắm một bàn tay thành nắm đấm. Đặt ngón cái của nắm đấm vào vùng bụng <strong>ngay trên rốn và dưới xương ức</strong> của nạn nhân. Dùng tay còn lại ôm chặt lấy nắm đấm.",
        svgId: "svg-heimlich"
      },
      {
        title: "Giật mạnh bụng (Abdominal Thrusts)",
        desc: "Giật nắm đấm mạnh vào trong bụng và hướng lên trên <strong>5 lần liên tục</strong>. Lặp lại chu kỳ 5 lần vỗ lưng và 5 lần giật bụng cho đến khi dị vật văng ra hoặc nạn nhân bất tỉnh (nếu bất tỉnh chuyển sang CPR).",
        svgId: "svg-heimlich"
      }
    ]
  },
  bleeding: {
    title: "Chảy máu nghiêm trọng",
    steps: [
      {
        title: "Bảo vệ bản thân & Đánh giá",
        desc: "Nếu có thể, hãy đeo găng tay y tế hoặc dùng túi nilon để tránh tiếp xúc trực tiếp với máu. Đặt nạn nhân nằm nghỉ ngơi.",
        svgId: "svg-tourniquet"
      },
      {
        title: "Băng ép trực tiếp lên vết thương",
        desc: "Dùng một miếng gạc sạch, khăn sạch hoặc quần áo đặt trực tiếp lên vết thương chảy máu. Dùng bàn tay ép chặt để ngăn máu chảy. Nếu máu thấm qua lớp băng đầu tiên, đè thêm một lớp khác lên trên, không bỏ lớp cũ.",
        svgId: "svg-tourniquet"
      },
      {
        title: "Nâng cao chi bị thương",
        desc: "Trong khi ép, nếu chi (tay/chân) bị thương không bị gãy xương, hãy nâng nó cao hơn mức tim của nạn nhân để giảm áp lực máu đến vết thương.",
        svgId: "svg-tourniquet"
      },
      {
        title: "Khi nào đặt ga-rô (Tourniquet)?",
        desc: "Nếu máu chảy xối xả từ động mạch lớn (chi bị đứt lìa, đạn bắn) và băng ép trực tiếp không thể cầm máu, lập tức dùng dây ga-rô chuyên dụng hoặc vải chắc để thắt chặt chi.",
        svgId: "svg-tourniquet"
      },
      {
        title: "Kỹ thuật thắt ga-rô chuẩn",
        desc: "Đặt dây ga-rô phía trên vết thương <strong>5 - 7 cm</strong> (về phía tim), không đặt đè lên khớp khuỷu hay khớp gối. Siết chặt dây, dùng một thanh gậy nhỏ xoắn cho tới khi máu ngừng hẳn. Cố định thanh gậy.",
        svgId: "svg-tourniquet"
      },
      {
        title: "Ghi thời gian ga-rô",
        desc: "Viết rõ thời gian đặt ga-rô lên trán nạn nhân hoặc mảnh giấy đính kèm (ví dụ: 'T: 14h30') để báo nhân viên y tế. Tuyệt đối không tự ý cởi ga-rô sau khi buộc.",
        svgId: "svg-tourniquet"
      }
    ]
  },
  drowning: {
    title: "Đuối nước",
    steps: [
      {
        title: "Đưa nạn nhân lên bờ an toàn",
        desc: "Sử dụng phao cứu sinh, gậy dài hoặc dây thừng để kéo nạn nhân vào bờ. Chỉ bơi ra cứu nếu bạn được huấn luyện kỹ thuật cứu đuối nước. Tuyệt đối không để nạn nhân kéo ghì mình xuống nước.",
        svgId: "svg-recovery"
      },
      {
        title: "Kiểm tra ý thức và nhịp thở",
        desc: "Đặt nạn nhân nằm ngửa trên nền đất cứng, khô ráo. Áp tai vào mũi nạn nhân, nhìn lồng ngực xem có nhấp nhô không trong 10 giây. Gọi 115 ngay lập tức.",
        svgId: "svg-recovery"
      },
      {
        title: "Khai thông đường thở",
        desc: "Ngửa đầu nạn nhân ra sau và nâng cằm để mở rộng đường thở. Nhanh chóng dùng ngón tay móc bù sạch bùn đất, rong rêu (nếu có) trong miệng nạn nhân.",
        svgId: "svg-recovery"
      },
      {
        title: "Thổi ngạt cấp cứu đầu tiên",
        desc: "Đuối nước gây thiếu oxy cấp. Lập tức bóp mũi nạn nhân, áp miệng thổi ngạt <strong>2 - 5 hơi thật mạnh</strong> để đưa oxy vào phổi của họ.",
        svgId: "svg-recovery"
      },
      {
        title: "Thực hiện CPR nếu không thở",
        desc: "Nếu ngực không phồng lên và nạn nhân không thở lại, lập tức thực hiện chu kỳ ép tim và thổi ngạt: <strong>30 lần ép tim, 2 lần thổi ngạt</strong>. Kiên trì thực hiện liên tục.",
        svgId: "svg-cpr-pos"
      },
      {
        title: "Giữ ấm & Nghiêng an toàn khi tỉnh",
        desc: "Khi nạn nhân thở lại hoặc có phản ứng, cởi bỏ quần áo ướt, đắp chăn giữ ấm. Đặt nạn nhân nằm nghiêng an toàn để tránh hít sặc nước phổi hoặc dịch nôn vào đường thở.",
        svgId: "svg-recovery"
      }
    ]
  },
  stroke: {
    title: "Đột quỵ (Stroke)",
    steps: [
      {
        title: "Nhận biết chữ F - Face (Mặt)",
        desc: "Yêu cầu nạn nhân cười lớn. Quan sát xem một bên mặt có bị xệ xuống, méo miệng hay nhân trung bị lệch sang một bên hay không.",
        svgId: "svg-stroke-fast"
      },
      {
        title: "Nhận biết chữ A - Arms (Tay)",
        desc: "Yêu cầu nạn nhân giơ cả hai tay lên cao. Xem một bên cánh tay có bị yếu, tê liệt, không thể nhấc lên hoặc bị rơi tự do xuống hay không.",
        svgId: "svg-stroke-fast"
      },
      {
        title: "Nhận biết chữ S - Speech (Giọng nói)",
        desc: "Yêu cầu nạn nhân lặp lại một câu nói đơn giản (ví dụ: 'Trời hôm nay rất đẹp'). Lắng nghe xem họ nói có bị ngọng nghịu, ú ớ hoặc không thể phát ra tiếng hay không.",
        svgId: "svg-stroke-fast"
      },
      {
        title: "Nhận biết chữ T - Time (Thời gian vàng)",
        desc: "Nếu nạn nhân xuất hiện bất kỳ dấu hiệu nào trên (ngay cả khi biến mất nhanh), hãy gọi <strong>115</strong> lập tức. Ghi nhớ thời điểm đầu tiên phát hiện triệu chứng.",
        svgId: "svg-stroke-fast"
      },
      {
        title: "Đặt nạn nhân ở tư thế an toàn",
        desc: "Để nạn nhân nằm đầu cao khoảng 30 độ (nếu còn tỉnh). Nếu nạn nhân lơ mơ hoặc nôn ói, đặt nằm nghiêng an toàn để tránh tắc nghẽn đường thở.",
        svgId: "svg-recovery"
      },
      {
        title: "Những điều cấm kỵ",
        desc: "<strong>KHÔNG</strong> tự ý cho nạn nhân uống thuốc (kể cả an cung ngưu hoàng), không cho ăn hay uống nước vì dễ gây sặc tử vong. <strong>KHÔNG</strong> chích máu đầu ngón tay hay cạo gió.",
        svgId: "svg-stroke-fast"
      }
    ]
  },
  burns: {
    title: "Bỏng nhiệt & hóa chất",
    steps: [
      {
        title: "Loại bỏ nguồn nhiệt & quần áo nóng",
        desc: "Đưa nạn nhân ra xa nguồn nhiệt. Nhanh chóng nhưng nhẹ nhàng cởi bỏ quần áo hoặc đồ trang sức bị dính chất nóng trước khi vùng bỏng bị sưng nề. Nếu quần áo dính chặt vết bỏng, không cố giật ra.",
        svgId: "svg-burns"
      },
      {
        title: "Xả nước mát liên tục",
        desc: "Ngâm hoặc xả nhẹ vùng bị bỏng dưới vòi nước mát sạch (nhiệt độ 15-25°C) trong <strong>15 - 20 phút</strong>. Việc này giúp hạ nhiệt lớp da sâu, giảm đau và giảm độ sâu vết bỏng.",
        svgId: "svg-burns"
      },
      {
        title: "Che phủ vết bỏng nhẹ nhàng",
        desc: "Dùng băng gạc sạch hoặc màng bọc thực phẩm sạch che phủ lỏng vết bỏng để tránh nhiễm trùng từ bụi bẩn xung quanh. Tuyệt đối không băng chặt.",
        svgId: "svg-burns"
      },
      {
        title: "KHÔNG dùng nước đá hoặc bôi chất lạ",
        desc: "Tuyệt đối không dùng đá lạnh trực tiếp (gây bỏng lạnh làm hoại tử da). Không bôi kem đánh răng, mỡ trăn, dầu hỏa, hoặc nước mắm vì sẽ làm tăng nguy cơ nhiễm trùng nghiêm trọng.",
        svgId: "svg-burns"
      },
      {
        title: "Bỏng hóa chất: Rửa nhiều nước hơn",
        desc: "Nếu bị bỏng hóa chất (axit, kiềm), xả nước liên tục nhiều hơn (ít nhất 30-45 phút) để hòa tan hoàn toàn hóa chất. Nếu là hóa chất khô, dùng bàn chải phủi sạch trước khi xả nước.",
        svgId: "svg-burns"
      }
    ]
  },
  fractures: {
    title: "Gãy xương & Chấn thương chi",
    steps: [
      {
        title: "Không di chuyển chi bị thương",
        desc: "Khuyên nạn nhân nằm yên. Tránh tối đa việc dịch chuyển chi bị thương trừ khi hiện trường xung quanh có nguy cơ cháy nổ, sạt lở đe dọa tính mạng.",
        svgId: "svg-fractures"
      },
      {
        title: "Cầm máu nếu có vết thương hở",
        desc: "Nếu gãy xương hở (xương lồi ra ngoài hoặc chảy máu), đè băng gạc sạch quanh vết thương để cầm máu. Tuyệt đối không tìm cách ấn xương gãy tụt vào trong da.",
        svgId: "svg-fractures"
      },
      {
        title: "Tìm vật liệu làm nẹp cố định",
        desc: "Tìm nẹp gỗ, thanh tre, bìa carton dày hoặc cành cây thẳng có độ dài đủ để vượt qua <strong>cả khớp trên và khớp dưới</strong> của vùng xương bị gãy.",
        svgId: "svg-fractures"
      },
      {
        title: "Kỹ thuật cố định nẹp",
        desc: "Đặt bông, vải mềm lót vào các đầu xương và khớp khớp tiếp xúc nẹp. Dùng dây vải buộc cố định nẹp vào chi. Buộc chắc chắn nhưng không siết quá chặt làm chặn dòng máu nuôi.",
        svgId: "svg-fractures"
      },
      {
        title: "Chườm lạnh giảm sưng đau",
        desc: "Bọc túi đá lạnh trong một chiếc khăn sạch rồi chườm lên vùng chấn thương 15-20 phút. Tránh đặt đá trực tiếp lên da để ngăn ngừa bỏng lạnh.",
        svgId: "svg-fractures"
      }
    ]
  },
  snakebite: {
    title: "Rắn cắn / Độc cắn",
    steps: [
      {
        title: "Đảm bảo an toàn & Giữ yên nạn nhân",
        desc: "Đưa nạn nhân ra xa con rắn. Để nạn nhân nằm yên hoàn toàn, không chạy nhảy hay cử động vì sẽ làm nọc độc di chuyển về tim nhanh hơn.",
        svgId: "svg-pit"
      },
      {
        title: "Tháo đồ trang sức chi bị cắn",
        desc: "Nhanh chóng tháo nhẫn, vòng tay hoặc giày dép của chi bị cắn vì vùng tổn thương sẽ sưng nề rất nhanh, gây nghẹt tuần hoàn máu.",
        svgId: "svg-pit"
      },
      {
        title: "Băng ép bất động (PIT) từ đầu chi",
        desc: "Dùng băng thun y tế (hoặc vải sạch) quấn chặt vừa phải từ ngón chân/ngón tay quấn ngược lên trên toàn bộ chi bị cắn. Lực quấn tương đương như băng bó bong gân.",
        svgId: "svg-pit"
      },
      {
        title: "Nẹp cố định chi cắn",
        desc: "Dùng nẹp gỗ cố định chi đã băng để nạn nhân không thể co duỗi cử động chi đó. Để chi nằm thấp hơn hoặc bằng mức của tim.",
        svgId: "svg-pit"
      },
      {
        title: "Không rạch vết cắn, không hút nọc",
        desc: "<strong>TUYỆT ĐỐI KHÔNG:</strong> Rạch da vết cắn, giác hơi hút nọc độc, đắp lá cây, hay buộc dây garo thắt chặt (garo bóp nghẹt có thể gây hoại tử phải cưa chi). Gọi 115 đưa đi cấp cứu ngay.",
        svgId: "svg-pit"
      }
    ]
  }
};

/* ==========================================================================
   DATABASE: QUIZ DATA (5 SITUATIONS)
   ========================================================================== */
const quizData = [
  {
    question: "Bạn phát hiện một người nằm bất động trên đường. Việc đầu tiên bạn cần làm theo đúng quy trình sơ cứu là gì?",
    options: [
      "Lập tức quỳ xuống ép tim CPR cho nạn nhân ngay.",
      "Lay shoulders nạn nhân hỏi lớn và kiểm tra an toàn hiện trường xung quanh trước khi tiếp cận.",
      "Đổ nước ấm vào miệng nạn nhân để kích thích tỉnh táo.",
      "Cõng nạn nhân chạy đi tìm bệnh viện gần nhất."
    ],
    answer: 1,
    explanation: "Đảm bảo an toàn hiện trường là nguyên tắc sống còn số 1 để tránh bạn cũng trở thành nạn nhân thứ hai (như điện giật, xe tông). Sau đó mới kiểm tra phản ứng của nạn nhân."
  },
  {
    question: "Một người lớn đang ăn bỗng nhiên ôm cổ họng, mặt tím tái, không thể ho, nói hay thở được. Bạn nên thực hiện hành động nào?",
    options: [
      "Dùng tay thọc sâu vào cổ họng để móc dị vật ra.",
      "Bắt nạn nhân uống thật nhiều nước để trôi dị vật xuống dạ dày.",
      "Đứng sau lưng thực hiện thủ thuật Heimlich (giật bụng mạnh hướng vào trong và lên trên).",
      "Cho nạn nhân nằm ngửa rồi đè lên bụng họ."
    ],
    answer: 2,
    explanation: "Nạn nhân có dấu hiệu hóc dị vật hoàn toàn đường thở. Việc giật bụng bằng thủ thuật Heimlich tạo ra áp lực khí từ phổi đẩy ngược lên để tống dị vật ra ngoài. Móc tay mò mẫm có thể đẩy dị vật sâu hơn."
  },
  {
    question: "Vị trí đặt tay chính xác khi ép tim ngoài lồng ngực (CPR) cho người lớn là ở đâu?",
    options: [
      "Phía trên vùng ngực trái ngay sát tim.",
      "Nửa dưới của xương ức (khoảng giữa hai núm vú trên ngực).",
      "Vùng bụng trên rốn.",
      "Trên xương đòn vai trái."
    ],
    answer: 1,
    explanation: "Ép vào nửa dưới xương ức giúp ép trực tiếp quả tim nằm bên dưới lồng ngực vào cột sống, tạo ra lực đẩy máu tuần hoàn đi nuôi cơ thể. Ép lệch sang ngực trái có thể làm gãy xương sườn."
  },
  {
    question: "Khi sơ cứu một vết bỏng nước sôi tại nhà, điều nào sau đây là SAI và NGUY HIỂM?",
    options: [
      "Xả nước mát sạch chảy nhẹ lên vết bỏng 15-20 phút.",
      "Bôi kem đánh răng hoặc mỡ trăn trực tiếp lên vết bỏng để làm dịu da.",
      "Cởi bỏ trang sức nhẹ nhàng ở chi bị bỏng trước khi nó sưng nề.",
      "Bọc lỏng vết bỏng bằng màng bọc thực phẩm sạch."
    ],
    answer: 1, // index of "Bôi kem đánh răng..."
    explanation: "Bôi kem đánh răng, mỡ trăn hay dầu hỏa làm bịt kín nhiệt lượng dưới da, giữ vi khuẩn lại gây nhiễm trùng nghiêm trọng và làm vết bỏng ăn sâu thêm."
  },
  {
    question: "Một người đột nhiên bị méo miệng sang một bên, yếu liệt một bên cánh tay và nói ngọng ú ớ. Bạn cần làm gì?",
    options: [
      "Cho nằm nghỉ ngơi và cạo gió, chích máu đầu ngón tay.",
      "Cho uống ngay một viên thuốc An Cung Ngưu Hoàng Hoàn.",
      "Lập tức gọi cấp cứu 115 và ghi nhớ mốc thời gian xuất hiện triệu chứng.",
      "Bắt nạn nhân đứng dậy đi bộ xem có giữ thăng bằng được không."
    ],
    answer: 2,
    explanation: "Nạn nhân có triệu chứng đột quỵ chuẩn FAST. Thời gian là não. Cần gọi 115 đưa đến cơ sở y tế có điều trị tái thông cấp tốc. Tuyệt đối không cho uống thuốc/ăn uống vì nguy cơ sặc phổi rất cao."
  }
];

/* ==========================================================================
   APP INITIALIZATION & SERVICE WORKER REGISTRATION
   ========================================================================== */
window.addEventListener('load', () => {
  // Populate theory list dynamically
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

  // Setup CPR simulation chest button click listener
  const cprChestBtn = document.getElementById('cpr-chest-btn');
  if (cprChestBtn) {
    cprChestBtn.addEventListener('click', handleCPRGameClick);
  }

  // Setup Sound Metronome trigger on Stepper
  const stepperSoundBtn = document.getElementById('stepper-cpr-sound-btn');
  if (stepperSoundBtn) {
    stepperSoundBtn.addEventListener('click', toggleStepperMetronome);
  }

  // Setup Practice Sound Metronome trigger
  const cprGuideSoundBtn = document.getElementById('cpr-guide-sound-btn');
  if (cprGuideSoundBtn) {
    cprGuideSoundBtn.addEventListener('click', togglePracticeMetronome);
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

  // Insert Step Contents
  stepContainer.innerHTML = `
    <div class="step-number">Bước ${currentStepIndex + 1} / ${data.steps.length}</div>
    <h3 class="step-title">${step.title}</h3>
    <div class="step-svg-wrapper" id="step-svg-container"></div>
    <p class="step-instruction">${step.desc}</p>
  `;

  // Clone and append SVG from templates library in HTML
  const svgLibrary = document.getElementById('svg-library');
  const targetSvg = svgLibrary.querySelector(`#${step.svgId}`);
  if (targetSvg) {
    const svgClone = targetSvg.cloneNode(true);
    svgClone.removeAttribute('id');
    stepContainer.querySelector('#step-svg-container').appendChild(svgClone);
  }

  // Generate dots indicator
  dotsContainer.innerHTML = '';
  for (let i = 0; i < data.steps.length; i++) {
    const dot = document.createElement('span');
    dot.className = `step-dot ${i === currentStepIndex ? 'active' : ''}`;
    dotsContainer.appendChild(dot);
  }

  // Show metronome control panel ONLY for Cardiac Arrest and during the main CPR steps (e.g., Step 5 onwards)
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
   WEB AUDIO API: SYNTESIZED WOODBLOCK METRONOME SOUND
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
  // 1. High frequency sine oscillator decayed rapidly for the click
  const oscClick = audioCtx.createOscillator();
  const gainClick = audioCtx.createGain();
  
  oscClick.type = 'triangle';
  oscClick.frequency.setValueAtTime(900, now);
  // Pitch decay
  oscClick.frequency.exponentialRampToValueAtTime(120, now + 0.05);

  gainClick.gain.setValueAtTime(0.6, now);
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
    stepperSoundBtn.textContent = '🔊 Bật nhịp ép tim chuẩn (104 BPM)';
    stepperSoundBtn.classList.remove('active');
  }

  const cprGuideSoundBtn = document.getElementById('cpr-guide-sound-btn');
  if (cprGuideSoundBtn) {
    cprGuideSoundBtn.textContent = 'Bật âm hỗ trợ';
    cprGuideSoundBtn.classList.remove('secondary');
  }
}

function toggleStepperMetronome() {
  const btn = document.getElementById('stepper-cpr-sound-btn');
  if (isMetronomePlaying) {
    stopMetronome();
    btn.textContent = '🔊 Bật nhịp ép tim chuẩn (104 BPM)';
    btn.classList.remove('active');
  } else {
    startMetronome(metronomeBpm);
    btn.textContent = '🔇 Tắt nhịp ép tim';
    btn.classList.add('active');
  }
}

function togglePracticeMetronome() {
  const btn = document.getElementById('cpr-guide-sound-btn');
  if (isMetronomePlaying) {
    stopMetronome();
  } else {
    startMetronome(metronomeBpm);
    btn.textContent = 'Tắt âm hỗ trợ';
    btn.classList.add('secondary');
  }
}

/* ==========================================================================
   TAB 3: CPR TRAINING INTERACTIVE GAME
   ========================================================================== */
function handleCPRGameClick() {
  initAudio();
  
  const now = Date.now();
  
  // Play click sound on tap
  playWoodblockSound();

  // Ring animation
  const ring = document.getElementById('cpr-ring');
  ring.classList.remove('active');
  void ring.offsetWidth; // Trigger reflow to restart animation
  ring.classList.add('active');

  totalTaps++;

  if (lastTapTime > 0) {
    const delta = now - lastTapTime;
    
    // Save only intervals within realistic limits (300ms to 1200ms)
    if (delta >= 250 && delta <= 1500) {
      tapIntervals.push(delta);
      if (tapIntervals.length > 5) {
        tapIntervals.shift(); // Keep last 5 taps for smooth average
      }

      // Calculate average BPM
      const avgInterval = tapIntervals.reduce((a, b) => a + b, 0) / tapIntervals.length;
      const bpm = Math.round(60000 / avgInterval);
      
      document.getElementById('cpr-bpm').textContent = bpm;

      // Validate BPM
      const feedback = document.getElementById('cpr-feedback');
      if (bpm < 100) {
        feedback.textContent = "Quá chậm (< 100 BPM) - Hãy nhấn tim nhanh hơn!";
        feedback.className = "cpr-feedback too-slow";
      } else if (bpm > 120) {
        feedback.textContent = "Quá nhanh (> 120 BPM) - Hãy nhấn chậm lại một chút!";
        feedback.className = "cpr-feedback too-fast";
      } else {
        feedback.textContent = "Hoàn hảo (100 - 120 BPM) - Hãy duy trì nhịp độ này!";
        feedback.className = "cpr-feedback perfect";
        correctTaps++;
      }

      // Update Accuracy percentage
      const accuracy = Math.round((correctTaps / (totalTaps - 1)) * 100);
      document.getElementById('cpr-accuracy').textContent = accuracy + '%';
    }
  }

  document.getElementById('cpr-count').textContent = totalTaps;
  lastTapTime = now;

  // Reset feedback string after inactivity
  clearTimeout(cprFeedbackTimer);
  cprFeedbackTimer = setTimeout(() => {
    document.getElementById('cpr-feedback').textContent = "Tiếp tục nhấn tim để duy trì nhịp...";
    document.getElementById('cpr-feedback').className = "cpr-feedback";
    lastTapTime = 0;
    tapIntervals = [];
  }, 2500);
}

function resetCPRGame() {
  totalTaps = 0;
  correctTaps = 0;
  lastTapTime = 0;
  tapIntervals = [];
  
  document.getElementById('cpr-bpm').textContent = '0';
  document.getElementById('cpr-accuracy').textContent = '--%';
  document.getElementById('cpr-count').textContent = '0';
  
  const feedback = document.getElementById('cpr-feedback');
  feedback.textContent = "Nhấn nút bên trên để bắt đầu luyện tập...";
  feedback.className = "cpr-feedback";
  
  stopMetronome();
}

/* ==========================================================================
   TAB 3: INTERACTIVE QUIZ ENGINE
   ========================================================================== */
function loadQuizQuestion() {
  const container = document.getElementById('quiz-container');
  const questionEl = document.getElementById('quiz-question');
  const optionsEl = document.getElementById('quiz-options');
  const explanationEl = document.getElementById('quiz-explanation');
  const nextBtn = document.getElementById('quiz-next-btn');
  const progressEl = document.getElementById('quiz-progress');

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

    // Extract first step image (or generic SVG)
    let firstSvg = '';
    const firstStep = data.steps[0];
    
    // Find the SVG contents from DOM template
    const svgLibrary = document.getElementById('svg-library');
    const targetSvg = svgLibrary.querySelector(`#${firstStep.svgId}`);
    
    let svgHtml = '';
    if (targetSvg) {
      svgHtml = targetSvg.outerHTML;
    }

    // Build the dos/donts based on steps content or defaults
    let dosList = '';
    let dontsList = '';

    if (key === 'cardiac_arrest') {
      dosList = `<li>Nhấn tim liên tục chuẩn nhịp 100-120 lần/phút.</li><li>Ngửa đầu nâng cằm giữ đường thở thẳng.</li><li>Gọi 115 lập tức.</li>`;
      dontsList = `<li>Không ép lên ngực trái (tránh gãy xương sườn).</li><li>Không ngừng ép tim quá 10 giây.</li><li>Không cho người bất tỉnh ăn uống.</li>`;
    } else if (key === 'choking') {
      dosList = `<li>Thực hiện vỗ lưng 5 lần xen kẽ giật bụng 5 lần.</li><li>Gặp người béo/bà bầu, ép ngực thay vì bụng.</li>`;
      dontsList = `<li>Không móc dị vật mù bằng tay (dễ đẩy dị vật sâu hơn).</li><li>Không cho nạn nhân uống nước khi đang hóc nghẹt.</li>`;
    } else if (key === 'bleeding') {
      dosList = `<li>Băng ép trực tiếp có lực lên vết thương.</li><li>Đặt garo cách vết thương 5-7cm nếu đứt động mạch lớn.</li>`;
      dontsList = `<li>Không cởi bỏ lớp băng cũ đã thấm máu (làm vỡ cục đông).</li><li>Không dùng dây thun nhỏ bó chặt làm hoại tử.</li>`;
    } else if (key === 'stroke') {
      dosList = `<li>Gọi 115 ngay khi phát hiện triệu chứng méo mặt, yếu tay, ngọng giọng.</li><li>Đặt nằm đầu cao 30 độ hoặc nằm nghiêng an toàn.</li>`;
      dontsList = `<li>Không bôi dầu, cạo gió, chích máu ngón tay gây nhiễm trùng.</li><li>Không cho ăn uống bất cứ thứ gì (nguy cơ nghẹt sặc rất cao).</li>`;
    } else if (key === 'burns') {
      dosList = `<li>Xả nước mát sạch nhiệt độ phòng 15-20 phút.</li><li>Cởi bỏ nhẹ nhàng trang sức trước khi vết bỏng sưng.</li>`;
      dontsList = `<li>Không chườm nước đá lạnh trực tiếp (gây bỏng lạnh da).</li><li>Không bôi kem đánh răng, nước mắm, mỡ trăn lên da.</li>`;
    } else if (key === 'snakebite') {
      dosList = `<li>Băng ép thun toàn bộ chi từ ngón chân/tay đi lên.</li><li>Bất động nẹp chi cắn và nằm yên thấp hơn tim.</li>`;
      dontsList = `<li>Không rạch vết cắn, không hút nọc độc, không đắp lá lạ.</li><li>Không thắt garo bóp nghẹt khiến nọc dồn cục hoại tử cưa chi.</li>`;
    } else {
      // default
      dosList = `<li>Giữ bình tĩnh, đánh giá hiện trường an toàn.</li><li>Gọi 115 khi tình huống vượt tầm kiểm soát.</li>`;
      dontsList = `<li>Không tự ý di chuyển nạn nhân bị chấn thương cột sống.</li>`;
    }

    card.innerHTML = `
      <h2>
        <span style="font-size:1.6rem; line-height:1;">🩺</span>
        ${data.title}
      </h2>
      <div class="theory-svg-box">
        ${svgHtml}
      </div>
      
      <div class="theory-block dos">
        <h4>Nên làm / Hướng dẫn sơ cứu</h4>
        <ul>
          ${dosList}
        </ul>
      </div>

      <div class="theory-block donts">
        <h4>Cấm kỵ tuyệt đối tránh</h4>
        <ul>
          ${dontsList}
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

  toastMsg.textContent = message;
  toast.classList.add('active');

  setTimeout(() => {
    toast.classList.remove('active');
  }, duration);
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
