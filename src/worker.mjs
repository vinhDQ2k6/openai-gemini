export default {
  async fetch(request, env, ctx) {
    // 1. CẤU HÌNH CORS (GIẤY THÔNG HÀNH)
    // Cái này để trình duyệt không chặn Janitor AI
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "*", // Chấp nhận mọi loại header
    };

    // 2. XỬ LÝ PREFLIGHT (Cái lỗi "Failed to fetch" chết tiệt)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 3. XÁC ĐỊNH ĐÍCH ĐẾN (GOOGLE GEMINI)
      // Dùng endpoint chuẩn OpenAI của Google (v1beta/openai)
      // Janitor gửi đến: .../v1/chat/completions
      // Ta chuyển sang: https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
      
      const url = new URL(request.url);
      
      // Mặc định trỏ về endpoint chat/completions của Google
      let targetUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

      // 4. CHUẨN BỊ REQUEST ĐỂ GỬI ĐI
      // Giữ nguyên Body và Header (bao gồm Key API m nhập bên Janitor)
      const newRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
      });

      // 5. GỌI SANG GOOGLE
      const response = await fetch(newRequest);

      // 6. XỬ LÝ KẾT QUẢ TRẢ VỀ
      // Clone response để thêm CORS header vào
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers),
          ...corsHeaders, // QUAN TRỌNG: Gắn thêm giấy thông hành vào đây
        },
      });

      return newResponse;

    } catch (e) {
      // Nếu có lỗi sập server thì báo về
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { 
            "Content-Type": "application/json",
            ...corsHeaders 
        },
      });
    }
  },
};
