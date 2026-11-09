import { NextRequest, NextResponse } from 'next/server';
import { SUPPORT_AGENTS, solveSupportQuery } from '@/lib/support-ai-brain';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentName = 'Esma', history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Mesaj boş olamaz.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // 1. If Gemini API Key is available, use real Google Gemini 1.5 Flash!
    if (apiKey) {
      try {
        const systemPrompt = `
Sen RANDEVORY Online Randevu ve Rezervasyon platformunun Canlı Destek Masasında görevli gerçek bir insan müşteri temsilcisisin. Adın: ${agentName}.
KURALLAR:
1. Asla yapay zeka, bot, dil modeli olduğunu söyleme veya ima etme. Gerçek, samimi, kibar, profesyonel bir Türk çalışan gibi konuş.
2. Karşıdaki müşteri ne sorarsa sorsun (günlük hal hatır, esnaf dertleri, teknik sorular, şifre, randevu çakışması, personel izinleri, fiyatlar, fatura, hava durumu, espri) samimi ve duruma özel yanıt ver.
3. Yanıtların ne çok uzun ne çok kısa olsun (genellikle 2-4 doğal cümle). Kalıplaşmış "Mesajınızı aldım ve okudum" gibi cümleler ASLA kurma.
4. Kişisel sorular sorulursa (yaş, nereli olduğun, medeni halin, telefonun, instagramın): Şirket gizlilik kuralları gereği temsilcilerin özel bilgilerini paylaşamadığını kibarca belirt ve platform konusunda yardıma hazır olduğunu söyle.
5. RANDEVORY PLATFORM BİLGİSİ:
- Kuaför, berber, güzellik merkezi, klinik, kafe, restoran, oyun salonu ve her türlü randevulu işletme kullanır.
- İşletmeler "randevory.com/isletme-adi" linkini Instagram biyolarına koyup 7/24 randevu toplarlar.
- Masa rezervasyonu modülü kafe/restoranlar için aktiftir. Berberlerde gereksiz kalabalık yapmasın diye varsayılan olarak gizlidir.
- Takvim akıllıdır: Personelin çalışma saatlerine ve hizmetin dakikasına (ör. 30 dk saç kesimi) göre sonraki saati otomatik öteler, çakışmayı %100 engeller.
- Müşterilere 4 haneli SMS onay kodu (OTP) gider, sahte numarayla randevu alınamaz.
- Gelmeyen (No-Show) müşteriler işletme tarafından tek tuşla Kara Listeye alınabilir ve bir daha dükkandan randevu alamazlar.
- Paketler Shopier üzerinden kredi kartıyla güvenli ödenir (Ücretsiz, Standart, Pro).
        `.trim();

        // Prepare contents with recent history (last 6 messages)
        const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

        if (Array.isArray(history) && history.length > 0) {
          const recent = history.slice(-6);
          for (const h of recent) {
            if (h.sender === 'user' && h.text) {
              contents.push({ role: 'user', parts: [{ text: h.text }] });
            } else if ((h.sender === 'admin' || h.sender === 'ai') && h.text) {
              contents.push({ role: 'model', parts: [{ text: h.text }] });
            }
          }
        }

        // Add current user message
        contents.push({ role: 'user', parts: [{ text: message }] });

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: systemPrompt }],
            },
            contents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 250,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText && generatedText.trim()) {
            return NextResponse.json({
              reply: generatedText.trim(),
              source: 'gemini',
            });
          }
        }
      } catch (geminiErr) {
        console.error('Gemini call error:', geminiErr);
      }
    }

    // 2. Intelligent Fallback if GEMINI_API_KEY is not yet provided
    const resolution = solveSupportQuery(message);
    const agent = SUPPORT_AGENTS.find((a) => a.name === agentName) || SUPPORT_AGENTS[0];

    // For general queries, return friendly contextual answer
    return NextResponse.json({
      reply: resolution.solution,
      source: 'fallback',
      quickActions: resolution.quickActions,
    });
  } catch (error: any) {
    console.error('Support AI Reply route error:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası oluştu.' },
      { status: 500 }
    );
  }
}
